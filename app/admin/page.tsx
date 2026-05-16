"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, MessageSquare, TrendingUp, BarChart3, ArrowLeft,
  RefreshCw, Eye, UserCheck, UserX,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  basic: "기본사주",
  yearly: "올해운세",
  love: "연애궁합",
  marriage: "결혼운",
  reunion: "재회운",
  wealth: "재물운",
  career: "직업적성",
  health: "건강운",
  "lucky-items": "행운아이템",
};

const CATEGORY_COLORS: Record<string, string> = {
  basic: "#8B5CF6",
  yearly: "#F59E0B",
  love: "#EF4444",
  marriage: "#EC4899",
  reunion: "#6366F1",
  wealth: "#10B981",
  career: "#3B82F6",
  health: "#14B8A6",
  "lucky-items": "#F97316",
};

interface Stats {
  overview: {
    totalUsers: number;
    todayNewUsers: number;
    totalSessions: number;
    todaySessions: number;
    totalMessages: number;
    memberSessions: number;
    guestSessions: number;
  };
  categoryStats: { name: string; count: number }[];
  mbtiStats: { name: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  dailyUsers: { date: string; count: number }[];
  recentSessions: {
    id: string;
    category: string;
    mbti: string;
    gender: string;
    birth_date: string;
    created_at: string;
    user_id: string | null;
    guest_id: string | null;
    analysis_depth: string;
  }[];
}

function BarChartSimple({
  data,
  label,
  color = "#8B5CF6",
}: {
  data: { date: string; count: number }[];
  label: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const recent = data.slice(-14); // 최근 14일만

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">{label}</p>
      <div className="flex items-end gap-1 h-32">
        {recent.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{d.count || ""}</span>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count > 0 ? 4 : 1,
                backgroundColor: d.count > 0 ? color : "#E5E7EB",
              }}
            />
            <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
              {d.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async (adminKey: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(adminKey)}`);
      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          setError("인증 키가 올바르지 않습니다.");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setStats(data);
      setAuthed(true);
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // URL에서 key 파라미터 확인
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("key");
    if (urlKey) {
      setKey(urlKey);
      fetchStats(urlKey);
    }
  }, [fetchStats]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-center mb-6">Admin Dashboard</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStats(key);
            }}
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="관리자 키 입력"
              className="w-full px-4 py-3 border rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "확인 중..." : "접속"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, categoryStats, mbtiStats, dailyTrend, dailyUsers, recentSessions } = stats;
  const totalCategorySessions = categoryStats.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <h1 className="text-lg font-bold">합리적 미신 Dashboard</h1>
          </div>
          <button
            onClick={() => fetchStats(key)}
            disabled={loading}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            icon={<Users className="w-5 h-5 text-purple-600" />}
            label="총 회원"
            value={overview.totalUsers}
            sub={`오늘 +${overview.todayNewUsers}`}
          />
          <Card
            icon={<Eye className="w-5 h-5 text-blue-600" />}
            label="총 분석"
            value={overview.totalSessions}
            sub={`오늘 ${overview.todaySessions}건`}
          />
          <Card
            icon={<MessageSquare className="w-5 h-5 text-green-600" />}
            label="총 메시지"
            value={overview.totalMessages}
          />
          <Card
            icon={<UserCheck className="w-5 h-5 text-amber-600" />}
            label="회원 / 비회원"
            value={`${overview.memberSessions} / ${overview.guestSessions}`}
            sub={`회원 ${Math.round((overview.memberSessions / (overview.memberSessions + overview.guestSessions || 1)) * 100)}%`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <BarChartSimple
              data={dailyTrend}
              label="일별 분석 수 (최근 14일)"
              color="#8B5CF6"
            />
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <BarChartSimple
              data={dailyUsers}
              label="일별 이용자 수 (최근 14일)"
              color="#3B82F6"
            />
          </div>
        </div>

        {/* Category & MBTI */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Category Distribution */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold">카테고리별 분석</span>
            </div>
            <div className="space-y-2">
              {categoryStats.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-gray-600 shrink-0">
                    {CATEGORY_LABELS[c.name] || c.name}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${(c.count / totalCategorySessions) * 100}%`,
                        minWidth: 24,
                        backgroundColor: CATEGORY_COLORS[c.name] || "#9CA3AF",
                      }}
                    >
                      <span className="text-[10px] text-white font-medium">{c.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {Math.round((c.count / totalCategorySessions) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MBTI Distribution */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold">인기 MBTI TOP 10</span>
            </div>
            <div className="space-y-2">
              {mbtiStats.map((m, i) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span
                    className={`text-xs w-12 font-mono font-bold shrink-0 ${
                      i === 0 ? "text-purple-600" : i < 3 ? "text-blue-600" : "text-gray-600"
                    }`}
                  >
                    {m.name}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${(m.count / (mbtiStats[0]?.count || 1)) * 100}%`,
                        minWidth: 24,
                        backgroundColor: i === 0 ? "#8B5CF6" : i < 3 ? "#3B82F6" : "#9CA3AF",
                      }}
                    >
                      <span className="text-[10px] text-white font-medium">{m.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">최근 분석 기록</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b">
                  <th className="pb-2 pr-3">시간</th>
                  <th className="pb-2 pr-3">카테고리</th>
                  <th className="pb-2 pr-3">MBTI</th>
                  <th className="pb-2 pr-3">성별</th>
                  <th className="pb-2 pr-3">생년월일</th>
                  <th className="pb-2 pr-3">깊이</th>
                  <th className="pb-2">유형</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => {
                  const dt = new Date(s.created_at);
                  const kst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
                  const timeStr = `${(kst.getMonth() + 1).toString().padStart(2, "0")}/${kst.getDate().toString().padStart(2, "0")} ${kst.getHours().toString().padStart(2, "0")}:${kst.getMinutes().toString().padStart(2, "0")}`;

                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{timeStr}</td>
                      <td className="py-2 pr-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{
                            backgroundColor: CATEGORY_COLORS[s.category] || "#9CA3AF",
                          }}
                        >
                          {CATEGORY_LABELS[s.category] || s.category}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono font-bold text-purple-600">
                        {s.mbti || "-"}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">
                        {s.gender === "male" ? "남" : s.gender === "female" ? "여" : "-"}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">{s.birth_date || "-"}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            s.analysis_depth === "premium"
                              ? "bg-amber-100 text-amber-700"
                              : s.analysis_depth === "detailed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {s.analysis_depth || "summary"}
                        </span>
                      </td>
                      <td className="py-2">
                        {s.user_id ? (
                          <UserCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <UserX className="w-4 h-4 text-gray-300" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
