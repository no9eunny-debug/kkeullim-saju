"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, Sun, Moon, User, Share2, Compass, Star as StarIcon } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface SavedProfile {
  id: string;
  name: string;
  mbti: string | null;
  birth_date: string;
  birth_time: string | null;
  gender: string | null;
  is_me: boolean;
}

const DAILY_LUCKY_ITEMS: Record<string, { name: string; emoji: string; desc: string }[]> = {
  목: [
    { name: "초록 폰케이스", emoji: "🌿", desc: "목 기운을 채워주는 그린 아이템" },
    { name: "원목 소품", emoji: "🪵", desc: "자연의 에너지를 담은 나무 소재" },
    { name: "민트 향초", emoji: "🕯️", desc: "상쾌한 목 기운의 아로마" },
  ],
  화: [
    { name: "레드 립밤", emoji: "💄", desc: "화 기운을 북돋우는 레드 포인트" },
    { name: "시나몬 라떼", emoji: "☕", desc: "따뜻한 화 기운의 음료" },
    { name: "캔들워머", emoji: "🔥", desc: "은은한 불꽃으로 화 기운 충전" },
  ],
  토: [
    { name: "도자기 머그컵", emoji: "🍵", desc: "흙의 안정감을 담은 아이템" },
    { name: "베이지 가방", emoji: "👜", desc: "토 기운의 따뜻한 색감" },
    { name: "고구마 간식", emoji: "🍠", desc: "뿌리채소로 토 에너지 보충" },
  ],
  금: [
    { name: "실버 반지", emoji: "💍", desc: "금 기운을 높여주는 메탈 액세서리" },
    { name: "스텐 텀블러", emoji: "🥤", desc: "금속 소재로 금 기운 충전" },
    { name: "흰색 셔츠", emoji: "👔", desc: "금의 맑은 기운을 담은 화이트" },
  ],
  수: [
    { name: "수정 팔찌", emoji: "💎", desc: "수 기운의 맑은 에너지" },
    { name: "미니 가습기", emoji: "💧", desc: "물의 기운으로 수 에너지 보충" },
    { name: "네이비 파우치", emoji: "🌊", desc: "깊은 수 기운의 컬러 아이템" },
  ],
};

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

interface DailyResult {
  date: string;
  score: number;
  scoreLabel: string;
  keyword: string;
  subKeywords: string[];
  luckyColor: { name: string; hex: string };
  luckyNumber: number;
  luckyDirection: string;
  dominantElement: string;
  todayElement: string;
  yongElement: string;
  ilju: string;
  tti: string;
  todaySipsung: string;
  todaySipsungDesc: string;
  message: string;
  miniForecasts: { love: string; wealth: string; health: string };
  premiumTeaser: string;
  shareText: string;
  shinsalActive: string[];
}

// 원형 점수 게이지
function ScoreGauge({ score, label }: { score: number; label?: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#3182F6" : score >= 45 ? "#EAB308" : "#8B95A1";

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#E5E8EB" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out, stroke 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black" style={{ color: "#191F28" }}>{score}</span>
        <span className="text-xs font-bold mt-1" style={{ color }}>{label || ""}</span>
      </div>
    </div>
  );
}

export default function DailyPage() {
  const router = useRouter();
  const [mbti, setMbti] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [hasInput, setHasInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [animated, setAnimated] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);
  const [luckyPoints, setLuckyPoints] = useState(0);
  const [bonusEarned, setBonusEarned] = useState(false);

  // 행운 포인트 로드
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const pts = parseInt(localStorage.getItem("saju_lucky_points") || "0", 10);
      const ptsDate = localStorage.getItem("saju_lucky_points_date");
      // 날짜 바뀌면 리셋
      if (ptsDate !== today) {
        setLuckyPoints(0);
      } else {
        setLuckyPoints(pts);
      }
    } catch {}
  }, []);

  // 로그인 유저의 저장된 프로필 + 내 프로필 자동 적용
  useEffect(() => {
    const loadProfiles = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const res = await fetch(`/api/profiles?userId=${session.user.id}`);
        const profiles = await res.json();
        if (Array.isArray(profiles) && profiles.length > 0) {
          setSavedProfiles(profiles);
          const myProfile = profiles.find((p: SavedProfile) => p.is_me);
          if (myProfile) {
            setBirthDate(myProfile.birth_date);
            setMbti(myProfile.mbti || "");
            setActiveProfileName(myProfile.name);
            setHasInput(true);
            return;
          }
        }
      }
      try {
        const saved = localStorage.getItem("saju_input");
        if (saved) {
          const data = JSON.parse(saved);
          if (data.birthDate) setBirthDate(data.birthDate);
          if (data.mbti) setMbti(data.mbti);
          if (data.birthDate) setHasInput(true);
        }
      } catch {}
    };
    loadProfiles();
  }, []);

  const loadProfile = (profile: SavedProfile) => {
    setBirthDate(profile.birth_date);
    setMbti(profile.mbti || "");
    setActiveProfileName(profile.name);
    setResult(null);
    setHasInput(false);
  };

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
    setAnimated(false);
  }, [result]);

  const fetchDaily = async () => {
    if (!birthDate) return;

    // 캐시 체크
    const cacheKey = `daily_${birthDate}_${mbti || "none"}_${new Date().toISOString().slice(0, 10)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setResult(JSON.parse(cached)); return; }
    } catch {}

    setLoading(true);
    setResult(null);
    try {
      const existing = JSON.parse(localStorage.getItem("saju_input") || "{}");
      localStorage.setItem("saju_input", JSON.stringify({ ...existing, birthDate, mbti }));
    } catch {
      localStorage.setItem("saju_input", JSON.stringify({ birthDate, mbti }));
    }

    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate, mbti: mbti || null }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
        // 행운 포인트 적립 (하루 1회)
        try {
          const today = new Date().toISOString().slice(0, 10);
          const ptsDate = localStorage.getItem("saju_lucky_points_date");
          if (ptsDate !== today) {
            const prev = parseInt(localStorage.getItem("saju_lucky_points") || "0", 10);
            const newPts = prev + 1;
            localStorage.setItem("saju_lucky_points_date", today);
            if (newPts >= 3) {
              const bonus = parseInt(localStorage.getItem("saju_bonus_questions") || "0", 10);
              localStorage.setItem("saju_bonus_questions", String(bonus + 1));
              localStorage.setItem("saju_lucky_points", "0");
              setLuckyPoints(0);
              setBonusEarned(true);
            } else {
              localStorage.setItem("saju_lucky_points", String(newPts));
              setLuckyPoints(newPts);
            }
          }
        } catch {}
        // 캐시 저장 + 이전 캐시 정리
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith("daily_") && key !== cacheKey) localStorage.removeItem(key);
          }
        } catch {}
      }
    } catch {
      alert("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (hasInput && birthDate) fetchDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInput]);

  const handleShare = async () => {
    if (!result) return;
    const text = result.shareText;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert("운세 결과가 복사되었어요!");
      } catch {}
    }
  };

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = dayNames[today.getDay()];

  // 애니메이션 헬퍼
  const fade = (delay: number) => ({
    opacity: animated ? 1 : 0,
    transform: animated ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.6s ease ${delay}s`,
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFB" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-lg px-5 py-4"
        style={{ backgroundColor: "rgba(248,250,251,0.9)", borderBottom: "1px solid #E5E8EB" }}
      >
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1">
              <ArrowLeft className="w-5 h-5" style={{ color: "#4E5968" }} />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: "#3182F6" }} />
              <span className="font-bold" style={{ color: "#191F28" }}>오늘의 운세</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#FFF8E1", color: "#F59E0B", border: "1px solid #FDE68A" }}>
              <StarIcon className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {luckyPoints}/3
            </div>
            <Link
              href="/chat"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              style={{ color: "#3182F6" }}
            >
              분석하기
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto max-w-2xl w-full px-5 py-8">
        {/* ── 입력 폼 ── */}
        {!result && !loading && (
          <div className="space-y-8" style={{ opacity: 1, transition: "opacity 0.3s ease" }}>
            <div className="text-center pt-8">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-6"
                style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}
              >
                <Sun className="w-4 h-4" />
                {dateStr} ({dayOfWeek})
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "#191F28" }}>
                오늘 하루,<br />어떤 기운이 감돌까요?
              </h1>
              <p className="text-sm" style={{ color: "#8B95A1" }}>
                생년월일과 MBTI로 사주 기반 오늘의 운세를 확인해보세요
              </p>
            </div>

            {/* 저장된 프로필 선택 */}
            {savedProfiles.length > 0 && (
              <div>
                <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>누구의 운세를 볼까요?</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {savedProfiles.map(profile => (
                    <button key={profile.id} onClick={() => loadProfile(profile)}
                      className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl transition-all hover:shadow-md"
                      style={{
                        backgroundColor: activeProfileName === profile.name ? "#EBF4FF" : "#FFFFFF",
                        border: activeProfileName === profile.name ? "2px solid #3182F6" : "1px solid #E5E8EB",
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: profile.is_me ? "#3182F6" : "#F2F4F6", color: profile.is_me ? "#FFFFFF" : "#4E5968" }}>
                        {profile.is_me ? <User className="w-4 h-4" /> : profile.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold" style={{ color: "#191F28" }}>
                          {profile.name} {profile.is_me && <span className="text-[10px]" style={{ color: "#3182F6" }}>나</span>}
                        </p>
                        <p className="text-[10px]" style={{ color: "#8B95A1" }}>{profile.mbti || "?"} · {profile.birth_date}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 생년월일 */}
            <div>
              <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>생년월일</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-sm"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: "#191F28" }}
              />
            </div>

            {/* MBTI (선택) */}
            <div>
              <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>
                MBTI <span style={{ color: "#8B95A1", fontWeight: 400 }}>(선택)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MBTI_TYPES.map(type => (
                  <button key={type} onClick={() => setMbti(mbti === type ? "" : type)}
                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      backgroundColor: mbti === type ? "#3182F6" : "#FFFFFF",
                      color: mbti === type ? "#FFFFFF" : "#4E5968",
                      border: mbti === type ? "2px solid #3182F6" : "1px solid #E5E8EB",
                    }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={fetchDaily} disabled={!birthDate}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
              style={{ backgroundColor: "#3182F6" }}>
              오늘의 운세 확인하기
            </button>
          </div>
        )}

        {/* ── 로딩 ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: "rgba(49,130,246,0.2)" }} />
              <div className="absolute inset-2 rounded-full animate-pulse flex items-center justify-center" style={{ backgroundColor: "#3182F6" }}>
                <Moon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: "#8B95A1" }}>사주 데이터로 오늘의 기운을 분석 중...</p>
          </div>
        )}

        {/* ── 결과 ── */}
        {result && !loading && (
          <div className="space-y-6 pb-8">
            {/* 질문권 획득 배너 */}
            {bonusEarned && (
              <div className="rounded-2xl p-5 text-center"
                style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", border: "1px solid #F59E0B" }}>
                <p className="text-2xl mb-2">&#x1F389;</p>
                <p className="text-sm font-black" style={{ color: "#92400E" }}>질문권 1회 획득!</p>
                <p className="text-xs mt-1" style={{ color: "#A16207" }}>사주 분석에서 사용하세요</p>
                <button onClick={() => setBonusEarned(false)}
                  className="mt-3 text-xs font-medium px-4 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(146,64,14,0.1)", color: "#92400E" }}>
                  확인
                </button>
              </div>
            )}
            {/* 날짜 */}
            <div className="text-center pt-4" style={fade(0)}>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-2"
                style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}>
                <Sun className="w-4 h-4" />
                {dateStr} ({dayOfWeek})
              </div>
              {result.ilju && (
                <p className="text-xs" style={{ color: "#8B95A1" }}>
                  일주: {result.ilju} | {result.tti}띠 | 오행: {result.dominantElement}
                </p>
              )}
            </div>

            {/* 점수 게이지 */}
            <div style={fade(0.1)}>
              <ScoreGauge score={animated ? result.score : 0} label={result.scoreLabel} />
            </div>

            {/* 오늘의 키워드 */}
            <div className="text-center" style={fade(0.2)}>
              <p className="text-sm font-medium mb-2" style={{ color: "#8B95A1" }}>오늘의 키워드</p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#191F28" }}>
                {result.keyword}
              </h2>
              {result.subKeywords?.length > 0 && (
                <div className="flex justify-center gap-2 mt-3">
                  {result.subKeywords.map((sub, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: "#F2F4F6", color: "#6B7684" }}>
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 오늘의 에너지 (십성) */}
            {result.todaySipsung && (
              <div className="rounded-2xl p-5 text-center" style={{ ...fade(0.25), backgroundColor: "#EBF4FF", border: "1px solid #B8D4FF" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#3182F6" }}>오늘의 에너지</p>
                <p className="text-xl font-black" style={{ color: "#191F28" }}>{result.todaySipsung}</p>
                <p className="text-xs mt-1" style={{ color: "#6B7684" }}>{result.todaySipsungDesc}</p>
                {result.shinsalActive?.length > 0 && (
                  <div className="flex justify-center gap-2 mt-3">
                    {result.shinsalActive.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: "#FFF0F0", color: "#F04452" }}>
                        {s} 활성
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 럭키 아이템즈 */}
            <div className="grid grid-cols-3 gap-3" style={fade(0.3)}>
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 shadow-sm"
                  style={{ backgroundColor: result.luckyColor.hex, border: result.luckyColor.hex === "#F8FAFC" ? "2px solid #E5E8EB" : "none" }} />
                <p className="text-[10px] font-medium" style={{ color: "#8B95A1" }}>럭키 컬러</p>
                <p className="text-xs font-bold" style={{ color: "#191F28" }}>{result.luckyColor.name}</p>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: "#EBF4FF" }}>
                  <span className="text-lg font-black" style={{ color: "#3182F6" }}>{result.luckyNumber}</span>
                </div>
                <p className="text-[10px] font-medium" style={{ color: "#8B95A1" }}>럭키 넘버</p>
                <p className="text-xs font-bold" style={{ color: "#191F28" }}>{result.luckyNumber}</p>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: "#EBF4FF" }}>
                  <Compass className="w-5 h-5" style={{ color: "#3182F6" }} />
                </div>
                <p className="text-[10px] font-medium" style={{ color: "#8B95A1" }}>럭키 방위</p>
                <p className="text-xs font-bold" style={{ color: "#191F28" }}>{result.luckyDirection}</p>
              </div>
            </div>

            {/* 오늘의 행운 아이템 */}
            <div className="space-y-2" style={fade(0.32)}>
              <p className="text-sm font-bold" style={{ color: "#191F28" }}>오늘의 행운 아이템</p>
              <p className="text-xs mb-2" style={{ color: "#8B95A1" }}>
                부족한 {result.yongElement || result.dominantElement} 기운을 보충해줄 아이템이에요
              </p>
              <div className="space-y-2">
                {(DAILY_LUCKY_ITEMS[result.yongElement] || DAILY_LUCKY_ITEMS[result.dominantElement] || DAILY_LUCKY_ITEMS["목"]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                    <span className="text-2xl shrink-0">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold" style={{ color: "#191F28" }}>{item.name}</p>
                      <p className="text-xs" style={{ color: "#6B7684" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 미니 운세 */}
            <div className="space-y-2" style={fade(0.38)}>
              <p className="text-sm font-bold" style={{ color: "#191F28" }}>오늘의 미니 운세</p>
              {([
                { emoji: "\uD83D\uDC95", label: "연애", text: result.miniForecasts.love },
                { emoji: "\uD83D\uDCB0", label: "재물", text: result.miniForecasts.wealth },
                { emoji: "\uD83D\uDCAA", label: "건강", text: result.miniForecasts.health },
              ] as const).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                  <span className="text-lg shrink-0">{item.emoji}</span>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: "#191F28" }}>{item.label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#4E5968" }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 메인 메시지 */}
            <div className="rounded-2xl p-6" style={{ ...fade(0.44), backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
              <p className="text-sm leading-relaxed text-center" style={{ color: "#4E5968" }}>
                {result.message}
              </p>
            </div>

            {/* Premium teaser */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ ...fade(0.49), background: "linear-gradient(135deg, #1E3A5F 0%, #3182F6 100%)" }}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <p className="text-xs font-bold text-yellow-300">더 깊은 인사이트</p>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  {result.premiumTeaser}
                </p>
                <button onClick={() => router.push("/chat")}
                  className="mt-4 w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}>
                  무료로 자세히 분석하기
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3" style={fade(0.54)}>
              <button onClick={() => router.push("/chat")}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: "#3182F6" }}>
                전체 사주 분석 받기
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                <button onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all hover:shadow-sm"
                  style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>
                  <Share2 className="w-4 h-4" />
                  공유하기
                </button>
                <button onClick={() => { setResult(null); setHasInput(false); }}
                  className="flex-1 py-3 text-sm font-medium rounded-2xl transition-all hover:shadow-sm"
                  style={{ backgroundColor: "#F2F4F6", color: "#8B95A1" }}>
                  다른 정보로 다시 보기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
