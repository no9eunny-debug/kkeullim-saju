// 만세력 (사주팔자) 계산 라이브러리
// 천간, 지지, 오행 등 기초 데이터 + 사주 산출 로직

// 천간 (10개)
const CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
// 지지 (12개)
const JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
// 오행 (천간)
const OHANG_GAN: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
// 오행 (지지)
const OHANG_JI: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
// 통합 오행 조회
function getOhang(char: string): string {
  return OHANG_GAN[char] || OHANG_JI[char] || "";
}
// 음양 (천간)
const EUMYANG_GAN: Record<string, string> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양", 기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
};
// 음양 (지지)
const EUMYANG_JI: Record<string, string> = {
  자: "양", 축: "음", 인: "양", 묘: "음", 진: "양", 사: "음", 오: "양", 미: "음", 신: "양", 유: "음", 술: "양", 해: "음",
};
function getEumyang(char: string): string {
  return EUMYANG_GAN[char] || EUMYANG_JI[char] || "";
}
// 띠 (지지 → 동물)
const TTI: Record<string, string> = {
  자: "쥐", 축: "소", 인: "호랑이", 묘: "토끼", 진: "용", 사: "뱀",
  오: "말", 미: "양", 신: "원숭이", 유: "닭", 술: "개", 해: "돼지",
};
// 시주 지지 (시간대별)
const SIJU_JIJI: [number, number, string][] = [
  [23, 1, "자"], [1, 3, "축"], [3, 5, "인"], [5, 7, "묘"],
  [7, 9, "진"], [9, 11, "사"], [11, 13, "오"], [13, 15, "미"],
  [15, 17, "신"], [17, 19, "유"], [19, 21, "술"], [21, 23, "해"],
];

// 일주 기준 시주 천간 산출 표
const SIJU_CHEONGAN_TABLE: Record<string, string[]> = {
  갑: ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"],
  기: ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"],
  을: ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  경: ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  병: ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  신: ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  정: ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  임: ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  무: ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"],
  계: ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"],
};

// 기준일: 1900년 1월 31일 = 경진년 기축월 갑진일
const BASE_DATE = new Date(1900, 0, 31); // 1900-01-31
const BASE_YEAR_GAN = 6; // 경 (0:갑 ~ 9:계)
const BASE_YEAR_JI = 4;  // 진 (0:자 ~ 11:해)
const BASE_MONTH_GAN = 5; // 기
const BASE_MONTH_JI = 1;  // 축
const BASE_DAY_GAN = 0;   // 갑
const BASE_DAY_JI = 4;    // 진

function diffDays(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcA - utcB) / msPerDay);
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// 절기 기반 월주 계산은 복잡하므로 근사 공식 사용
// 정확도를 높이려면 만세력 API 교차검증 필요 (GPT에서 보정)
function getMonthPillar(year: number, month: number, yearGanIdx: number) {
  // 월 지지는 고정: 인(1월)~축(12월) → 실제로는 절기 기준이지만 근사
  const monthJiMap = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1]; // 1월=인, 2월=묘, ...
  const monthJiIdx = monthJiMap[month - 1];

  // 연간 기준 월간 산출
  const monthGanBase = (yearGanIdx % 5) * 2;
  const monthGanIdx = mod(monthGanBase + (month - 1), 10);

  return {
    gan: CHEONGAN[monthGanIdx],
    ji: JIJI[monthJiIdx],
  };
}

export interface SajuResult {
  // 사주 원국
  yearPillar: { gan: string; ji: string };
  monthPillar: { gan: string; ji: string };
  dayPillar: { gan: string; ji: string };
  timePillar: { gan: string; ji: string } | null;
  // 일주
  ilju: string;
  // 오행 분포
  ohangDistribution: Record<string, number>;
  // 띠
  tti: string;
  // 음양
  eumyang: { year: string; month: string; day: string; time: string | null };
  // 원본 입력
  input: {
    birthDate: string;
    birthTime: string | null;
    gender: string;
    calendar: string;
  };
}

export function calculateSaju(
  birthDate: string, // YYYY-MM-DD
  birthTime: string | null, // HH:MM or null
  gender: string,
  calendar: string = "solar"
): SajuResult {
  const date = new Date(birthDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // 연주
  const yearGanIdx = mod(BASE_YEAR_GAN + (year - 1900), 10);
  const yearJiIdx = mod(BASE_YEAR_JI + (year - 1900), 12);

  // 월주
  const mp = getMonthPillar(year, month, yearGanIdx);

  // 일주
  const days = diffDays(date, BASE_DATE);
  const dayGanIdx = mod(BASE_DAY_GAN + days, 10);
  const dayJiIdx = mod(BASE_DAY_JI + days, 12);

  // 시주
  let timePillar: { gan: string; ji: string } | null = null;
  if (birthTime) {
    const [h] = birthTime.split(":").map(Number);
    const hour = h;
    let timeJiIdx = 0;
    for (const [start, end, ji] of SIJU_JIJI) {
      if (start > end) { // 자시 (23~1)
        if (hour >= start || hour < end) { timeJiIdx = JIJI.indexOf(ji as any); break; }
      } else {
        if (hour >= start && hour < end) { timeJiIdx = JIJI.indexOf(ji as any); break; }
      }
    }
    const dayGan = CHEONGAN[dayGanIdx];
    const timeGanArr = SIJU_CHEONGAN_TABLE[dayGan];
    const timeGan = timeGanArr[timeJiIdx];
    timePillar = { gan: timeGan, ji: JIJI[timeJiIdx] };
  }

  const yearPillar = { gan: CHEONGAN[yearGanIdx], ji: JIJI[yearJiIdx] };
  const monthPillar = { gan: mp.gan, ji: mp.ji };
  const dayPillar = { gan: CHEONGAN[dayGanIdx], ji: JIJI[dayJiIdx] };

  // 오행 분포
  const allElements = [
    yearPillar.gan, yearPillar.ji,
    monthPillar.gan, monthPillar.ji,
    dayPillar.gan, dayPillar.ji,
    ...(timePillar ? [timePillar.gan, timePillar.ji] : []),
  ];
  const ohangDistribution: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const el of allElements) {
    const oh = getOhang(el);
    if (oh) ohangDistribution[oh]++;
  }

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    timePillar,
    ilju: `${dayPillar.gan}${dayPillar.ji}`,
    ohangDistribution,
    tti: TTI[yearPillar.ji],
    eumyang: {
      year: getEumyang(yearPillar.gan),
      month: getEumyang(monthPillar.gan),
      day: getEumyang(dayPillar.gan),
      time: timePillar ? getEumyang(timePillar.gan) : null,
    },
    input: { birthDate, birthTime, gender, calendar },
  };
}

// 사주 데이터를 AI 프롬프트용 텍스트로 변환
export function sajuToPromptText(saju: SajuResult, mbti: string): string {
  const lines = [
    `[사주 원국 정보]`,
    `MBTI: ${mbti}`,
    `성별: ${saju.input.gender === "male" ? "남성" : "여성"}`,
    `생년월일: ${saju.input.birthDate}${saju.input.birthTime ? ` ${saju.input.birthTime}` : " (시간 미상)"}`,
    ``,
    `연주: ${saju.yearPillar.gan}${saju.yearPillar.ji} (${getOhang(saju.yearPillar.gan)}/${getOhang(saju.yearPillar.ji)})`,
    `월주: ${saju.monthPillar.gan}${saju.monthPillar.ji} (${getOhang(saju.monthPillar.gan)}/${getOhang(saju.monthPillar.ji)})`,
    `일주: ${saju.dayPillar.gan}${saju.dayPillar.ji} (${getOhang(saju.dayPillar.gan)}/${getOhang(saju.dayPillar.ji)}) ← 나 자신`,
  ];
  if (saju.timePillar) {
    lines.push(`시주: ${saju.timePillar.gan}${saju.timePillar.ji} (${getOhang(saju.timePillar.gan)}/${getOhang(saju.timePillar.ji)})`);
  }
  lines.push(
    ``,
    `띠: ${saju.tti}띠`,
    `오행 분포: 목${saju.ohangDistribution.목} 화${saju.ohangDistribution.화} 토${saju.ohangDistribution.토} 금${saju.ohangDistribution.금} 수${saju.ohangDistribution.수}`,
  );
  return lines.join("\n");
}
