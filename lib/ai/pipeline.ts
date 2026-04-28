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
    throw new Error("All AI providers failed");
  }

  // 3. 종합 정리
  let finalResult: string;

  if (analysisA && analysisB) {
    // 둘 다 성공 → Groq (다른 모델)로 종합
    const synthesisPrompt = `당신은 사주 상담사예요. 아래 두 분석을 참고해서 하나의 자연스러운 상담 결과를 써주세요.

절대 규칙:
- 한국어로만 작성. 일본어/영어 섞지 마세요.
- "AI", "분석 결과", "종합하면", "요약하면" 같은 기계적 표현 금지
- 카페에서 친한 언니가 사주 봐주듯이 편하게 ~요 체로
- "있잖아요", "근데", "솔직히", "진짜" 같은 구어체 자연스럽게 사용
- 글머리 기호 최소화, 자연스러운 문단으로
- 이모지는 문단 시작에만 1~2개, 매 문장마다 넣지 마세요
- 두 분석에서 겹치는 내용은 확신 있게, 다른 관점은 자연스럽게 섞어주세요
- ${input.depth === "summary" ? "3~5문장으로 핵심만. 짧고 임팩트 있게" : input.depth === "detailed" ? "공감→긍정→조심할 부분→해결법→다음 질문 유도 순서로" : "대운/세운/월운까지 포함해서 구체적 시기와 맞춤 조언"}`;

    const synthesisMessage = `[분석 A]\n${analysisA}\n\n[분석 B]\n${analysisB}\n\n위 두 분석을 종합하여 최종 결과를 작성해주세요.`;
    finalResult = await analyzeWithGroq(synthesisPrompt, synthesisMessage, [], "qwen-qwq-32b");
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
