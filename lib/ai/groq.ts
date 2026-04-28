import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeWithGroq(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  const koreanGuard = `\n\n[최우선 규칙] 반드시 100% 한국어로만 답변하세요. 일본어(タイプ, カテゴリ 등), 중국어, 영어 단어를 절대 섞지 마세요. MBTI 약자(ENFP 등)만 영어 허용. "타입"은 한국어로 쓰세요. 이모지는 전체 답변에서 최대 2~3개만. 문장마다 이모지 넣지 마세요. 오타 금지.`;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt + koreanGuard },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.8,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "";
}
