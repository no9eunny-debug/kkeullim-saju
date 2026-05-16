import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY || "kkeullim2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayKST = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const todayStart = `${todayKST}T00:00:00+09:00`;

  // 지난 30일 날짜 목록
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() + 9 * 60 * 60 * 1000 - i * 86400000);
    return d.toISOString().slice(0, 10);
  }).reverse();

  const [
    profilesRes,
    todayProfilesRes,
    totalSessionsRes,
    todaySessionsRes,
    totalMessagesRes,
    sessionsWithCategoryRes,
    recentSessionsRes,
    usageLogsRes,
    dailySessionsRes,
  ] = await Promise.all([
    // 전체 회원 수
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    // 오늘 가입
    supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    // 전체 세션 수
    supabaseAdmin
      .from("chat_sessions")
      .select("*", { count: "exact", head: true }),
    // 오늘 세션 수
    supabaseAdmin
      .from("chat_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    // 전체 메시지 수
    supabaseAdmin
      .from("chat_messages")
      .select("*", { count: "exact", head: true }),
    // 카테고리별 세션 (전체)
    supabaseAdmin
      .from("chat_sessions")
      .select("category, mbti, user_id, guest_id"),
    // 최근 세션 20개
    supabaseAdmin
      .from("chat_sessions")
      .select("id, category, mbti, gender, birth_date, created_at, user_id, guest_id, analysis_depth")
      .order("created_at", { ascending: false })
      .limit(20),
    // usage_logs (최근 30일)
    supabaseAdmin
      .from("usage_logs")
      .select("user_id, guest_id, created_at")
      .gte("created_at", `${last30[0]}T00:00:00+09:00`),
    // 일별 세션 (최근 30일)
    supabaseAdmin
      .from("chat_sessions")
      .select("created_at")
      .gte("created_at", `${last30[0]}T00:00:00+09:00`),
  ]);

  // 카테고리 분포
  const categoryMap: Record<string, number> = {};
  const mbtiMap: Record<string, number> = {};
  let memberCount = 0;
  let guestCount = 0;

  (sessionsWithCategoryRes.data || []).forEach((s: any) => {
    const cat = s.category || "unknown";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;

    if (s.mbti) {
      mbtiMap[s.mbti] = (mbtiMap[s.mbti] || 0) + 1;
    }

    if (s.user_id) memberCount++;
    else guestCount++;
  });

  // 카테고리 정렬
  const categoryStats = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // MBTI 정렬 (상위 10개)
  const mbtiStats = Object.entries(mbtiMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 일별 트렌드
  const dailyMap: Record<string, number> = {};
  last30.forEach((d) => (dailyMap[d] = 0));
  (dailySessionsRes.data || []).forEach((s: any) => {
    const d = new Date(s.created_at);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    if (dailyMap[kst] !== undefined) dailyMap[kst]++;
  });

  const dailyTrend = last30.map((date) => ({
    date: date.slice(5), // MM-DD
    count: dailyMap[date],
  }));

  // 일별 사용자 (usage_logs 기반 - unique users per day)
  const dailyUsersMap: Record<string, Set<string>> = {};
  last30.forEach((d) => (dailyUsersMap[d] = new Set()));
  (usageLogsRes.data || []).forEach((l: any) => {
    const d = new Date(l.created_at);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const uid = l.user_id || l.guest_id || "anon";
    if (dailyUsersMap[kst]) dailyUsersMap[kst].add(uid);
  });

  const dailyUsers = last30.map((date) => ({
    date: date.slice(5),
    count: dailyUsersMap[date].size,
  }));

  return NextResponse.json({
    overview: {
      totalUsers: profilesRes.count || 0,
      todayNewUsers: todayProfilesRes.count || 0,
      totalSessions: totalSessionsRes.count || 0,
      todaySessions: todaySessionsRes.count || 0,
      totalMessages: totalMessagesRes.count || 0,
      memberSessions: memberCount,
      guestSessions: guestCount,
    },
    categoryStats,
    mbtiStats,
    dailyTrend,
    dailyUsers,
    recentSessions: recentSessionsRes.data || [],
  });
}
