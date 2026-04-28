import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "합리적 미신 — MBTI × 사주로 보는 나의 운명",
  description:
    "MBTI와 사주를 결합한 AI 맞춤 분석. 만세력 기반 정확한 사주 데이터와 AI가 풀어주는 나만의 운명 이야기.",
  openGraph: {
    title: "합리적 미신 — MBTI × 사주로 보는 나의 운명",
    description:
      "MBTI와 사주를 결합한 AI 맞춤 분석. 만세력 기반 정확한 사주 데이터와 AI가 풀어주는 나만의 운명 이야기.",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
