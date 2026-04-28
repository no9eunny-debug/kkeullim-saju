import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId가 필요해요." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("name, plan, daily_usage, daily_usage_date")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[mypage profile]", error.message);
    return NextResponse.json({ name: null, plan: "free", daily_usage: 0 });
  }

  // 날짜 다르면 usage 0으로
  const today = new Date().toISOString().slice(0, 10);
  const usage = data.daily_usage_date === today ? (data.daily_usage || 0) : 0;

  return NextResponse.json({
    name: data.name,
    plan: data.plan || "free",
    daily_usage: usage,
  });
}
