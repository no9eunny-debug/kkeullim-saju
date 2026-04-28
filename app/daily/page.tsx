"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, Sun, Moon } from "lucide-react";
import Link from "next/link";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

interface DailyResult {
  date: string;
  score: number;
  keyword: string;
  luckyColor: { name: string; hex: string };
  dominantElement: string;
  todayElement: string;
  ilju: string;
  tti: string;
  message: string;
}

// 원형 점수 게이지 컴포넌트
function ScoreGauge({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        {/* 배경 원 */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#E5E8EB" strokeWidth="10" />
        {/* 점수 원 */}
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke="#3182F6" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black" style={{ color: "#191F28" }}>{score}</span>
        <span className="text-sm font-medium" style={{ color: "#8B95A1" }}>/ 100</span>
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

  // localStorage에서 이전 입력 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem("saju_input");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.birthDate) setBirthDate(data.birthDate);
        if (data.mbti) setMbti(data.mbti);
        if (data.birthDate) setHasInput(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // 결과 애니메이션 트리거
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
    setAnimated(false);
  }, [result]);

  const fetchDaily = async () => {
    if (!birthDate) return;
    setLoading(true);
    setResult(null);

    // 입력값 저장
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
      }
    } catch {
      alert("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
    setLoading(false);
  };

  // hasInput이면 자동 조회
  useEffect(() => {
    if (hasInput && birthDate) {
      fetchDaily();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInput]);

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = dayNames[today.getDay()];

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
          <Link
            href="/chat"
            className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            style={{ color: "#3182F6" }}
          >
            분석하기
          </Link>
        </div>
      </header>

      <div className="flex-1 mx-auto max-w-2xl w-full px-5 py-8">
        {/* 결과가 없을 때: 입력 폼 */}
        {!result && !loading && (
          <div
            className="space-y-8"
            style={{ opacity: 1, transition: "opacity 0.3s ease" }}
          >
            <div className="text-center pt-8">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-6"
                style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}
              >
                <Sun className="w-4 h-4" />
                {dateStr} ({dayOfWeek})
              </div>
              <h1
                className="text-2xl sm:text-3xl font-black mb-3"
                style={{ color: "#191F28" }}
              >
                오늘 하루,
                <br />
                어떤 기운이 감돌까요?
              </h1>
              <p className="text-sm" style={{ color: "#8B95A1" }}>
                생년월일과 MBTI로 오늘의 운세를 확인해보세요
              </p>
            </div>

            {/* 생년월일 */}
            <div>
              <label
                className="text-sm font-bold mb-3 block"
                style={{ color: "#191F28" }}
              >
                생년월일
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-sm"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E8EB",
                  color: "#191F28",
                }}
              />
            </div>

            {/* MBTI (선택) */}
            <div>
              <label
                className="text-sm font-bold mb-3 block"
                style={{ color: "#191F28" }}
              >
                MBTI <span style={{ color: "#8B95A1", fontWeight: 400 }}>(선택)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MBTI_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setMbti(mbti === type ? "" : type)}
                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      backgroundColor: mbti === type ? "#3182F6" : "#FFFFFF",
                      color: mbti === type ? "#FFFFFF" : "#4E5968",
                      border:
                        mbti === type
                          ? "2px solid #3182F6"
                          : "1px solid #E5E8EB",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchDaily}
              disabled={!birthDate}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
              style={{ backgroundColor: "#3182F6" }}
            >
              오늘의 운세 확인하기
            </button>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: "rgba(49,130,246,0.2)" }}
              />
              <div
                className="absolute inset-2 rounded-full animate-pulse flex items-center justify-center"
                style={{ backgroundColor: "#3182F6" }}
              >
                <Moon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: "#8B95A1" }}>
              오늘의 기운을 읽고 있어요...
            </p>
          </div>
        )}

        {/* 결과 */}
        {result && !loading && (
          <div className="space-y-8 pb-8">
            {/* 날짜 */}
            <div
              className="text-center pt-4"
              style={{
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.5s ease",
              }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-2"
                style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}
              >
                <Sun className="w-4 h-4" />
                {dateStr} ({dayOfWeek})
              </div>
              {result.ilju && (
                <p className="text-xs" style={{ color: "#8B95A1" }}>
                  일주: {result.ilju} | {result.tti}띠
                </p>
              )}
            </div>

            {/* 점수 게이지 */}
            <div
              style={{
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0.1s",
              }}
            >
              <ScoreGauge score={animated ? result.score : 0} />
            </div>

            {/* 오늘의 키워드 */}
            <div
              className="text-center"
              style={{
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0.2s",
              }}
            >
              <p
                className="text-sm font-medium mb-2"
                style={{ color: "#8B95A1" }}
              >
                오늘의 키워드
              </p>
              <h2
                className="text-3xl sm:text-4xl font-black"
                style={{ color: "#191F28" }}
              >
                {result.keyword}
              </h2>
              <p className="text-xs mt-2" style={{ color: "#8B95A1" }}>
                주요 오행: {result.dominantElement} | 오늘의 오행: {result.todayElement}
              </p>
            </div>

            {/* 럭키 컬러 */}
            <div
              className="flex items-center justify-center gap-4 py-4"
              style={{
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0.3s",
              }}
            >
              <div
                className="w-14 h-14 rounded-full shadow-lg"
                style={{
                  backgroundColor: result.luckyColor.hex,
                  border:
                    result.luckyColor.hex === "#F8FAFC"
                      ? "2px solid #E5E8EB"
                      : "none",
                }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "#8B95A1" }}
                >
                  럭키 컬러
                </p>
                <p className="text-lg font-bold" style={{ color: "#191F28" }}>
                  {result.luckyColor.name}
                </p>
              </div>
            </div>

            {/* 메시지 */}
            <div
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E8EB",
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0.4s",
              }}
            >
              <p
                className="text-sm leading-relaxed text-center"
                style={{ color: "#4E5968" }}
              >
                {result.message}
              </p>
            </div>

            {/* CTA */}
            <div
              className="space-y-3"
              style={{
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0.5s",
              }}
            >
              <button
                onClick={() => router.push("/chat")}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: "#3182F6" }}
              >
                더 자세히 알아보기
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setHasInput(false);
                }}
                className="w-full py-3 text-sm font-medium"
                style={{ color: "#8B95A1" }}
              >
                다른 정보로 다시 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
