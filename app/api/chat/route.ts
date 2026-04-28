import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runAnalysisPipeline, handleFollowUp } from "@/lib/ai/pipeline";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 플랜별 일일 한도
const DAILY_LIMITS: Record<string, number> = {
  guest: 3,
  free: 7,
  basic: 20,
  premium: 999999,
};

// 플랜별 분석 깊이
function getDepth(plan: string): "summary" | "detailed" | "premium" {
  if (plan === "premium") return "premium";
  if (plan === "basic") return "detailed";
  return "summary";
}

// 기본 시스템 프롬프트 (에이전트가 만드는 prompts.ts가 완성되면 교체)
function getSystemPrompt(category: string, depth: string): string {
  const depthInstructions = depth === "summary"
    ? "핵심만 3~5문장으로 간결하게 요약해주세요."
    : depth === "detailed"
    ? "공감 → 긍정적 요소 → 부정적 요소 → 해결 방법 → 유의할 점 순서로 상세하게 분석해주세요. 마지막에 다른 궁금한 점을 자연스럽게 유도해주세요."
    : "대운, 세운, 월운까지 포함하여 매우 상세하게 분석해주세요. 구체적인 시기와 맞춤 조언을 포함해주세요.";

  const categoryMap: Record<string, string> = {
    basic: "기본 사주풀이 (성격, 기질, 강점, 약점)",
    yearly: "올해 운세 (세운 분석)",
    love: "연애운 (연애 패턴, 이상형, 연애 시기)",
    compatibility: "궁합 분석 (두 사람의 사주와 MBTI 궁합)",
    reunion: "재회운 (헤어진 상대와의 인연 분석)",
    wealth: "재물운 (재물 흐름, 투자 성향, 재테크 방향)",
    career: "직업·적성 (적합한 직업군, 커리어 방향)",
    health: "건강운 (취약한 부분, 건강 관리 방향)",
  };

  return `당신은 사주와 MBTI를 결합하여 분석하는 전문 상담사입니다.

분석 대상: ${categoryMap[category] || "기본 사주풀이"}

규칙:
- 한국어 대화체(~요)로 친근하고 따뜻하게
- 20~40대 여성 대상으로 공감 가는 어조
- MBTI 특성과 사주 원국을 자연스럽게 연결하여 설명
- 일주(日柱)를 '나 자신'으로 해석하는 것을 중심으로
- 오행의 균형/불균형을 성격 및 운세와 연결
- ${depthInstructions}
- 이모지는 전체 답변에서 최대 2~3개만 사용. 매 문장에 이모지 넣지 않기
- 미신이 아닌 자기 이해의 도구로 접근
- 마지막에 자연스럽게 다른 카테고리(연애운, 재물운 등)를 추천하며 질문 유도`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mbti, birthDate, birthTime, gender, category,
      partnerMbti, partnerBirthDate, partnerBirthTime, partnerGender,
      userId, guestId, sessionId, message, isFollowUp,
    } = body;

    // 사용량 체크
    let plan = "guest";
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan, daily_usage, daily_usage_date")
        .eq("id", userId)
        .single();

      if (profile) {
        plan = profile.plan || "free";
        const today = new Date().toISOString().slice(0, 10);

        // 날짜 변경 시 초기화
        if (profile.daily_usage_date !== today) {
          await supabaseAdmin.from("profiles")
            .update({ daily_usage: 0, daily_usage_date: today })
            .eq("id", userId);
        } else if (profile.daily_usage >= DAILY_LIMITS[plan]) {
          return NextResponse.json({
            error: "daily_limit",
            message: `오늘의 ${plan === "free" ? "무료" : "베이직"} 분석 횟수를 모두 사용했어요.`,
            limit: DAILY_LIMITS[plan],
          }, { status: 429 });
        }
      }
    } else if (guestId) {
      // 비회원 1회 체크
      const { count } = await supabaseAdmin
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("guest_id", guestId);

      if ((count || 0) >= 3) {
        return NextResponse.json({
          error: "guest_limit",
          message: "비회원은 하루 3회까지 체험 가능해요. 로그인하면 하루 7회까지 무료!",
        }, { status: 429 });
      }
    }

    const depth = getDepth(plan);
    const systemPrompt = getSystemPrompt(category, depth);

    let result: string;

    if (isFollowUp && sessionId) {
      // 후속 질문 — 기존 대화 히스토리 가져오기
      const { data: messages } = await supabaseAdmin
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      const history = (messages || [])
        .filter((m: any) => m.role !== "system")
        .map((m: any) => ({ role: m.role, content: m.content }));

      result = await handleFollowUp(systemPrompt, message, history);

      // 메시지 저장
      await supabaseAdmin.from("chat_messages").insert([
        { session_id: sessionId, role: "user", content: message },
        { session_id: sessionId, role: "assistant", content: result },
      ]);
    } else {
      // 최초 분석
      const analysis = await runAnalysisPipeline({
        mbti, birthDate, birthTime, gender, category, depth,
        partnerMbti, partnerBirthDate, partnerBirthTime, partnerGender,
      }, systemPrompt);

      result = analysis.finalResult;

      // 세션 생성
      const { data: session } = await supabaseAdmin.from("chat_sessions").insert({
        user_id: userId || null,
        guest_id: guestId || null,
        category,
        mbti,
        birth_date: birthDate,
        birth_time: birthTime,
        gender,
        partner_mbti: partnerMbti || null,
        partner_birth_date: partnerBirthDate || null,
        partner_birth_time: partnerBirthTime || null,
        partner_gender: partnerGender || null,
        saju_data: analysis.saju,
        analysis_depth: depth,
      }).select("id").single();

      // 메시지 저장
      if (session) {
        await supabaseAdmin.from("chat_messages").insert({
          session_id: session.id,
          role: "assistant",
          content: result,
        });
      }

      // 사용량 기록
      await supabaseAdmin.from("usage_logs").insert({
        user_id: userId || null,
        guest_id: guestId || null,
        session_id: session?.id || null,
        action: "analysis",
      });

      // 일일 사용량 증가
      if (userId) {
        try {
          await supabaseAdmin.rpc("increment_daily_usage", { uid: userId });
        } catch {
          // RPC 없으면 프로필 조회 후 +1
          const { data: p } = await supabaseAdmin.from("profiles").select("daily_usage").eq("id", userId).single();
          await supabaseAdmin.from("profiles").update({ daily_usage: (p?.daily_usage || 0) + 1 }).eq("id", userId);
        }
      }

      return NextResponse.json({
        result,
        sessionId: session?.id,
        saju: {
          ilju: analysis.saju.ilju,
          tti: analysis.saju.tti,
          ohang: analysis.saju.ohangDistribution,
        },
        depth,
      });
    }

    return NextResponse.json({ result, sessionId });
  } catch (error) {
    console.error("[chat] error:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
