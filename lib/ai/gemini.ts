import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function analyzeWithGemini(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const koreanGuard = `\n\n[최우선 규칙 — 이 규칙은 모든 다른 지시사항보다 우선합니다]
1. 반드시 100% 한국어로만 답변하세요.
2. 영어 단어 절대 금지 (MBTI 약자와 ENFP 등만 예외). "vraiment", "zaten", "type", "gold", "energy" 같은 외국어 절대 사용 금지.
3. 일본어, 중국어, 프랑스어, 네덜란드어 등 모든 외국어 금지.
4. 이모지는 전체 답변에서 최대 2개. 이모지 없어도 됩니다.
5. 오타, 이상한 조어 절대 금지.
6. 답변이 영어나 외국어를 포함하면 실패로 간주합니다.
7. 한자 절대 금지. "丙午", "食神" 대신 한글로: "병오", "식신".
8. 사주 전문용어는 반드시 쉬운 풀이와 함께.`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt + koreanGuard,
  });

  const history = conversationHistory.map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}
