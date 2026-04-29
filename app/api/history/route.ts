import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_LABELS: Record<string, string> = {
  basic: "종합 사주",
  yearly: "올해의 운세",
  love: "연애운",
  compatibility: "궁합",
  marriage: "결혼운",
  reunion: "재회운",
  wealth: "재물운",
  career: "직장/취업운",
  health: "건강운",
  "lucky-items": "행운 아이템",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const sessionId = searchParams.get("sessionId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // 특정 세션의 메시지 조회
  if (sessionId) {
    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(messages || []);
  }

  // 세션 목록 조회
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data: sessions, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, category, mbti, birth_date, partner_mbti, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json([]);
  }

  // 각 세션의 assistant 첫 메시지 미리보기
  const sessionIds = sessions.map((s) => s.id);
  const { data: previews } = await supabaseAdmin
    .from("chat_messages")
    .select("session_id, content")
    .in("session_id", sessionIds)
    .eq("role", "assistant")
    .order("created_at", { ascending: true });

  const previewMap: Record<string, string> = {};
  if (previews) {
    for (const p of previews) {
      if (!previewMap[p.session_id]) {
        const text = p.content.replace(/[#*_~`>\[\]()]/g, "").trim();
        previewMap[p.session_id] = text.length > 50 ? text.slice(0, 50) + "..." : text;
      }
    }
  }

  const result = sessions.map((s) => ({
    id: s.id,
    category: s.category,
    category_label: CATEGORY_LABELS[s.category] || s.category,
    mbti: s.mbti,
    birth_date: s.birth_date,
    partner_mbti: s.partner_mbti,
    preview: previewMap[s.id] || null,
    created_at: s.created_at,
  }));

  return NextResponse.json(result);
}
