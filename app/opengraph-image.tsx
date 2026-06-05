import { ImageResponse } from "next/og";

export const alt = "합리적 미신 — MBTI × 사주 AI 분석";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 공유 시 카톡/SNS에 뜨는 미리보기 이미지 (코드로 생성)
export default async function Image() {
  const font = await fetch(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf"
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4F46E5 0%, #3182F6 55%, #06B6D4 100%)",
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 38,
            color: "#FFFFFF",
            background: "rgba(255,255,255,0.18)",
            padding: "14px 32px",
            borderRadius: 999,
            marginBottom: 40,
          }}
        >
          ✦ AI 사주 × MBTI
        </div>
        <div style={{ display: "flex", fontSize: 124, color: "#FFFFFF", letterSpacing: -2 }}>
          합리적 미신
        </div>
        <div style={{ display: "flex", fontSize: 46, color: "rgba(255,255,255,0.9)", marginTop: 28 }}>
          MBTI × 사주로 보는 나의 운명
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: font, style: "normal", weight: 700 }],
    }
  );
}
