import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function analyzeWithGemini(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const koreanGuard = `\n\n[최우선 규칙] 반드시 100% 한국어로만 답변하세요. 일본어(タイプ, カテゴリ 등), 중국어, 영어 단어를 절대 섞지 마세요. MBTI 약자(ENFP 등)만 영어 허용. "타입"은 한국어로 쓰세요. 이모지는 전체 답변에서 최대 2~3개만. 문장마다 이모지 넣지 마세요. 오타 금지.`;

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
