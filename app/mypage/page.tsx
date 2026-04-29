"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, User, X, LogOut, Clock, ChevronRight, Crown } from "lucide-react";

interface SavedProfile {
  id: string;
  name: string;
  mbti: string | null;
  birth_date: string;
  birth_time: string | null;
  gender: string | null;
  is_me: boolean;
}

interface HistoryItem {
  id: string;
  category: string;
  category_label: string;
  mbti: string;
  birth_date: string;
  partner_mbti: string | null;
  preview: string | null;
  created_at: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface UserProfile {
  name: string | null;
  email: string;
  plan: string;
  daily_usage: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "무료",
  basic: "베이직",
  premium: "프리미엄",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 7,
  basic: 20,
  premium: 999999,
};

const CATEGORY_EMOJI: Record<string, string> = {
  basic: "🔮",
  yearly: "📅",
  love: "💕",
  compatibility: "💑",
  marriage: "💍",
  reunion: "🔄",
  wealth: "💰",
  career: "💼",
  health: "🏥",
  "lucky-items": "✨",
};

export default function MyPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profiles" | "history">("profiles");
  const [historyLimit, setHistoryLimit] = useState(5);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);

      // 사용자 이메일
      const email = session.user.email || "";

      // 프로필 정보 (plan, usage)
      const profileRes = await fetch(`/api/mypage/profile?userId=${session.user.id}`);
      const profileData = await profileRes.json();

      // 이름 결정: DB name → 카카오 닉네임 → 이메일 앞부분
      let displayName = profileData.name || session.user.user_metadata?.full_name || null;
      // 한글/영문/숫자/공백만 남기고 나머지 제거
      if (displayName) {
        const cleaned = displayName.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, "").trim();
        if (!cleaned || cleaned.length < 1) {
          displayName = email.split("@")[0] || "사용자";
        } else {
          displayName = cleaned;
        }
      } else {
        displayName = email.split("@")[0] || "사용자";
      }

      setUserProfile({
        name: displayName,
        email,
        plan: profileData.plan || "free",
        daily_usage: profileData.daily_usage || 0,
      });

      // 저장된 프로필 + 분석 기록 병렬 조회
      const [profilesRes, historyRes] = await Promise.all([
        fetch(`/api/profiles?userId=${session.user.id}`),
        fetch(`/api/history?userId=${session.user.id}`),
      ]);
      const [profilesList, historyList] = await Promise.all([
        profilesRes.json(),
        historyRes.json(),
      ]);
      if (Array.isArray(profilesList)) setSavedProfiles(profilesList);
      if (Array.isArray(historyList)) setHistory(historyList);

      setLoading(false);
    };
    init();
  }, []);

  const deleteProfile = async (id: string) => {
    await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
    setSavedProfiles(prev => prev.filter(p => p.id !== id));
  };

  const toggleSession = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(sessionId);
    if (!sessionMessages[sessionId]) {
      setLoadingMessages(sessionId);
      try {
        const res = await fetch(`/api/history?userId=${userId}&sessionId=${sessionId}`);
        const msgs = await res.json();
        if (Array.isArray(msgs)) {
          setSessionMessages(prev => ({ ...prev, [sessionId]: msgs }));
        }
      } catch { /* ignore */ }
      setLoadingMessages(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hours}:${mins}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFB" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3182F6", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#8B95A1" }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFB" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg px-5 py-4" style={{ backgroundColor: "rgba(248,250,251,0.9)", borderBottom: "1px solid #E5E8EB" }}>
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="p-1"><ArrowLeft className="w-5 h-5" style={{ color: "#4E5968" }} /></Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: "#3182F6" }} />
              <span className="font-bold" style={{ color: "#191F28" }}>마이페이지</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "#F2F4F6", color: "#6B7684" }}>
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6 space-y-6">
        {/* 사용자 카드 */}
        <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF4FF" }}>
              <User className="w-7 h-7" style={{ color: "#3182F6" }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: "#191F28" }}>
                {userProfile?.name || "사용자"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8B95A1" }}>{userProfile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: userProfile?.plan === "premium" ? "#FFF3E0" : userProfile?.plan === "basic" ? "#E8F5E9" : "#F2F4F6",
                    color: userProfile?.plan === "premium" ? "#E65100" : userProfile?.plan === "basic" ? "#2E7D32" : "#6B7684",
                  }}>
                  {userProfile?.plan === "premium" && <Crown className="w-3 h-3" />}
                  {PLAN_LABELS[userProfile?.plan || "free"] || "무료"} 플랜
                </span>
                <span className="text-[11px]" style={{ color: "#8B95A1" }}>
                  오늘 {userProfile?.daily_usage || 0}/{PLAN_LIMITS[userProfile?.plan || "free"]}회 사용
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex rounded-2xl overflow-hidden" style={{ backgroundColor: "#F2F4F6" }}>
          <button onClick={() => setTab("profiles")}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              backgroundColor: tab === "profiles" ? "#FFFFFF" : "transparent",
              color: tab === "profiles" ? "#191F28" : "#8B95A1",
              borderRadius: tab === "profiles" ? "16px" : "0",
              boxShadow: tab === "profiles" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            저장된 사주 ({savedProfiles.length})
          </button>
          <button onClick={() => setTab("history")}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              backgroundColor: tab === "history" ? "#FFFFFF" : "transparent",
              color: tab === "history" ? "#191F28" : "#8B95A1",
              borderRadius: tab === "history" ? "16px" : "0",
              boxShadow: tab === "history" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            분석 기록 ({history.length})
          </button>
        </div>

        {/* 저장된 프로필 탭 */}
        {tab === "profiles" && (
          <div className="space-y-3">
            {savedProfiles.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D6DB" }} />
                <p className="text-sm font-bold mb-1" style={{ color: "#4E5968" }}>저장된 사주가 없어요</p>
                <p className="text-xs mb-4" style={{ color: "#8B95A1" }}>분석 페이지에서 내 정보를 저장해보세요</p>
                <Link href="/chat" className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#3182F6" }}>
                  분석하러 가기
                </Link>
              </div>
            ) : (
              savedProfiles.map(profile => (
                <div key={profile.id} className="p-4 rounded-2xl group relative"
                  style={{ backgroundColor: "#FFFFFF", border: profile.is_me ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: profile.is_me ? "#3182F6" : "#F2F4F6", color: profile.is_me ? "#FFFFFF" : "#4E5968" }}>
                      {profile.is_me ? <User className="w-5 h-5" /> : profile.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: "#191F28" }}>{profile.name}</p>
                        {profile.is_me && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}>나</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {profile.mbti && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>
                            {profile.mbti}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "#8B95A1" }}>{profile.birth_date}</span>
                        {profile.gender && (
                          <span className="text-xs" style={{ color: "#8B95A1" }}>{profile.gender === "female" ? "여" : "남"}</span>
                        )}
                        {profile.birth_time && (
                          <span className="text-xs" style={{ color: "#8B95A1" }}>{profile.birth_time}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/chat?loadProfile=${profile.id}`}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#3182F6" }}>
                        분석 <ChevronRight className="w-3 h-3" />
                      </Link>
                      <button onClick={() => deleteProfile(profile.id)}
                        className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: "#FEE2E2", color: "#F04452" }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 분석 기록 탭 */}
        {tab === "history" && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D6DB" }} />
                <p className="text-sm font-bold mb-1" style={{ color: "#4E5968" }}>분석 기록이 없어요</p>
                <p className="text-xs mb-4" style={{ color: "#8B95A1" }}>첫 번째 사주 분석을 시작해보세요</p>
                <Link href="/chat" className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#3182F6" }}>
                  분석하러 가기
                </Link>
              </div>
            ) : (
              <>
                {history.slice(0, historyLimit).map(item => (
                  <div key={item.id} className="rounded-2xl overflow-hidden transition-all"
                    style={{ backgroundColor: "#FFFFFF", border: expandedSession === item.id ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                    <button onClick={() => toggleSession(item.id)}
                      className="w-full p-4 flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: "#F8FAFB" }}>
                        {CATEGORY_EMOJI[item.category] || "🔮"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: "#191F28" }}>{item.category_label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: "#8B95A1" }}>{item.mbti}</span>
                          {item.partner_mbti && (
                            <span className="text-xs" style={{ color: "#8B95A1" }}>+ {item.partner_mbti}</span>
                          )}
                          <span className="text-xs" style={{ color: "#D1D6DB" }}>·</span>
                          <span className="text-xs" style={{ color: "#8B95A1" }}>{formatDate(item.created_at)}</span>
                        </div>
                        {item.preview && expandedSession !== item.id && (
                          <p className="text-xs mt-1.5 truncate" style={{ color: "#8B95A1" }}>{item.preview}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform" style={{
                        color: "#D1D6DB",
                        transform: expandedSession === item.id ? "rotate(90deg)" : "rotate(0deg)",
                      }} />
                    </button>
                    {expandedSession === item.id && (
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid #F2F4F6" }}>
                        {loadingMessages === item.id ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3182F6", borderTopColor: "transparent" }} />
                          </div>
                        ) : sessionMessages[item.id]?.length ? (
                          sessionMessages[item.id].map((msg, i) => (
                            <div key={i} className="pt-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] font-bold" style={{ color: msg.role === "assistant" ? "#3182F6" : "#4E5968" }}>
                                  {msg.role === "assistant" ? "AI 분석" : "질문"}
                                </span>
                              </div>
                              <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "#4E5968" }}>
                                {msg.content}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-center py-4" style={{ color: "#8B95A1" }}>대화 내용을 불러올 수 없어요</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {history.length > historyLimit && (
                  <button onClick={() => setHistoryLimit(prev => prev + 5)}
                    className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ backgroundColor: "#F2F4F6", color: "#6B7684" }}>
                    더 보기 ({history.length - historyLimit}개 남음)
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* 하단 퀵 액션 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/chat" className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01]"
            style={{ backgroundColor: "#3182F6", color: "#FFFFFF" }}>
            <Sparkles className="w-4 h-4" /> 새 분석하기
          </Link>
          <Link href="/daily" className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01]"
            style={{ backgroundColor: "#FFFFFF", color: "#4E5968", border: "1px solid #E5E8EB" }}>
            📅 오늘의 운세
          </Link>
        </div>
      </div>
    </div>
  );
}
