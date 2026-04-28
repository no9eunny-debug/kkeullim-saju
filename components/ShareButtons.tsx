"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Link2, Check } from "lucide-react";
import { shareToKakao, copyLink, getShareUrl } from "@/lib/share";

interface ShareButtonsProps {
  sessionId: string;
  title?: string;
  description?: string;
}

export default function ShareButtons({
  sessionId,
  title = "합리적 미신 - MBTI x 사주 분석 결과",
  description = "MBTI와 사주를 결합한 AI 맞춤 분석 결과를 확인해보세요!",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const url = getShareUrl(sessionId);

  const handleKakao = useCallback(() => {
    shareToKakao(title, description, url);
  }, [title, description, url]);

  const handleCopy = useCallback(async () => {
    const ok = await copyLink(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <div className="flex items-center gap-3">
      {/* 카카오톡 공유 */}
      <button
        onClick={handleKakao}
        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
        style={{
          backgroundColor: "#FEE500",
          color: "#191F28",
        }}
      >
        <MessageCircle className="h-4 w-4" />
        카카오톡 공유
      </button>

      {/* 링크 복사 */}
      <button
        onClick={handleCopy}
        className="relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
        style={{
          backgroundColor: copied ? "#3182F6" : "#F2F4F6",
          color: copied ? "#FFFFFF" : "#191F28",
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
  );
}
