import { NextResponse } from "next/server";
import { calculateSaju, type SajuResult } from "@/lib/saju/manseryeok";

function getDailySeed(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

// ── 오행 관계 ──
const GENERATES: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
const CONTROLLED_BY: Record<string, string> = { 목: "금", 화: "수", 토: "목", 금: "화", 수: "토" };

// ── 오행 매핑 (자체 포함 — manseryeok 내부 함수 미노출) ──
const OHANG_GAN: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
const OHANG_JI: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
function getOhang(c: string) { return OHANG_GAN[c] || OHANG_JI[c] || ""; }

const EUMYANG_GAN: Record<string, string> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양", 기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
};
function getEumyang(c: string) { return EUMYANG_GAN[c] || ""; }

// ── 십성 계산 ──
function calcSipsung(dayGan: string, target: string): string {
  const d = OHANG_GAN[dayGan] || "";
  const t = getOhang(target);
  if (!d || !t) return "";
  const same = getEumyang(dayGan) === getEumyang(target);
  if (d === t) return same ? "비견" : "겁재";
  if (GENERATES[d] === t) return same ? "식신" : "상관";
  if (CONTROLS[d] === t) return same ? "편재" : "정재";
  if (CONTROLS[t] === d) return same ? "편관" : "정관";
  if (GENERATES[t] === d) return same ? "편인" : "정인";
  return "";
}

// ── 신살 맵 ──
const DOHUA: Record<string, string> = { 인: "묘", 오: "묘", 술: "묘", 신: "유", 자: "유", 진: "유", 사: "오", 유: "오", 축: "오", 해: "자", 묘: "자", 미: "자" };
const YEOKMA: Record<string, string> = { 인: "신", 오: "신", 술: "신", 신: "인", 자: "인", 진: "인", 사: "해", 유: "해", 축: "해", 해: "사", 묘: "사", 미: "사" };
const HWAGAE: Record<string, string> = { 인: "술", 오: "술", 술: "술", 신: "진", 자: "진", 진: "진", 사: "축", 유: "축", 축: "축", 해: "미", 묘: "미", 미: "미" };
const HONGYEOM: Record<string, string> = { 갑: "오", 을: "사", 병: "인", 정: "미", 무: "진", 기: "진", 경: "술", 신: "유", 임: "자", 계: "신" };

// ── 합충 ──
const YUK_HAP: [string, string][] = [["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"]];
const CHUNG: [string, string][] = [["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"]];

// ── 십성별 점수 ──
const SIPSUNG_SCORES: Record<string, number> = {
  정인: 25, 식신: 23, 편인: 22, 정재: 20, 비견: 18,
  편재: 17, 상관: 15, 정관: 14, 겁재: 12, 편관: 8,
};

// ── 십성 설명 ──
const SIPSUNG_DESC: Record<string, string> = {
  비견: "활력과 경쟁의 에너지",
  겁재: "강한 도전의 에너지",
  식신: "표현력과 창의력의 별",
  상관: "자유와 변화의 에너지",
  편재: "사업 감각과 활동력의 별",
  정재: "안정적인 재물의 에너지",
  편관: "카리스마와 도전의 에너지",
  정관: "안정과 책임감의 에너지",
  편인: "직관과 영감의 별",
  정인: "학문과 지혜의 에너지",
};

// ── 십성별 미니 운세 ──
const SIPSUNG_MINI: Record<string, { love: string; wealth: string; health: string }> = {
  비견: {
    love: "친구 같은 편안한 만남이 좋은 날이에요. 자연스러운 대화가 매력 포인트!",
    wealth: "동료와 협업하면 의외의 성과가 나올 수 있어요",
    health: "적당한 운동이 활력을 줄 거예요. 경쟁 스포츠 추천!",
  },
  겁재: {
    love: "매력적인 라이벌이 나타날 수 있어요. 자신감이 최고의 무기!",
    wealth: "충동 지출 주의! 비교 소비를 조심하세요",
    health: "스트레스가 쌓이기 쉬운 날. 심호흡으로 릴렉스하세요",
  },
  식신: {
    love: "대화가 잘 통하는 날! 센스 있는 표현이 상대 마음을 열어요",
    wealth: "아이디어가 돈이 되는 날. 창의적 접근이 유리해요",
    health: "맛있는 음식으로 에너지 충전하기 딱 좋은 날이에요",
  },
  상관: {
    love: "솔직한 감정 표현이 오히려 매력적으로 보이는 날",
    wealth: "기존 틀을 깨는 발상에서 기회가 올 수 있어요",
    health: "자유로운 야외 활동이 스트레스 해소에 최고예요",
  },
  편재: {
    love: "새로운 장소에서의 만남이 행운! 활동적인 데이트 추천",
    wealth: "예상치 못한 곳에서 수입이 생길 수 있어요",
    health: "바깥 활동이 기운을 북돋아줄 거예요. 산책 추천!",
  },
  정재: {
    love: "진심이 통하는 날. 꾸준한 관계에 작은 보답이 올 거예요",
    wealth: "작지만 확실한 수입이 기대돼요. 저축하기 좋은 날!",
    health: "규칙적인 생활이 건강에 가장 도움이 되는 날이에요",
  },
  편관: {
    love: "강한 끌림이 있지만, 서두르면 역효과. 여유를 가지세요",
    wealth: "큰 결정은 내일로 미루는 게 나을 수 있어요",
    health: "긴장을 풀어주는 시간이 필요해요. 스트레칭이나 명상!",
  },
  정관: {
    love: "안정적이고 신뢰감 있는 모습이 호감을 얻는 날",
    wealth: "원칙대로 하면 결과가 따라와요. 정석이 답!",
    health: "일과 휴식의 밸런스를 잘 지켜주세요",
  },
  편인: {
    love: "직관이 강해지는 날! 느낌 오는 사람을 주목하세요",
    wealth: "영감에서 기회가 올 수 있어요. 아이디어 메모 습관!",
    health: "충분한 수면이 직관력과 건강 모두에 좋아요",
  },
  정인: {
    love: "따뜻한 대화가 관계를 깊게 만들어주는 날이에요",
    wealth: "자기계발에 투자하면 장기적으로 큰 보답이 와요",
    health: "마음이 편안한 날. 긍정 에너지로 가득 채워보세요",
  },
};

// ── 키워드 풀 (오행 x 십성) ──
const KW: Record<string, Record<string, string[]>> = {
  목: {
    _: ["성장", "시작", "도전", "싹트는 기운", "도약"],
    식신: ["창의적 도약", "아이디어 발산", "표현의 확장"],
    정인: ["배움의 기쁨", "성장 가속", "지혜 충전"],
    편재: ["새로운 기회", "활동적 수입", "모험"],
    비견: ["도전 정신", "독립적 에너지", "자기 확신"],
  },
  화: {
    _: ["열정", "자신감", "결단", "빛나는 에너지", "표현"],
    식신: ["끼 폭발", "매력 발산", "센스"],
    비견: ["활력 충전", "에너지 UP", "뜨거운 하루"],
    정재: ["열정적 재물", "노력의 보상", "성취"],
    상관: ["자유로운 표현", "틀 깨기", "개성 발휘"],
  },
  토: {
    _: ["안정", "신뢰", "균형", "중심 잡기", "든든함"],
    정관: ["질서와 조화", "안정 모드", "책임감"],
    정재: ["알찬 하루", "기반 다지기", "실속"],
    정인: ["내면의 성장", "깊은 이해", "차분한 힘"],
    편인: ["직관의 안정", "깊은 사고", "통찰"],
  },
  금: {
    _: ["정리", "결실", "집중", "마무리", "결단"],
    편관: ["결단의 순간", "카리스마", "승부"],
    상관: ["변화의 기회", "틀 깨는 용기", "혁신"],
    편인: ["날카로운 직관", "핵심 파악", "영감"],
    식신: ["감각적 표현", "세련된 하루", "완성도"],
  },
  수: {
    _: ["지혜", "유연함", "소통", "흐름", "직관"],
    정인: ["지혜의 하루", "깊은 사고", "배움"],
    식신: ["유연한 표현", "부드러운 소통", "공감"],
    편재: ["흐름 타기", "기회 포착", "적응력"],
    비견: ["내면의 힘", "조용한 자신감", "깊이"],
  },
};

function pickKeyword(element: string, sipsung: string): { main: string; subs: string[] } {
  const pool = KW[element];
  if (!pool) return { main: "조화", subs: ["균형", "평화"] };
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const specific = pool[sipsung];
  const defaults = pool._;
  if (specific && specific.length > 0) {
    return { main: specific[day % specific.length], subs: defaults.slice(0, 2) };
  }
  return { main: defaults[day % defaults.length], subs: defaults.filter((_, i) => i !== day % defaults.length).slice(0, 2) };
}

// ── 점수 라벨 ──
function scoreLabel(s: number): string {
  if (s >= 92) return "최고의 하루";
  if (s >= 82) return "아주 좋은 날";
  if (s >= 72) return "좋은 날";
  if (s >= 62) return "괜찮은 날";
  if (s >= 52) return "무난한 날";
  if (s >= 45) return "차분하게 보내는 날";
  return "내면을 돌보는 날";
}

// ── 럭키 아이템 ──
const COLORS: Record<string, { name: string; hex: string }[]> = {
  목: [{ name: "그린", hex: "#22C55E" }, { name: "민트", hex: "#2DD4BF" }, { name: "에메랄드", hex: "#10B981" }],
  화: [{ name: "레드", hex: "#EF4444" }, { name: "코랄", hex: "#FB7185" }, { name: "오렌지", hex: "#F97316" }],
  토: [{ name: "옐로우", hex: "#EAB308" }, { name: "베이지", hex: "#D4A574" }, { name: "브라운", hex: "#92400E" }],
  금: [{ name: "화이트", hex: "#F8FAFC" }, { name: "실버", hex: "#CBD5E1" }, { name: "골드", hex: "#FBBF24" }],
  수: [{ name: "네이비", hex: "#1E3A5F" }, { name: "블루", hex: "#3B82F6" }, { name: "인디고", hex: "#4F46E5" }],
};
const NUMBERS: Record<string, number[]> = { 목: [3, 8], 화: [2, 7], 토: [5, 10], 금: [4, 9], 수: [1, 6] };
const DIRECTION: Record<string, string> = { 목: "동쪽", 화: "남쪽", 토: "중앙", 금: "서쪽", 수: "북쪽" };

// ── MBTI 보정 ──
function mbtiBonus(mbti: string | null, todayEl: string): number {
  if (!mbti || mbti.length !== 4) return 5;
  let s = 0;
  const m = mbti.toUpperCase();
  // E/I + 화/수
  if (m[0] === "E" && todayEl === "화") s += 3;
  else if (m[0] === "I" && todayEl === "수") s += 3;
  else s += 1;
  // S/N + 토/목
  if (m[1] === "S" && todayEl === "토") s += 3;
  else if (m[1] === "N" && todayEl === "목") s += 3;
  else s += 1;
  // T/F + 금/화
  if (m[2] === "T" && todayEl === "금") s += 2;
  else if (m[2] === "F" && todayEl === "화") s += 2;
  else s += 1;
  // J/P + 토/수
  if (m[3] === "J" && todayEl === "토") s += 2;
  else if (m[3] === "P" && todayEl === "수") s += 2;
  else s += 1;
  return Math.min(10, s);
}

// ── Premium teaser ──
function teaser(sipsung: string, shinsals: string[], chung: boolean, mbti: string | null): string {
  if (shinsals.includes("도화살"))
    return "오늘 도화살이 활성화됐어요! 이성운에서 특별한 흐름이 보이는데... 연애운 분석에서 자세히 알려드릴게요";
  if (shinsals.includes("홍염살"))
    return "오늘 매력이 극대화되는 홍염살의 날이에요. 이 에너지를 어디에 쓰면 좋을지 궁금하지 않으세요?";
  if (shinsals.includes("역마살"))
    return "역마살이 움직이는 날! 이동이나 변화에서 기회가 올 수 있어요. 올해 운세에서 시기를 더 정확히 볼 수 있어요";
  if (chung)
    return "오늘 사주에서 '충'의 에너지가 감지됐어요. 조심할 부분과 오히려 기회가 되는 부분이 있는데... 기본 사주 분석에서 자세히!";
  if (sipsung === "편관" || sipsung === "겁재")
    return "오늘은 에너지가 강하게 요동치는 날이에요. 이걸 잘 쓰는 법, 전체 사주 분석에서 맞춤 조언을 드릴게요";
  if (sipsung === "식신" || sipsung === "상관")
    return "오늘 창의력과 표현력이 폭발하는 에너지가 있어요. 이 기운을 연애나 재물에 활용하는 법이 궁금하다면...";
  if (mbti)
    return `${mbti} 성향과 오늘의 사주 에너지가 만나면 흥미로운 조합이 나와요. 기본 사주 분석에서 MBTI별 맞춤 해석을 볼 수 있어요`;
  return "오늘의 사주를 더 깊이 들여다보면 숨겨진 기회가 보여요. 기본 사주 분석에서 자세한 해석을 확인해보세요";
}

// ═══════════════════════════════════════════════════════════
// POST Handler
// ═══════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const { birthDate, birthTime, gender, mbti } = await req.json();
    if (!birthDate) {
      return NextResponse.json({ error: "생년월일이 필요해요." }, { status: 400 });
    }

    const userSaju = calculateSaju(birthDate, birthTime || null, gender || "female");
    const todaySaju = calculateSaju(getDailySeed(), null, gender || "female");

    const uGan = userSaju.dayPillar.gan;
    const tGan = todaySaju.dayPillar.gan;
    const uEl = getOhang(uGan);
    const tEl = getOhang(tGan);
    const uJi = userSaju.dayPillar.ji;
    const tJi = todaySaju.dayPillar.ji;
    const yearJi = userSaju.yearPillar.ji;

    // ── 1. 오행 궁합 (0-30) ──
    let s1 = 15;
    if (GENERATES[tEl] === uEl) s1 = 30;           // 오늘이 나를 생
    else if (tEl === uEl) s1 = 22;                  // 같은 오행
    else if (GENERATES[uEl] === tEl) s1 = 18;       // 내가 생
    else if (CONTROLS[uEl] === tEl) s1 = 14;        // 내가 극
    else if (CONTROLS[tEl] === uEl) s1 = 8;         // 날 극

    // ── 2. 십성 관계 (0-25) ──
    const todaySipsung = calcSipsung(uGan, tGan);
    const s2 = SIPSUNG_SCORES[todaySipsung] || 15;

    // ── 3. 합충 (0-20) ──
    let s3 = 10;
    let hasHap = false;
    let hasChung = false;
    for (const [a, b] of YUK_HAP) {
      if ((uJi === a && tJi === b) || (uJi === b && tJi === a)) { s3 = 20; hasHap = true; break; }
    }
    if (!hasHap) {
      for (const [a, b] of CHUNG) {
        if ((uJi === a && tJi === b) || (uJi === b && tJi === a)) { s3 = 3; hasChung = true; break; }
      }
    }

    // ── 4. 신살 활성 (0-15) ──
    let s4 = 7;
    const shinsalActive: string[] = [];
    if (DOHUA[yearJi] === tJi) { s4 = Math.max(s4, 15); shinsalActive.push("도화살"); }
    if (YEOKMA[yearJi] === tJi) { s4 = Math.max(s4, 10); shinsalActive.push("역마살"); }
    if (HWAGAE[yearJi] === tJi) { s4 = Math.max(s4, 12); shinsalActive.push("화개살"); }
    if (HONGYEOM[uGan] === tJi) { s4 = Math.max(s4, 15); shinsalActive.push("홍염살"); }

    // ── 5. MBTI 보정 (0-10) ──
    const s5 = mbtiBonus(mbti, tEl);

    // ── 합산 ──
    const raw = s1 + s2 + s3 + s4 + s5;
    const score = Math.min(98, Math.max(42, raw));

    // ── 키워드 ──
    const { main: keyword, subs: subKeywords } = pickKeyword(tEl, todaySipsung);

    // ── 용신 기반 럭키 아이템 ──
    const lacking = Object.entries(userSaju.ohangDistribution).filter(([, v]) => v === 0).map(([k]) => k);
    const excess = Object.entries(userSaju.ohangDistribution).filter(([, v]) => v >= 3).map(([k]) => k);
    let yongEl = "토";
    if (lacking.length > 0) yongEl = lacking[0];
    else if (excess.length > 0) yongEl = CONTROLLED_BY[excess[0]] || "토";

    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const colors = COLORS[yongEl] || COLORS["토"];
    const luckyColor = colors[day % colors.length];
    const nums = NUMBERS[yongEl] || [5, 10];
    const luckyNumber = nums[day % nums.length];
    const luckyDirection = DIRECTION[yongEl] || "중앙";

    // ── 미니 운세 ──
    const mini = SIPSUNG_MINI[todaySipsung] || SIPSUNG_MINI["비견"];

    // ── 메인 메시지 ──
    const desc = SIPSUNG_DESC[todaySipsung] || "오늘의 에너지";
    const mbtiStr = mbti ? `${mbti} 성향의 ` : "";
    let message: string;
    if (score >= 80) {
      message = `오늘은 '${todaySipsung}(${desc})' 에너지가 ${mbtiStr}당신에게 힘을 실어주는 날이에요. ${keyword}의 기운을 최대한 활용해보세요!`;
    } else if (score >= 60) {
      message = `오늘은 '${todaySipsung}' 에너지 속에서 ${mbtiStr}당신만의 페이스를 유지하면 좋은 하루가 될 거예요. ${luckyColor.name} 컬러가 도움이 될 수 있어요.`;
    } else {
      message = `오늘은 조금 차분하게 보내면 좋은 날이에요. '${todaySipsung}' 에너지가 살짝 도전적이지만, ${mbtiStr}당신의 내면 에너지를 충전하는 시간으로 만들어보세요.`;
    }
    if (shinsalActive.length > 0) {
      message += ` 특히 오늘은 ${shinsalActive.join(", ")}이 활성화된 특별한 날이에요!`;
    }

    // ── 응답 ──
    const dominant = Object.entries(userSaju.ohangDistribution).sort((a, b) => b[1] - a[1])[0][0];
    const shareText = `오늘의 운세 ${score}점 | ${keyword}\n${mbti ? `MBTI: ${mbti} | ` : ""}${userSaju.ilju} 일주\n\n나도 확인하기 -> https://kkeullim-saju.vercel.app/daily`;

    return NextResponse.json({
      date: getDailySeed(),
      score,
      scoreLabel: scoreLabel(score),
      keyword,
      subKeywords,
      luckyColor,
      luckyNumber,
      luckyDirection,
      dominantElement: dominant,
      todayElement: tEl,
      ilju: userSaju.ilju,
      tti: userSaju.tti,
      todaySipsung,
      todaySipsungDesc: desc,
      message,
      miniForecasts: { love: mini.love, wealth: mini.wealth, health: mini.health },
      premiumTeaser: teaser(todaySipsung, shinsalActive, hasChung, mbti),
      shareText,
      shinsalActive,
      hasHap,
      hasChung,
    });
  } catch (error) {
    console.error("[daily] error:", error);
    return NextResponse.json({ error: "오늘의 운세를 불러오지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
