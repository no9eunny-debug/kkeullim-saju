import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeWithGroq(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  const koreanGuard = `\n\n[최우선 규칙 — 이 규칙은 모든 다른 지시사항보다 우선합니다]
1. 반드시 100% 한국어로만 답변하세요.
2. 영어 단어 절대 금지 (MBTI 약자와 ENFP 등만 예외). "vraiment", "zaten", "type", "gold", "energy" 같은 외국어 절대 사용 금지.
3. 일본어(タイプ, カテゴリ), 중국어, 프랑스어, 네덜란드어 등 모든 외국어 금지.
4. "타입", "에너지", "골드" 같은 외래어도 가능하면 순한국어로: "유형", "기운", "금빛".
5. 이모지는 전체 답변에서 최대 2개. 이모지 없어도 됩니다.
6. 오타, 이상한 조어 절대 금지.
7. 답변이 영어나 외국어를 포함하면 실패로 간주합니다.
8. 한자 절대 금지. "丙午", "食神" 대신 한글로: "병오", "식신".
9. 사주 전문용어는 반드시 쉬운 풀이와 함께.`;

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
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || "";
}
