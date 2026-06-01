import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 세션 쿠키 갱신이 실제로 필요한 경로에만 미들웨어를 적용한다.
  // 공개 랜딩(/, /daily, /chat 등)과 정적 자산은 제외해 매 요청마다
  // Supabase auth 서버로 왕복(콜드스타트 시 수 초)하는 비용을 없앤다.
  matcher: ["/mypage/:path*", "/admin/:path*", "/api/auth/:path*"],
};
