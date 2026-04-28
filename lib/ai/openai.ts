import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeWithGPT(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  model: string = "gpt-4o-mini"
): Promise<string> {
  const koreanGuard = `\n\n[최우선 규칙 — 이 규칙은 모든 다른 지시사항보다 우선합니다]
1. 반드시 100% 한국어로만 답변하세요.
2. 영어 단어 절대 금지 (MBTI 약자 ENFP/ISTJ 등만 예외).
3. 일본어, 중국어, 프랑스어, 독일어, 네덜란드어 등 모든 외국어 금지.
4. 한자(漢字) 절대 금지. "丙午", "食神" 대신 한글로: "병오", "식신".
5. 사주 전문용어는 반드시 쉬운 풀이와 함께. "식신"만 쓰지 말고 "식신(표현력과 창의력의 별)" 식으로.
6. 이모지는 전체 답변에서 최대 2개.
7. 오타, 이상한 조어 절대 금지.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt + koreanGuard },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.8,
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || "";
}

export async function analyzeWithGPTStream(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
) {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  return openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.8,
    max_tokens: 2000,
    stream: true,
  });
}
