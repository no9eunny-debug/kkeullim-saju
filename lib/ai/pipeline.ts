import { calculateSaju, sajuToPromptText, type SajuResult } from "@/lib/saju/manseryeok";
import { analyzeWithGPT } from "./openai";

// AI 출력 후처리: 깨진 텍스트, 한자, 외국어 제거
function cleanAiOutput(text: string): string {
  let cleaned = text;
  // 한자 제거 (CJK Unified Ideographs)
  cleaned = cleaned.replace(/[\u4E00-\u9FFF\u3400-\u4DBF]+/g, "");
  // 베트남어/특수 라틴 문자 제거 (ă, ắ, ề, ồ 등)
  cleaned = cleaned.replace(/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+/gi, "");
  // 라틴 알파벳이 한글과 붙어있는 깨진 텍스트 제거 (MBTI 4글자 약자는 보존)
  cleaned = cleaned.replace(/(?<=[가-힣])[a-zA-Z]{1,3}(?=[가-힣])/g, "");
  // 연속 라틴문자+한글 혼합 깨진 단어 (예: "ctpaner팬클럽장" → "팬클럽장")
  cleaned = cleaned.replace(/\b[a-zA-Z]+(?=[가-힣])/g, (match) => {
    if (/^[EI][NS][TF][JP]$/i.test(match)) return match;
    return "";
  });
  // 한글 사이 고립된 라틴 단어 제거 (MBTI 제외)
  cleaned = cleaned.replace(/(?<=[가-힣\s])[a-zA-Z]+(?=[가-힣\s,.])/g, (match) => {
    if (/^[EI][NS][TF][JP]$/i.test(match)) return match;
    if (match.length <= 2) return ""; // 짧은 고립 외국어
    return "";
  });
  // 빈 괄호 정리
  cleaned = cleaned.replace(/\(\s*\)/g, "");
  // 중복 공백/줄바꿈 정리
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

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

// 메인 분석 파이프라인 — GPT-4o 단독 (최고 품질)
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

  // 2. GPT-4o 단독 분석 (Gemini/Groq 제거 — 한국어 사주 분석 품질 최상)
  let finalResult: string;
  try {
    finalResult = await analyzeWithGPT(systemPrompt, userMessage, conversationHistory);
  } catch (err: any) {
    console.error("[pipeline] GPT-4o failed:", err);
    const detail = err?.message || err?.status || String(err);
    throw new Error(`GPT 오류: ${detail}`);
  }

  if (!finalResult) {
    throw new Error("AI 분석 결과가 비어있어요. 잠시 후 다시 시도해주세요.");
  }

  // 3. 후처리: 혹시 남은 한자/외국어 정리
  finalResult = cleanAiOutput(finalResult);

  return {
    saju,
    partnerSaju,
    analysisA: finalResult,
    analysisB: "",
    finalResult,
  };
}

// 후속 질문 처리 (GPT-4o)
export async function handleFollowUp(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const result = await analyzeWithGPT(systemPrompt, userMessage, conversationHistory, "gpt-4o-mini");
  return cleanAiOutput(result);
}
