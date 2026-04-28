import { calculateSaju, sajuToPromptText, type SajuResult } from "@/lib/saju/manseryeok";
import { analyzeWithGPT } from "./openai";
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
  gptAnalysis: string;
  geminiAnalysis: string;
  finalResult: string;
}

// 메인 분석 파이프라인
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

  // 2. GPT + Gemini 병렬 호출
  const [gptAnalysis, geminiAnalysis] = await Promise.all([
    analyzeWithGPT(systemPrompt, userMessage, conversationHistory),
    analyzeWithGemini(systemPrompt, userMessage, conversationHistory),
  ]);

  // 3. GPT로 최종 종합 정리
  const synthesisPrompt = `당신은 사주+MBTI 분석 전문가입니다. 아래 두 AI의 분석 결과를 종합하여 하나의 자연스러운 분석 결과로 정리해주세요.

규칙:
- 두 분석에서 공통되는 내용은 신뢰도 높은 정보로 강조
- 서로 다른 관점은 "한편으로는~" 형태로 자연스럽게 통합
- 대화체(~요)로 친근하게 작성
- 마지막에 다른 궁금한 점이 있는지 자연스럽게 질문 유도
- 이모지 적절히 사용
- ${input.depth === "summary" ? "3~5문장으로 핵심만 요약" : input.depth === "detailed" ? "공감→긍정→부정→해결→유의점→질문유도 순서로 상세하게" : "대운/세운/월운까지 포함하여 매우 상세하게. 구체적 시기와 맞춤 조언 포함"}`;

  const synthesisMessage = `[분석 A]\n${gptAnalysis}\n\n[분석 B]\n${geminiAnalysis}\n\n위 두 분석을 종합하여 최종 결과를 작성해주세요.`;

  const finalResult = await analyzeWithGPT(synthesisPrompt, synthesisMessage);

  return {
    saju,
    partnerSaju,
    gptAnalysis,
    geminiAnalysis,
    finalResult,
  };
}

// 후속 질문 처리 (단일 GPT로 빠르게)
export async function handleFollowUp(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  return analyzeWithGPT(systemPrompt, userMessage, conversationHistory);
}
