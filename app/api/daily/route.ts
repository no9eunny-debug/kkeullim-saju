import { NextResponse } from "next/server";
import { calculateSaju } from "@/lib/saju/manseryeok";

// 오늘 날짜 기반 운세 시드
function getDailySeed(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

// 오행별 오늘의 키워드
const DAILY_KEYWORDS: Record<string, string[]> = {
  목: ["성장", "시작", "인내", "배움", "도전"],
  화: ["열정", "표현", "사교", "자신감", "결단"],
  토: ["안정", "신뢰", "계획", "중심", "조화"],
  금: ["정리", "결실", "판단", "절제", "집중"],
  수: ["지혜", "유연", "소통", "직관", "휴식"],
};

// 오행별 오늘의 럭키 컬러
const LUCKY_COLORS: Record<string, { name: string; hex: string }> = {
  목: { name: "그린", hex: "#22C55E" },
  화: { name: "레드", hex: "#EF4444" },
  토: { name: "옐로우", hex: "#EAB308" },
  금: { name: "화이트", hex: "#F8FAFC" },
  수: { name: "블랙", hex: "#1E293B" },
};

export async function POST(req: Request) {
  try {
    const { birthDate, birthTime, gender, mbti } = await req.json();

    if (!birthDate) {
      return NextResponse.json({ error: "생년월일이 필요해요." }, { status: 400 });
    }

    const saju = calculateSaju(birthDate, birthTime || null, gender || "female");
    const todaySaju = calculateSaju(getDailySeed(), null, gender || "female");

    // 일주 오행으로 오늘의 키워드 결정
    const dayOhang = saju.ohangDistribution;
    const todayOhang = todaySaju.ohangDistribution;

    // 가장 강한 오행 찾기
    const dominantElement = Object.entries(dayOhang).sort((a, b) => b[1] - a[1])[0][0];
    const todayElement = Object.entries(todayOhang).sort((a, b) => b[1] - a[1])[0][0];

    // 오늘의 날짜로 키워드 인덱스 결정 (매일 바뀜)
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const keywordIdx = dayOfYear % 5;

    const keyword = DAILY_KEYWORDS[dominantElement]?.[keywordIdx] || "조화";
    const luckyColor = LUCKY_COLORS[todayElement] || LUCKY_COLORS["토"];

    // 간단한 점수 (1~100)
    const hash = (birthDate + getDailySeed())
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    const score = (hash % 40) + 60; // 60~99

    return NextResponse.json({
      date: getDailySeed(),
      score,
      keyword,
      luckyColor,
      dominantElement,
      todayElement,
      ilju: saju.ilju,
      tti: saju.tti,
      message: `오늘은 '${keyword}'의 기운이 강한 날이에요. ${mbti || ""} 성향의 당신에게는 ${luckyColor.name} 컬러가 행운을 가져다줄 거예요.`,
    });
  } catch (error) {
    console.error("[daily] error:", error);
    return NextResponse.json({ error: "오늘의 운세를 불러오지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
