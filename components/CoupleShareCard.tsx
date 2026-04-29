"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Download, Share2, Link2, Check } from "lucide-react";
import { getIlganCharacter } from "@/lib/saju/characters";

interface CoupleShareCardProps {
  myMbti: string;
  myIlju: string;
  myOhang: { 목: number; 화: number; 토: number; 금: number; 수: number };
  partnerMbti: string;
  partnerIlju: string;
  partnerOhang: { 목: number; 화: number; 토: number; 금: number; 수: number };
  category: string;
}

const OHANG_COLORS: Record<string, string> = {
  목: "#22c55e",
  화: "#ef4444",
  토: "#eab308",
  금: "#e2e8f0",
  수: "#3b82f6",
};

const CATEGORY_NAMES: Record<string, string> = {
  love: "연애 궁합",
  marriage: "결혼운",
  reunion: "재회운",
};

export default function CoupleShareCard({
  myMbti,
  myIlju,
  myOhang,
  partnerMbti,
  partnerIlju,
  partnerOhang,
  category,
}: CoupleShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const myChar = getIlganCharacter(myIlju);
  const partnerChar = getIlganCharacter(partnerIlju);
  const categoryName = CATEGORY_NAMES[category] || category;

  useEffect(() => {
    if ("share" in navigator) setCanShare(true);
  }, []);

  const myTotal = Object.values(myOhang).reduce((a, b) => a + b, 0) || 1;
  const partnerTotal = Object.values(partnerOhang).reduce((a, b) => a + b, 0) || 1;

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
      link.download = `합리적미신_궁합_${myMbti}_${partnerMbti}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setSaving(false);
    }
  }, [captureCard, myMbti, partnerMbti]);

  const handleShare = useCallback(async () => {
    try {
      const dataUrl = await captureCard();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `합리적미신_궁합.png`, { type: "image/png" });
      if (navigator.share) {
        await navigator.share({
          title: "합리적 미신 - 궁합 분석",
          text: `${myMbti} x ${partnerMbti} 궁합 분석 결과! 나도 해보기`,
          files: [file],
        });
      }
    } catch {
      // cancelled
    }
  }, [captureCard, myMbti, partnerMbti]);

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
          width: "100%",
          maxWidth: 360,
          background: myChar.gradient,
          borderRadius: 20,
          padding: "32px 24px",
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

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>합리적 미신</div>
          <div style={{ fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>
            {categoryName}
          </div>
        </div>

        {/* Two Characters */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 16, position: "relative" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>{myChar.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, marginTop: 4 }}>{myChar.name}</div>
          </div>
          <div style={{ fontSize: 28, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>&#x2764;&#xFE0F;</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>{partnerChar.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, marginTop: 4 }}>{partnerChar.name}</div>
          </div>
        </div>

        {/* Titles side by side */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8, position: "relative" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{myChar.title}</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{partnerChar.title}</div>
          </div>
        </div>

        {/* MBTI + Ilju side by side */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20, position: "relative" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 10 }}>
              {myMbti}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: 10 }}>
              {myIlju}
            </span>
          </div>
          <span style={{ fontSize: 14, opacity: 0.5, display: "flex", alignItems: "center" }}>vs</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 10 }}>
              {partnerMbti}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: 10 }}>
              {partnerIlju}
            </span>
          </div>
        </div>

        {/* Ohang comparison */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8, opacity: 0.6 }}>오행 비교</div>
          {/* My ohang */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 2 }}>나</div>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", height: 8, background: "rgba(0,0,0,0.2)" }}>
              {(Object.entries(myOhang) as [string, number][]).map(([key, val]) =>
                val > 0 ? <div key={key} style={{ width: `${(val / myTotal) * 100}%`, backgroundColor: OHANG_COLORS[key] }} /> : null
              )}
            </div>
          </div>
          {/* Partner ohang */}
          <div>
            <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 2 }}>상대</div>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", height: 8, background: "rgba(0,0,0,0.2)" }}>
              {(Object.entries(partnerOhang) as [string, number][]).map(([key, val]) =>
                val > 0 ? <div key={key} style={{ width: `${(val / partnerTotal) * 100}%`, backgroundColor: OHANG_COLORS[key] }} /> : null
              )}
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, opacity: 0.6 }}>
            {(Object.keys(OHANG_COLORS) as string[]).map(key => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: OHANG_COLORS[key], display: "inline-block" }} />
                {key}
              </span>
            ))}
          </div>
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
          style={{ backgroundColor: myChar.color, color: "#fff" }}
        >
          <Download className="h-4 w-4" />
          {saving ? "저장 중..." : "이미지 저장"}
        </button>

        {canShare && (
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{ borderColor: myChar.color, color: myChar.color }}
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
