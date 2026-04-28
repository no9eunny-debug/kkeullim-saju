import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const kakaoError = requestUrl.searchParams.get("error");

  if (kakaoError || !code) {
    return NextResponse.redirect(`${origin}/login?error=kakao_cancelled`);
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || "";
    const clientSecret = process.env.KAKAO_CLIENT_SECRET || "";
    const redirectUri = `${origin}/api/auth/kakao/callback`;

    // 1. 카카오 인가코드 → 액세스 토큰
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      client_secret: clientSecret,
    });
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: tokenBody,
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("[Kakao] token error:", JSON.stringify(tokenData));
      return NextResponse.redirect(`${origin}/login?error=kakao_token`);
    }

    // 2. 카카오 사용자 정보 조회
    const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    const kakaoAccount = profileData.kakao_account;
    // 이메일이 없으면 카카오 ID 기반 이메일 생성
    const email = kakaoAccount?.email || `kakao_${profileData.id}@kakao.user`;
    const name = kakaoAccount?.profile?.nickname || "";

    // 3. Supabase 사용자 생성 (이미 존재하면 무시)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name, provider: "kakao", kakao_id: String(profileData.id) },
    });

    if (createError && !createError.message?.includes("already")) {
      console.error("[Kakao] user create error:", createError);
      return NextResponse.redirect(`${origin}/login?error=kakao_create`);
    }

    // 4. 매직 링크 → OTP 검증 → 세션 설정
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("[Kakao] magic link error:", linkError);
      return NextResponse.redirect(`${origin}/login?error=kakao_session`);
    }

    // 쿠키를 redirect response에 명시적으로 전달하기 위해 수집
    const cookiesToForward: { name: string; value: string; options: any }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((cookie) => {
              cookiesToForward.push(cookie);
            });
          },
        },
      }
    );

    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError || !sessionData?.user) {
      console.error("[Kakao] OTP verify error:", verifyError);
      return NextResponse.redirect(`${origin}/login?error=kakao_verify`);
    }

    // 5. 프로필 이름 업데이트 (비어있을 때만)
    const userId = sessionData.user.id;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();

    if (name && !profile?.name) {
      await supabaseAdmin.from("profiles").update({ name }).eq("id", userId);
    }

    // redirect response에 세션 쿠키를 명시적으로 설정
    const response = NextResponse.redirect(`${origin}/chat`);
    for (const { name: cookieName, value, options } of cookiesToForward) {
      response.cookies.set(cookieName, value, options);
    }
    return response;
  } catch (err) {
    console.error("[Kakao] callback error:", err);
    return NextResponse.redirect(`${origin}/login?error=kakao_unknown`);
  }
}
