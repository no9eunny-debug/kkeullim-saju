"use client";

import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const handleSocialLogin = async (provider: "kakao" | "naver") => {
    // Custom provider for Naver (OIDC), native for Kakao
    if (provider === "naver") {
      await supabase.auth.signInWithOAuth({
        provider: "naver" as any,
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "#F8FAFB" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-7 h-7" style={{ color: "#3182F6" }} />
            <span className="text-2xl font-black" style={{ color: "#191F28" }}>합리적 미신</span>
          </div>
          <p className="text-sm" style={{ color: "#8B95A1" }}>
            MBTI × 사주로 보는 나의 운명
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin("kakao")}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: "#FEE500", color: "#191919" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3C5.58 3 2 5.8 2 9.24c0 2.2 1.46 4.13 3.66 5.23l-.93 3.43c-.08.3.26.54.52.37l4.1-2.72c.21.02.43.03.65.03 4.42 0 8-2.8 8-6.24S14.42 3 10 3z" fill="#191919"/>
            </svg>
            카카오로 시작하기
          </button>

          <button
            onClick={() => handleSocialLogin("naver")}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: "#03C75A" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13.36 10.53L6.4 3H3v14h3.64V9.47L13.6 17H17V3h-3.64v7.53z" fill="white"/>
            </svg>
            네이버로 시작하기
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px" style={{ backgroundColor: "#E5E8EB" }} />
          <span className="text-xs" style={{ color: "#8B95A1" }}>또는</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#E5E8EB" }} />
        </div>

        {/* Guest */}
        <a
          href="/chat?guest=true"
          className="block w-full text-center py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: "#F2F4F6", color: "#6B7684" }}
        >
          비회원으로 1회 체험하기
        </a>

        <p className="text-xs text-center mt-6 leading-relaxed" style={{ color: "#8B95A1" }}>
          로그인 시{" "}
          <a href="#" className="underline">이용약관</a> 및{" "}
          <a href="#" className="underline">개인정보처리방침</a>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
