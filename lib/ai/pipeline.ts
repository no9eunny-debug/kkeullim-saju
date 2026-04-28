import { calculateSaju, sajuToPromptText, type SajuResult } from "@/lib/saju/manseryeok";
import { analyzeWithGroq } from "./groq";
import { analyzeWithGemini } from "./gemini";

export interface AnalysisInput {
  mbti: string;
  birthDate: string;
  birthTime: string | null;
  gender: string;
  category: string;
  depth: "summary" | "detailed" | "premium";
  // 궁합용
  partnerMbti?: string;
  partnerBirthDate?: string;
  partnerBirthTime?: string;
  partnerGender?: string;
}

export interface AnalysisResult {
  saju: SajuResult;
  partnerSaju?: SajuResult;
  analysisA: string;
  analysisB: string;
  finalResult: string;
}

// 메인 분석 파이프라인
// Groq (Llama 3.3 70B) + Gemini (2.0 Flash) 병렬 → Groq (Qwen) 종합
export async function runAnalysisPipeline(
  input: AnalysisInput,
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<AnalysisResult> {
  // 1. 만세력 계산
  const saju = calculateSaju(input.birthDate, input.birthTime, input.gender);
  const sajuText = sajuToPromptText(saju, input.mbti);

  // 궁합인 경우 상대방 사주도 계산
  let partnerSaju: SajuResult | undefined;
  let partnerText = "";
  if (input.category === "compatibility" && input.partnerBirthDate) {
    partnerSaju = calculateSaju(
      input.partnerBirthDate,
      input.partnerBirthTime || null,
      input.partnerGender || "unknown"
    );
    partnerText = `\n\n[상대방 사주 정보]\n${sajuToPromptText(partnerSaju, input.partnerMbti || "모름")}`;
  }

  const userMessage = `${sajuText}${partnerText}\n\n위 사주 정보를 바탕으로 분석해주세요.`;

  // 2. Groq (Llama) + Gemini 병렬 호출
  let analysisA = "";
  let analysisB = "";

  const results = await Promise.allSettled([
    analyzeWithGroq(systemPrompt, userMessage, conversationHistory, "llama-3.3-70b-versatile"),
    analyzeWithGemini(systemPrompt, userMessage, conversationHistory),
  ]);

  analysisA = results[0].status === "fulfilled" ? results[0].value : "";
  analysisB = results[1].status === "fulfilled" ? results[1].value : "";

  if (results[0].status === "rejected") console.error("[pipeline] Groq failed:", results[0].reason);
  if (results[1].status === "rejected") console.error("[pipeline] Gemini failed:", results[1].reason);

  if (!analysisA && !analysisB) {
    throw new Error("AI 분석 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
  }

  // 3. 종합 정리
  let finalResult: string;

  if (analysisA && analysisB) {
    // 둘 다 성공 → Groq (다른 모델)로 종합
    const synthesisPrompt = `당신은 사주 전문 상담사예요. 아래 두 분석을 참고해서 하나의 최종 상담 결과를 작성하세요.

## 절대 규칙 (가장 중요)
- 100% 한국어로만. 영어/일본어/중국어/프랑스어 등 외국어 단어 절대 금지 (MBTI 약자만 예외)
- 한자(漢字) 절대 금지. "丙午", "食神", "甲木" 등 한자 표기 금지. 한글로만: "병오", "식신", "갑목"
- 사주 용어를 쓸 때 반드시 쉽게 풀어서 설명. 사주를 전혀 모르는 사람도 100% 이해할 수 있게.
- "AI", "분석 결과", "종합하면", "요약하면", "결론적으로" 같은 기계적 표현 금지
- 이모지 최대 2개. 없어도 됩니다.
- 오타 금지

## 말투와 톤
- 친한 형/언니가 진지하게 사주 봐주는 느낌
- "있잖아요", "근데 말이에요", "솔직히", "진짜" 같은 구어체
- ~요, ~거든요, ~이에요 체 사용. ~합니다/~입니다 체 금지.
- 읽는 사람이 "와 소름, 이거 나 얘기 아냐?" 하게 만드세요

## 구조 (이 순서로)
1. **결론부터** — "결론부터 말할게요." 하고 핵심을 먼저 찔러주세요. 구체적이고 과감하게.
2. **왜 그런지** — 사주와 MBTI에서 근거를 들어 설명. 읽는 사람이 "어떻게 알았지?" 하게.
3. **구체적 조언** — 빈말이 아닌 실질적인 행동 지침. "올해 하반기에는~", "이런 사람 만나면~" 식으로.
4. **조심할 점** — 겁주지 말고, "다만~" 정도로 부드럽게.
5. **다음 유도** — "근데 이게 연애 쪽으로 가면 또 다른 얘기가 나오거든요..." 식으로 다른 카테고리 유도.

## 품질 기준
- 두 분석에서 겹치는 내용은 확신 있게 강조
- 다른 관점은 "근데 재미있는 게, 다른 각도로 보면~" 식으로 자연스럽게 섞기
- 구체적인 시기, 방향, 색깔, 숫자 등 디테일을 반드시 포함
- 글머리 기호 최소화. **볼드**와 문단으로 가독성 확보
- ${input.depth === "summary" ? "반드시 1000자 이상. 핵심을 찌르되 충분히 풍부하게." : input.depth === "detailed" ? "반드시 1200자 이상. 깊이 있게 파고들어주세요." : "반드시 1500자 이상. 대운/세운/월운까지 포함, 월별 키워드와 구체적 행동 지침."}`;

    const synthesisMessage = `[분석 A]\n${analysisA}\n\n[분석 B]\n${analysisB}\n\n위 두 분석을 종합하여 최종 결과를 작성해주세요.`;
    finalResult = await analyzeWithGroq(synthesisPrompt, synthesisMessage, [], "llama-3.3-70b-versatile");
  } else {
    // 한쪽만 성공 → 그 결과를 그대로 사용
    finalResult = analysisA || analysisB;
    console.warn("[pipeline] Running with single AI result (one provider failed)");
  }

  return {
    saju,
    partnerSaju,
    analysisA,
    analysisB,
    finalResult,
  };
}

// 후속 질문 처리 (Groq으로 빠르게)
export async function handleFollowUp(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  return analyzeWithGroq(systemPrompt, userMessage, conversationHistory);
}
