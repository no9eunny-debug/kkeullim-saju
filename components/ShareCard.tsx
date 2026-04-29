"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Download, Share2, Link2, Check } from "lucide-react";
import { getIlganCharacter } from "@/lib/saju/characters";

interface ShareCardProps {
  mbti: string;
  ilju: string;
  ohang: { 목: number; 화: number; 토: number; 금: number; 수: number };
  category: string;
  keywords?: string[];
  summary?: string;
}

const OHANG_COLORS: Record<string, string> = {
  목: "#22c55e",
  화: "#ef4444",
  토: "#eab308",
  금: "#e2e8f0",
  수: "#3b82f6",
};

const CATEGORY_NAMES: Record<string, string> = {
  basic: "기본 사주",
  yearly: "올해 운세",
  love: "연애·궁합",
  marriage: "결혼운",
  reunion: "재회운",
  wealth: "재물운",
  career: "직업 적성",
  health: "건강운",
  "lucky-items": "행운 아이템",
};

export default function ShareCard({
  mbti,
  ilju,
  ohang,
  category,
  keywords = [],
  summary,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const character = getIlganCharacter(ilju);
  const categoryName = CATEGORY_NAMES[category] || category;

  useEffect(() => {
    if ("share" in navigator) setCanShare(true);
  }, []);

  const total = Object.values(ohang).reduce((a, b) => a + b, 0) || 1;

  const captureCard = useCallback(async () => {
    if (!cardRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  }, []);

  const handleDownload = useCallback(async () => {
    setSaving(true);
    try {
      const dataUrl = await captureCard();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `합리적미신_${mbti}_${ilju}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setSaving(false);
    }
  }, [captureCard, mbti, ilju]);

  const handleShare = useCallback(async () => {
    try {
      const dataUrl = await captureCard();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `합리적미신_${mbti}.png`, { type: "image/png" });
      if (navigator.share) {
        await navigator.share({
          title: "합리적 미신 - 나의 사주 x MBTI",
          text: `${mbti} x ${character.name} (${character.title}) 분석 결과! 나도 해보기`,
          files: [file],
        });
      }
    } catch {
      // cancelled
    }
  }, [captureCard, mbti, character]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("https://kkeullim-saju.vercel.app");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 my-6">
      {/* Card */}
      <div
        ref={cardRef}
        style={{
          width: 360,
          background: character.gradient,
          borderRadius: 20,
          padding: "32px 28px",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: "40%", right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>합리적 미신</div>
          <div style={{ fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>
            {categoryName}
          </div>
        </div>

        {/* Character Section */}
        <div style={{ textAlign: "center", marginBottom: 16, position: "relative" }}>
          <div style={{ fontSize: 56, marginBottom: 4, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>
            {character.emoji}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, marginBottom: 2 }}>
            {character.name}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {character.title}
          </div>
        </div>

        {/* MBTI + Ilju */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20, position: "relative" }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, background: "rgba(255,255,255,0.15)", padding: "6px 16px", borderRadius: 12 }}>
            {mbti}
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, background: "rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: 12, display: "flex", alignItems: "center" }}>
            {ilju}일주
          </span>
        </div>

        {/* Character keyword */}
        <div style={{ textAlign: "center", fontSize: 12, opacity: 0.65, marginBottom: 16, position: "relative" }}>
          {character.keyword}
        </div>

        {/* Ohang Bar */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 6, opacity: 0.6 }}>오행 분포</div>
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, background: "rgba(0,0,0,0.2)" }}>
            {(Object.entries(ohang) as [string, number][]).map(([key, val]) =>
              val > 0 ? (
                <div key={key} style={{ width: `${(val / total) * 100}%`, backgroundColor: OHANG_COLORS[key] }} />
              ) : null
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, opacity: 0.6 }}>
            {(Object.entries(ohang) as [string, number][]).map(([key, val]) => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: OHANG_COLORS[key], display: "inline-block" }} />
                {key}{Math.round((val / total) * 100)}%
              </span>
            ))}
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14, position: "relative" }}>
            {keywords.slice(0, 3).map((kw, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 14 }}>
                #{kw}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div style={{ fontSize: 13, fontWeight: 500, textAlign: "center", lineHeight: 1.6, marginBottom: 16, opacity: 0.9, position: "relative" }}>
            {summary}
          </div>
        )}

        {/* Character description */}
        <div style={{ fontSize: 12, textAlign: "center", opacity: 0.7, marginBottom: 16, fontStyle: "italic", position: "relative" }}>
          &ldquo;{character.description}&rdquo;
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 11, opacity: 0.5, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14, position: "relative" }}>
          나도 해보기 &rarr; kkeullim-saju.vercel.app
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
          style={{ backgroundColor: character.color, color: "#fff" }}
        >
          <Download className="h-4 w-4" />
          {saving ? "저장 중..." : "이미지 저장"}
        </button>

        {canShare && (
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{ borderColor: character.color, color: character.color }}
          >
            <Share2 className="h-4 w-4" />
            공유하기
          </button>
        )}

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: copied ? "#3182F6" : "#f1f5f9", color: copied ? "#fff" : "#4E5968" }}
        >
          {copied ? <><Check className="h-4 w-4" /> 복사 완료!</> : <><Link2 className="h-4 w-4" /> 링크 복사</>}
        </button>
      </div>
    </div>
  );
}
