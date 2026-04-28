import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: 저장된 프로필 목록
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const guestId = searchParams.get("guestId");

  let query = supabaseAdmin
    .from("saved_profiles")
    .select("*")
    .order("is_me", { ascending: false })
    .order("updated_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (guestId) {
    query = query.eq("guest_id", guestId);
  } else {
    return NextResponse.json([]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: 프로필 저장
export async function POST(req: Request) {
  const body = await req.json();
  const { userId, guestId, name, mbti, birthDate, birthTime, gender, isMe } = body;

  if (!name || !birthDate) {
    return NextResponse.json({ error: "이름과 생년월일은 필수예요" }, { status: 400 });
  }

  // isMe가 true면 기존 is_me를 false로 변경
  if (isMe) {
    if (userId) {
      await supabaseAdmin.from("saved_profiles").update({ is_me: false }).eq("user_id", userId).eq("is_me", true);
    } else if (guestId) {
      await supabaseAdmin.from("saved_profiles").update({ is_me: false }).eq("guest_id", guestId).eq("is_me", true);
    }
  }

  const { data, error } = await supabaseAdmin.from("saved_profiles").insert({
    user_id: userId || null,
    guest_id: guestId || null,
    name,
    mbti: mbti || null,
    birth_date: birthDate,
    birth_time: birthTime || null,
    gender: gender || null,
    is_me: isMe || false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: 프로필 삭제
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  const { error } = await supabaseAdmin.from("saved_profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
