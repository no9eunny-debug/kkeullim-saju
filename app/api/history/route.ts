import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_LABELS: Record<string, string> = {
  basic: "기본 사주풀이",
  yearly: "올해 운세",
  love: "연애운",
  compatibility: "궁합",
  reunion: "재회운",
  wealth: "재물운",
  career: "직업·적성",
  health: "건강운",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, category, mbti, birth_date, birth_time, gender, partner_mbti, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[history GET]", error.message);
    return NextResponse.json({ error: "분석 기록을 불러오지 못했어요." }, { status: 500 });
  }

  const sessions = (data || []).map((s: any) => ({
    ...s,
    category_label: CATEGORY_LABELS[s.category] || s.category,
  }));

  return NextResponse.json(sessions);
}
