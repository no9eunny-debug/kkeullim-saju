// 일간(천간) 10개 캐릭터 시스템
// 각 일간별 고유 성격, 색상, 심볼, 그라데이션

export interface IlganCharacter {
  id: string;
  name: string;
  emoji: string;
  title: string;
  keyword: string;
  gradient: string;
  color: string;
  bgColor: string;
  description: string;
}

const ILGAN_CHARACTERS: Record<string, IlganCharacter> = {
  갑: {
    id: "gap",
    name: "갑목",
    emoji: "\u{1F333}",
    title: "큰 나무의 리더",
    keyword: "리더십 | 우직함 | 성장",
    gradient: "linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)",
    color: "#059669",
    bgColor: "#ecfdf5",
    description: "곧게 뻗은 큰 나무처럼 흔들리지 않는 존재감",
  },
  을: {
    id: "eul",
    name: "을목",
    emoji: "\u{1F33F}",
    title: "유연한 덩굴",
    keyword: "적응력 | 유연함 | 생존력",
    gradient: "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #86efac 100%)",
    color: "#16a34a",
    bgColor: "#f0fdf4",
    description: "어디서든 뿌리내리는 놀라운 적응력의 소유자",
  },
  병: {
    id: "byeong",
    name: "병화",
    emoji: "\u{2600}\u{FE0F}",
    title: "뜨거운 태양",
    keyword: "열정 | 화려함 | 에너지",
    gradient: "linear-gradient(135deg, #9a3412 0%, #ea580c 50%, #fb923c 100%)",
    color: "#ea580c",
    bgColor: "#fff7ed",
    description: "모두를 비추는 태양 같은 존재, 주목받는 에너지",
  },
  정: {
    id: "jeong",
    name: "정화",
    emoji: "\u{1F56F}\u{FE0F}",
    title: "따뜻한 촛불",
    keyword: "섬세함 | 따뜻함 | 감성",
    gradient: "linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #f87171 100%)",
    color: "#dc2626",
    bgColor: "#fef2f2",
    description: "은은하지만 따뜻하게 주변을 밝히는 감성파",
  },
  무: {
    id: "mu",
    name: "무토",
    emoji: "\u{26F0}\u{FE0F}",
    title: "묵직한 산",
    keyword: "안정 | 신뢰 | 포용",
    gradient: "linear-gradient(135deg, #78350f 0%, #a16207 50%, #fbbf24 100%)",
    color: "#a16207",
    bgColor: "#fefce8",
    description: "산처럼 든든한 존재, 흔들려도 무너지지 않는 사람",
  },
  기: {
    id: "gi",
    name: "기토",
    emoji: "\u{1F3D5}\u{FE0F}",
    title: "너른 평야",
    keyword: "포용력 | 부드러움 | 중재",
    gradient: "linear-gradient(135deg, #92400e 0%, #ca8a04 50%, #fde047 100%)",
    color: "#ca8a04",
    bgColor: "#fefce8",
    description: "모든 것을 품는 대지, 갈등을 녹이는 중재자",
  },
  경: {
    id: "gyeong",
    name: "경금",
    emoji: "\u{2694}\u{FE0F}",
    title: "날카로운 검",
    keyword: "결단력 | 정의 | 강함",
    gradient: "linear-gradient(135deg, #1e293b 0%, #475569 50%, #94a3b8 100%)",
    color: "#475569",
    bgColor: "#f1f5f9",
    description: "흔들림 없는 판단력, 한번 결심하면 끝까지",
  },
  신: {
    id: "sin",
    name: "신금",
    emoji: "\u{1F48E}",
    title: "빛나는 보석",
    keyword: "세련됨 | 예리함 | 완벽주의",
    gradient: "linear-gradient(135deg, #312e81 0%, #6366f1 50%, #a5b4fc 100%)",
    color: "#6366f1",
    bgColor: "#eef2ff",
    description: "다듬어진 보석처럼 빛나는 감각과 미적 센스",
  },
  임: {
    id: "im",
    name: "임수",
    emoji: "\u{1F30A}",
    title: "깊은 바다",
    keyword: "지혜 | 깊이 | 포용",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #60a5fa 100%)",
    color: "#2563eb",
    bgColor: "#eff6ff",
    description: "바다처럼 깊은 내면, 끝없는 지혜와 통찰력",
  },
  계: {
    id: "gye",
    name: "계수",
    emoji: "\u{1F327}\u{FE0F}",
    title: "촉촉한 빗물",
    keyword: "감성 | 직관 | 섬세함",
    gradient: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #7dd3fc 100%)",
    color: "#0284c7",
    bgColor: "#f0f9ff",
    description: "빗물처럼 스며드는 감성, 보이지 않는 것을 느끼는 직관",
  },
};

export function getIlganCharacter(ilju: string): IlganCharacter {
  if (!ilju) return ILGAN_CHARACTERS["갑"];
  const firstChar = ilju.charAt(0);
  return ILGAN_CHARACTERS[firstChar] || ILGAN_CHARACTERS["갑"];
}

export function getAllCharacters(): IlganCharacter[] {
  return Object.values(ILGAN_CHARACTERS);
}

export default ILGAN_CHARACTERS;
