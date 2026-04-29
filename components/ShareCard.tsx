"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Download, Share2, Link2, Check } from "lucide-react";

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

const CATEGORY_GRADIENTS: Record<string, string> = {
  연애운: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)",
  재물운: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)",
  직장운: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #4f46e5 100%)",
  건강운: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
  학업운: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
  default: "linear-gradient(135deg, #7c3aed 0%, #4338ca 50%, #1e1b4b 100%)",
};

function getGradient(category: string) {
  return CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.default;
}

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

  useEffect(() => {
    if ("share" in navigator) setCanShare(true);
  }, []);

  const total = Object.values(ohang).reduce((a, b) => a + b, 0) || 1;

  const captureCard = useCallback(async () => {
    if (!cardRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
    });
  }, []);

  const handleDownload = useCallback(async () => {
    setSaving(true);
    try {
      const dataUrl = await captureCard();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `합리적미신_${mbti}_${category}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setSaving(false);
    }
  }, [captureCard, mbti, category]);

  const handleShare = useCallback(async () => {
    try {
      const dataUrl = await captureCard();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `합리적미신_${mbti}.png`, {
        type: "image/png",
      });
      if (navigator.share) {
        await navigator.share({
          title: "합리적 미신 - 나의 사주 x MBTI 분석",
          text: summary || `${mbti} x ${ilju}일주 분석 결과`,
          files: [file],
        });
      }
    } catch {
      // User cancelled or share not supported
    }
  }, [captureCard, mbti, ilju, summary]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `https://kkeullim-saju.vercel.app`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card */}
      <div
        ref={cardRef}
        style={{
          width: 360,
          background: getGradient(category),
          borderRadius: 16,
          padding: "32px 28px",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            position: "relative",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>
            합리적 미신
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "rgba(255,255,255,0.2)",
              padding: "4px 12px",
              borderRadius: 20,
            }}
          >
            {category}
          </div>
        </div>

        {/* MBTI Badge */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 8,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: 4,
              textShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          >
            {mbti}
          </div>
        </div>

        {/* Ilju */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              background: "rgba(255,255,255,0.15)",
              padding: "6px 16px",
              borderRadius: 20,
              display: "inline-block",
            }}
          >
            {ilju}일주
          </span>
        </div>

        {/* Ohang Bar */}
        <div style={{ marginBottom: 20, position: "relative" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              marginBottom: 8,
              opacity: 0.7,
            }}
          >
            오행 분포
          </div>
          <div
            style={{
              display: "flex",
              borderRadius: 8,
              overflow: "hidden",
              height: 12,
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {(Object.entries(ohang) as [string, number][]).map(
              ([key, val]) =>
                val > 0 && (
                  <div
                    key={key}
                    style={{
                      width: `${(val / total) * 100}%`,
                      backgroundColor: OHANG_COLORS[key],
                      transition: "width 0.3s",
                    }}
                  />
                )
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 10,
              opacity: 0.7,
            }}
          >
            {(Object.entries(ohang) as [string, number][]).map(([key, val]) => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: OHANG_COLORS[key],
                    display: "inline-block",
                  }}
                />
                {key} {Math.round((val / total) * 100)}%
              </span>
            ))}
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
              marginBottom: 16,
              position: "relative",
            }}
          >
            {keywords.slice(0, 3).map((kw, i) => (
              <span
                key={i}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.15)",
                  padding: "4px 12px",
                  borderRadius: 16,
                }}
              >
                #{kw}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              textAlign: "center",
              lineHeight: 1.6,
              marginBottom: 20,
              opacity: 0.95,
              position: "relative",
            }}
          >
            {summary}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            opacity: 0.6,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 16,
            position: "relative",
          }}
        >
          나도 해보기 → kkeullim-saju.vercel.app
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {saving ? "저장 중..." : "이미지 저장"}
        </button>

        {canShare && (
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <Share2 className="h-4 w-4" />
            공유하기
          </button>
        )}

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: copied ? "#3182F6" : "rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              복사 완료!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              링크 복사
            </>
          )}
        </button>
      </div>
    </div>
  );
}
