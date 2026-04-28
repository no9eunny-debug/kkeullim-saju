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

// ---------------------------------------------------------------------------
// 십성 (Ten Gods) 계산
// ---------------------------------------------------------------------------
const SIPSUNG_TABLE: Record<string, Record<string, string>> = {
  // 일간 기준으로 다른 천간/지지의 오행과 음양 관계로 십성 결정
  // key: 일간, value: { 대상천간: 십성 }
};

// 오행 상생상극 관계로 십성 계산
function calcSipsung(dayGan: string, targetChar: string): string {
  const dayOhang = OHANG_GAN[dayGan] || OHANG_JI[dayGan] || "";
  const targetOhang = getOhang(targetChar);
  const dayEumyang = EUMYANG_GAN[dayGan] || "";
  const targetEumyang = getEumyang(targetChar);
  if (!dayOhang || !targetOhang) return "";

  const sameYang = dayEumyang === targetEumyang;

  // 비견/겁재: 같은 오행
  if (dayOhang === targetOhang) return sameYang ? "비견" : "겁재";
  // 식신/상관: 내가 생하는 오행
  const generates: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  if (generates[dayOhang] === targetOhang) return sameYang ? "식신" : "상관";
  // 편재/정재: 내가 극하는 오행
  const controls: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
  if (controls[dayOhang] === targetOhang) return sameYang ? "편재" : "정재";
  // 편관/정관: 나를 극하는 오행
  if (controls[targetOhang] === dayOhang) return sameYang ? "편관" : "정관";
  // 편인/정인: 나를 생하는 오행
  if (generates[targetOhang] === dayOhang) return sameYang ? "편인" : "정인";

  return "";
}

// 십성 한글 풀이
const SIPSUNG_DESC: Record<string, string> = {
  비견: "나와 같은 기운, 경쟁·독립심",
  겁재: "나와 비슷하지만 경쟁적인 기운",
  식신: "표현력·창의력·먹을복의 별",
  상관: "자유·반항·재능의 별",
  편재: "사업감각·돈복·활동력의 별",
  정재: "안정적인 재물·성실한 돈 관리",
  편관: "카리스마·권위·도전의 별",
  정관: "안정·책임감·질서의 별",
  편인: "직관·영감·비범한 사고의 별",
  정인: "학문·지혜·어머니의 별",
};

// ---------------------------------------------------------------------------
// 신살 (Special Stars) 계산
// ---------------------------------------------------------------------------
function calcShinsal(saju: SajuResult): string[] {
  const results: string[] = [];
  const yearJi = saju.yearPillar.ji;
  const dayJi = saju.dayPillar.ji;
  const allJi = [saju.yearPillar.ji, saju.monthPillar.ji, saju.dayPillar.ji];
  if (saju.timePillar) allJi.push(saju.timePillar.ji);

  // 도화살 (연지 기준)
  const doHwaMap: Record<string, string> = { 인: "묘", 오: "묘", 술: "묘", 신: "유", 자: "유", 진: "유", 사: "오", 유: "오", 축: "오", 해: "자", 묘: "자", 미: "자" };
  const doHwa = doHwaMap[yearJi];
  if (doHwa && allJi.includes(doHwa)) results.push("도화살(매력·인기의 살)");

  // 역마살 (연지 기준)
  const yeokMaMap: Record<string, string> = { 인: "신", 오: "신", 술: "신", 신: "인", 자: "인", 진: "인", 사: "해", 유: "해", 축: "해", 해: "사", 묘: "사", 미: "사" };
  const yeokMa = yeokMaMap[yearJi];
  if (yeokMa && allJi.includes(yeokMa)) results.push("역마살(이동·변화가 많은 살)");

  // 화개살 (연지 기준)
  const hwaGaeMap: Record<string, string> = { 인: "술", 오: "술", 술: "술", 신: "진", 자: "진", 진: "진", 사: "축", 유: "축", 축: "축", 해: "미", 묘: "미", 미: "미" };
  const hwaGae = hwaGaeMap[yearJi];
  if (hwaGae && allJi.includes(hwaGae)) results.push("화개살(예술·종교·학문의 살)");

  // 홍염살 (일간 기준)
  const hongYeomMap: Record<string, string> = { 갑: "오", 을: "사", 병: "인", 정: "미", 무: "진", 기: "진", 경: "술", 신: "유", 임: "자", 계: "신" };
  const dayGan = saju.dayPillar.gan;
  const hongYeom = hongYeomMap[dayGan];
  if (hongYeom && allJi.includes(hongYeom)) results.push("홍염살(강한 매력·이성운의 살)");

  return results;
}

// ---------------------------------------------------------------------------
// 합/충 관계 계산
// ---------------------------------------------------------------------------
function calcRelations(saju: SajuResult): string[] {
  const results: string[] = [];
  const pillars = [
    { name: "연지", ji: saju.yearPillar.ji },
    { name: "월지", ji: saju.monthPillar.ji },
    { name: "일지", ji: saju.dayPillar.ji },
  ];
  if (saju.timePillar) pillars.push({ name: "시지", ji: saju.timePillar.ji });

  // 육합
  const yukHap: [string, string, string][] = [
    ["자", "축", "토"], ["인", "해", "목"], ["묘", "술", "화"],
    ["진", "유", "금"], ["사", "신", "수"], ["오", "미", "화"],
  ];
  // 삼합
  const samHap: [string, string, string, string][] = [
    ["인", "오", "술", "화"], ["신", "자", "진", "수"],
    ["사", "유", "축", "금"], ["해", "묘", "미", "목"],
  ];
  // 충
  const chung: [string, string][] = [
    ["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"],
  ];

  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i], b = pillars[j];
      // 육합 체크
      for (const [x, y, ohang] of yukHap) {
        if ((a.ji === x && b.ji === y) || (a.ji === y && b.ji === x)) {
          results.push(`${a.name}-${b.name} 육합(${ohang}, 조화로운 결합)`);
        }
      }
      // 충 체크
      for (const [x, y] of chung) {
        if ((a.ji === x && b.ji === y) || (a.ji === y && b.ji === x)) {
          results.push(`${a.name}-${b.name} 충(갈등·변화의 에너지)`);
        }
      }
    }
  }

  // 삼합 체크
  const jiList = pillars.map(p => p.ji);
  for (const [a, b, c, ohang] of samHap) {
    const count = [a, b, c].filter(x => jiList.includes(x)).length;
    if (count >= 2) {
      results.push(`삼합(${ohang}) - ${[a, b, c].filter(x => jiList.includes(x)).join("·")}이 모여 ${ohang}의 기운 강화`);
    }
  }

  return results;
}

// 사주 데이터를 AI 프롬프트용 텍스트로 변환 (강화 버전)
export function sajuToPromptText(saju: SajuResult, mbti: string): string {
  const dayGan = saju.dayPillar.gan;

  const lines = [
    `[사주 원국 정보]`,
    `MBTI: ${mbti}`,
    `성별: ${saju.input.gender === "male" ? "남성" : "여성"}`,
    `생년월일: ${saju.input.birthDate}${saju.input.birthTime ? ` ${saju.input.birthTime}` : " (시간 미상)"}`,
    ``,
    `연주: ${saju.yearPillar.gan}${saju.yearPillar.ji} (${getOhang(saju.yearPillar.gan)}/${getOhang(saju.yearPillar.ji)})`,
    `월주: ${saju.monthPillar.gan}${saju.monthPillar.ji} (${getOhang(saju.monthPillar.gan)}/${getOhang(saju.monthPillar.ji)})`,
    `일주: ${saju.dayPillar.gan}${saju.dayPillar.ji} (${getOhang(saju.dayPillar.gan)}/${getOhang(saju.dayPillar.ji)}) ← 나 자신 (일간: ${dayGan}, ${getOhang(dayGan)}${getEumyang(dayGan)})`,
  ];
  if (saju.timePillar) {
    lines.push(`시주: ${saju.timePillar.gan}${saju.timePillar.ji} (${getOhang(saju.timePillar.gan)}/${getOhang(saju.timePillar.ji)})`);
  }
  lines.push(
    ``,
    `띠: ${saju.tti}띠`,
    `오행 분포: 목${saju.ohangDistribution.목} 화${saju.ohangDistribution.화} 토${saju.ohangDistribution.토} 금${saju.ohangDistribution.금} 수${saju.ohangDistribution.수}`,
  );

  // 오행 과다/부족 분석
  const totalElements = Object.values(saju.ohangDistribution).reduce((a, b) => a + b, 0);
  const excess = Object.entries(saju.ohangDistribution).filter(([, v]) => v >= 3).map(([k]) => k);
  const lacking = Object.entries(saju.ohangDistribution).filter(([, v]) => v === 0).map(([k]) => k);
  if (excess.length) lines.push(`오행 과다: ${excess.join(", ")} (기운이 넘침)`);
  if (lacking.length) lines.push(`오행 부족: ${lacking.join(", ")} (보완 필요)`);

  // 십성 분석
  lines.push(``, `[십성 분석 (일간 ${dayGan} 기준)]`);
  const allChars = [
    { label: "연간", char: saju.yearPillar.gan },
    { label: "연지", char: saju.yearPillar.ji },
    { label: "월간", char: saju.monthPillar.gan },
    { label: "월지", char: saju.monthPillar.ji },
    { label: "일지", char: saju.dayPillar.ji },
  ];
  if (saju.timePillar) {
    allChars.push({ label: "시간", char: saju.timePillar.gan });
    allChars.push({ label: "시지", char: saju.timePillar.ji });
  }
  const sipsungCount: Record<string, number> = {};
  for (const { label, char } of allChars) {
    const ss = calcSipsung(dayGan, char);
    if (ss) {
      lines.push(`${label}(${char}): ${ss} - ${SIPSUNG_DESC[ss] || ""}`);
      sipsungCount[ss] = (sipsungCount[ss] || 0) + 1;
    }
  }

  // 십성 요약
  const dominant = Object.entries(sipsungCount).sort((a, b) => b[1] - a[1]);
  if (dominant.length) {
    lines.push(`주요 십성: ${dominant.slice(0, 3).map(([k, v]) => `${k}(${v}개)`).join(", ")}`);
  }

  // 용신 추정 (부족한 오행 = 용신)
  if (lacking.length) {
    lines.push(``, `[용신 추정]`);
    lines.push(`부족한 ${lacking.join("/")} 오행이 도움이 되는 기운(용신)일 가능성 높음`);
  } else if (excess.length) {
    // 과다한 오행을 억제하는 오행이 용신
    const controlMap: Record<string, string> = { 목: "금", 화: "수", 토: "목", 금: "화", 수: "토" };
    const yongshin = excess.map(e => controlMap[e]).filter(Boolean);
    lines.push(``, `[용신 추정]`);
    lines.push(`과다한 ${excess.join("/")}을 조절하는 ${[...new Set(yongshin)].join("/")} 기운이 도움될 가능성`);
  }

  // 신살
  const shinsal = calcShinsal(saju);
  if (shinsal.length) {
    lines.push(``, `[신살]`);
    shinsal.forEach(s => lines.push(`- ${s}`));
  }

  // 합/충 관계
  const relations = calcRelations(saju);
  if (relations.length) {
    lines.push(``, `[합/충 관계]`);
    relations.forEach(r => lines.push(`- ${r}`));
  }

  return lines.join("\n");
}
