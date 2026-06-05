import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 방문 기록 (통계용) — 하루 1회/게스트, 클라이언트에서 중복 방지
export async function POST(req: Request) {
  try {
    const { guestId } = await req.json().catch(() => ({}));
    let uid: string | null = null;
    try {
      const sb = await createServerSupabase();
      const { data: { user } } = await sb.auth.getUser();
      uid = user?.id || null;
    } catch {}
    await supabaseAdmin.from("usage_logs").insert({
      user_id: uid,
      guest_id: guestId || null,
      action: "visit",
    });
  } catch {}
  return NextResponse.json({ ok: true });
}
