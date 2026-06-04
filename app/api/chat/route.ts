import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { runAnalysisPipeline, handleFollowUp } from "@/lib/ai/pipeline";
import { getSystemPrompt, HOOK_INSTRUCTION, type AnalysisDepth } from "@/lib/ai/prompts";

// GPT-4o 사주 분석은 10~30초가 걸린다. Vercel 기본 10초 제한에 걸려
// 응답이 잘리지 않도록 함수 최대 실행시간을 늘린다. 동적 라우트로 고정.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

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
      usePremiumTicket,
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

    let depth = getDepth(plan);
    // 출석 보상 '심층 분석권' 사용 시 무료(summary)를 상세(detailed)로 한 단계 업그레이드
    if (usePremiumTicket && depth === "summary") depth = "detailed";
    let systemPrompt = getSystemPrompt(category, depth);

    // 닉네임이 있으면 시스템 프롬프트에 추가
    if (nickname) {
      systemPrompt += `\n\n## 사용자 닉네임 (필수)\n이 사람의 닉네임은 "${nickname}"이에요. 반드시 "${nickname}님"이라고 불러주세요.\n- "이 사람", "이 분" 같은 3인칭 절대 금지. 반드시 "${nickname}님"으로.\n- 첫 문장, 중간 전환, 마무리에서 "${nickname}님"을 사용하세요.\n- 예: "${nickname}님의 사주를 보면요~", "${nickname}님은 진짜~", "정리하면 ${nickname}님의 강점은~"`;
    } else {
      systemPrompt += `\n\n## 호칭 규칙 (필수)\n"이 사람", "이 분" 같은 3인칭 표현 절대 금지. 2인칭으로 직접 대화하듯이 말하세요. "사주를 보니까요~", "사주 주인공분은~" 식으로 자연스럽게.`;
    }

    // 최초 분석에만: 분석 주제 고정 + "한 줄 후킹" 지시 추가 (후속 질문 제외)
    if (!isFollowUp) {
      const TOPIC_NAMES: Record<string, string> = {
        basic: "기본 사주풀이 (타고난 성격·강점)",
        yearly: "올해 운세 (월별 흐름·좋은 달·조심할 달)",
        love: "연애·궁합 (연애 스타일·인연 시기·맞는 사람)",
        marriage: "결혼운 (결혼 시기·배우자상·결혼 생활)",
        reunion: "재회운 (재회 가능성·시기·새 인연)",
        wealth: "재물운 (돈 버는 패턴·돈 새는 이유·재물 들어오는 시기·투자/사업 적성)",
        career: "직업·적성 (맞는 직업·숨은 재능·이직 시기)",
        health: "건강운 (약한 곳·조심할 시기·생활습관)",
        "lucky-items": "행운 아이템 (행운의 색·숫자·방위·아이템)",
      };
      const topicName = TOPIC_NAMES[category] || "사주 분석";
      systemPrompt += `\n\n## 지금 분석 주제: "${topicName}" — 절대 규칙 (가장 우선)
- 사용자는 바로 이 주제를 보려고 버튼을 눌렀어요. 이번 분석은 처음부터 끝까지 오직 이 주제에만 집중하세요.
- 성격 일반론(MBTI 성격 풀이만 늘어놓기)으로 새지 마세요. 모든 문단이 이 주제와 직접 연결돼야 해요.
- 위 '카테고리' 섹션의 분석 포인트를 이 분석의 뼈대로 삼으세요. 그게 사용자가 원하는 답이에요.
- 맨 앞 한 줄 후킹(한줄요약)도 반드시 이 주제에 관한 내용이어야 해요. (예: 재물운이면 돈·재물 관련 한 줄, 연애운이면 연애 관련 한 줄)
- 마무리에서 다음 주제를 추천할 때 이 주제("${topicName}")는 빼고 '다른' 주제를 권하세요. 지금 보고 있는 주제를 또 권하면 절대 안 됩니다.

${HOOK_INSTRUCTION}`;
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
          yearPillar: analysis.saju.yearPillar,
          monthPillar: analysis.saju.monthPillar,
          dayPillar: analysis.saju.dayPillar,
          timePillar: analysis.saju.timePillar,
          eumyang: analysis.saju.eumyang,
          daeun: analysis.saju.daeun,
          seun: analysis.saju.seun,
        },
        partnerSaju: analysis.partnerSaju ? {
          ilju: analysis.partnerSaju.ilju,
          tti: analysis.partnerSaju.tti,
          ohang: analysis.partnerSaju.ohangDistribution,
          yearPillar: analysis.partnerSaju.yearPillar,
          monthPillar: analysis.partnerSaju.monthPillar,
          dayPillar: analysis.partnerSaju.dayPillar,
          timePillar: analysis.partnerSaju.timePillar,
          eumyang: analysis.partnerSaju.eumyang,
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
