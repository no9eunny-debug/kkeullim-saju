"use client";

import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Mail, ArrowLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  kakao_cancelled: "카카오 로그인이 취소되었어요",
  kakao_token: "카카오 인증에 실패했어요. 다시 시도해주세요",
  kakao_no_email: "카카오 계정에 이메일이 없어요. 이메일 제공에 동의해주세요",
  kakao_create: "계정 생성에 실패했어요. 다시 시도해주세요",
  kakao_session: "세션 생성에 실패했어요. 다시 시도해주세요",
  kakao_verify: "인증에 실패했어요. 다시 시도해주세요",
  kakao_unknown: "카카오 로그인 중 오류가 발생했어요",
  auth_failed: "로그인에 실패했어요. 다시 시도해주세요",
};

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<"main" | "email">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(urlError ? (ERROR_MESSAGES[urlError] || "로그인 오류가 발생했어요") : "");
  const [rememberMe, setRememberMe] = useState(false);

  // 이미 로그인 상태면 채팅으로 이동 + 저장된 이메일로 자동 로그인
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/chat");
        return;
      }
      // 저장된 이메일/비밀번호 불러오기
      const savedEmail = localStorage.getItem("saju_saved_email");
      const savedPw = localStorage.getItem("saju_saved_pw");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
        if (savedPw) {
          setPassword(savedPw);
          // 자동 로그인 시도
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: savedEmail, password: savedPw,
          });
          if (!loginError && loginData.session) {
            window.location.href = "/chat";
            return;
          }
        }
      }
    };
    init();
  }, []);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleKakaoLogin = () => {
    setLoading(true);
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!clientId) {
      setError("카카오 로그인 설정이 되어있지 않아요.");
      setLoading(false);
      return;
    }
    const redirectUri = `${siteUrl}/api/auth/kakao/callback`;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  };

  const handleNaverLogin = () => {
    alert("네이버 로그인은 현재 서비스 준비중이에요. 카카오 또는 이메일로 시작해주세요!");
  };

  const handleEmailAuth = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${siteUrl}/api/auth/callback` },
      });
      if (error) {
        if (error.message.includes("already")) {
          setError("이미 가입된 이메일이에요");
        } else if (error.message.includes("valid email")) {
          setError("올바른 이메일 형식이 아니에요");
        } else if (error.message.includes("at least")) {
          setError("비밀번호는 6자 이상이어야 해요");
        } else {
          setError("회원가입에 실패했어요. 다시 시도해주세요");
        }
      } else {
        setMessage("가입 완료! 바로 로그인해보세요.");
        setIsSignUp(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("이메일 또는 비밀번호가 맞지 않아요");
      } else if (data.session) {
        // 로그인 정보 저장/삭제
        if (rememberMe) {
          localStorage.setItem("saju_saved_email", email);
          localStorage.setItem("saju_saved_pw", password);
        } else {
          localStorage.removeItem("saju_saved_email");
          localStorage.removeItem("saju_saved_pw");
        }
        window.location.href = "/chat";
        return;
      }
    }
    setLoading(false);
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
            MBTI x 사주로 보는 나의 운명
          </p>
        </div>

        {mode === "main" ? (
          <>
            {/* Social Login */}
            <div className="space-y-3">
              <button
                onClick={handleKakaoLogin}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: "#FEE500", color: "#191919" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3C5.58 3 2 5.8 2 9.24c0 2.2 1.46 4.13 3.66 5.23l-.93 3.43c-.08.3.26.54.52.37l4.1-2.72c.21.02.43.03.65.03 4.42 0 8-2.8 8-6.24S14.42 3 10 3z" fill="#191919"/>
                </svg>
                카카오로 시작하기
              </button>

              <button
                onClick={handleNaverLogin}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13.56 10.7L6.15 0H0v20h6.44V9.3L13.85 20H20V0h-6.44z" fill="#FFFFFF"/>
                </svg>
                네이버로 시작하기
              </button>

              <button
                onClick={() => setMode("email")}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: "#FFFFFF", color: "#4E5968", border: "1px solid #E5E8EB" }}
              >
                <Mail className="w-5 h-5" />
                이메일로 시작하기
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-center mt-4" style={{ color: "#F04452" }}>{error}</p>
            )}

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
              비회원으로 3회 체험하기
            </a>
          </>
        ) : (
          <>
            {/* Email Login/Signup Form */}
            <button onClick={() => { setMode("main"); setError(""); setMessage(""); }}
              className="flex items-center gap-1 text-sm mb-6" style={{ color: "#6B7684" }}>
              <ArrowLeft className="w-4 h-4" /> 돌아가기
            </button>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block" style={{ color: "#191F28" }}>이메일</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: "#191F28" }} />
              </div>
              <div>
                <label className="text-sm font-bold mb-2 block" style={{ color: "#191F28" }}>비밀번호</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={isSignUp ? "6자 이상 입력해주세요" : "비밀번호 입력"}
                  className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: "#191F28" }}
                  onKeyDown={e => { if (e.key === "Enter" && email && password) handleEmailAuth(); }} />
              </div>

              {!isSignUp && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#3182F6]" />
                  <span className="text-xs" style={{ color: "#8B95A1" }}>아이디/비밀번호 기억하기</span>
                </label>
              )}

              {error && <p className="text-sm" style={{ color: "#F04452" }}>{error}</p>}
              {message && <p className="text-sm" style={{ color: "#3182F6" }}>{message}</p>}

              <button onClick={handleEmailAuth} disabled={loading || !email || !password}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: "#3182F6" }}>
                {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
              </button>

              <p className="text-center text-sm" style={{ color: "#8B95A1" }}>
                {isSignUp ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}{" "}
                <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
                  className="font-bold" style={{ color: "#3182F6" }}>
                  {isSignUp ? "로그인" : "회원가입"}
                </button>
              </p>
            </div>
          </>
        )}

        <p className="text-xs text-center mt-6 leading-relaxed" style={{ color: "#8B95A1" }}>
          로그인 시{" "}
          <a href="#" className="underline">이용약관</a> 및{" "}
          <a href="#" className="underline">개인정보처리방침</a>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
