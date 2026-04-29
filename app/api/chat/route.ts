import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { runAnalysisPipeline, handleFollowUp } from "@/lib/ai/pipeline";
import { getSystemPrompt, type AnalysisDepth } from "@/lib/ai/prompts";

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
function getDepth(plan: string): AnalysisDepth {
  if (plan === "premium") return "premium";
  if (plan === "basic") return "detailed";
  return "summary";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mbti, birthDate, birthTime, gender, category, nickname,
      partnerMbti, partnerBirthDate, partnerBirthTime, partnerGender,
      userId: clientUserId, guestId, sessionId, message, isFollowUp,
    } = body;

    // 서버 측 세션에서 userId 확인 (클라이언트 전송값보다 우선)
    let userId = clientUserId || null;
    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // 세션 확인 실패 시 guest로 처리 (클라이언트 userId 무시)
      userId = null;
    }

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
      // 비회원 하루 3회 체크
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabaseAdmin
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("guest_id", guestId)
        .gte("created_at", `${today}T00:00:00.000Z`);

      if ((count || 0) >= 3) {
        return NextResponse.json({
          error: "guest_limit",
          message: "비회원은 하루 3회까지 체험 가능해요. 로그인하면 하루 7회까지 무료!",
        }, { status: 429 });
      }
    }

    const depth = getDepth(plan);
    let systemPrompt = getSystemPrompt(category, depth);

    // 닉네임이 있으면 시스템 프롬프트에 추가
    if (nickname) {
      systemPrompt += `\n\n## 사용자 닉네임 (필수)\n이 사람의 닉네임은 "${nickname}"이에요. 반드시 "${nickname}님"이라고 불러주세요.\n- "이 사람", "이 분" 같은 3인칭 절대 금지. 반드시 "${nickname}님"으로.\n- 첫 문장, 중간 전환, 마무리에서 "${nickname}님"을 사용하세요.\n- 예: "${nickname}님의 사주를 보면요~", "${nickname}님은 진짜~", "정리하면 ${nickname}님의 강점은~"`;
    } else {
      systemPrompt += `\n\n## 호칭 규칙 (필수)\n"이 사람", "이 분" 같은 3인칭 표현 절대 금지. 2인칭으로 직접 대화하듯이 말하세요. "사주를 보니까요~", "사주 주인공분은~" 식으로 자연스럽게.`;
    }

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
        partnerSaju: analysis.partnerSaju ? {
          ilju: analysis.partnerSaju.ilju,
          tti: analysis.partnerSaju.tti,
          ohang: analysis.partnerSaju.ohangDistribution,
        } : undefined,
        depth,
      });
    }

    return NextResponse.json({ result, sessionId });
  } catch (error: any) {
    console.error("[chat] error:", error);
    const msg = error?.message || "분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
