"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Send, ArrowLeft, Link2, Check, ChevronRight, UserPlus, Save, X, User, UserCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LOADING_TIPS } from "@/lib/saju/loading-tips";
import dynamic from "next/dynamic";

const ShareCard = dynamic(() => import("@/components/ShareCard"), { ssr: false });

interface SavedProfile {
  id: string;
  name: string;
  mbti: string | null;
  birth_date: string;
  birth_time: string | null;
  gender: string | null;
  is_me: boolean;
}

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const CATEGORIES = [
  { key: "basic", label: "기본 사주풀이", emoji: "🔮" },
  { key: "yearly", label: "올해 운세", emoji: "📅" },
  { key: "love", label: "연애·궁합", emoji: "💕" },
  { key: "marriage", label: "결혼운", emoji: "💍" },
  { key: "reunion", label: "재회운", emoji: "🔄" },
  { key: "wealth", label: "재물운", emoji: "💰" },
  { key: "career", label: "직업·적성", emoji: "💼" },
  { key: "health", label: "건강운", emoji: "🏥" },
  { key: "lucky-items", label: "행운 아이템", emoji: "✨" },
];

// 상대방 정보가 필요할 수 있는 카테고리
const PARTNER_CATEGORIES = ["love", "marriage", "reunion"];

// MBTI별 추가 팁 (LOADING_TIPS와 합쳐서 사용)
const MBTI_TIPS: Record<string, string[]> = {
  ENTJ: ["ENTJ는 CEO가 가장 많은 MBTI 유형이에요", "ENTJ의 사주에 편관이 있으면 리더십이 더 강해져요", "ENTJ는 화(火) 기운과 잘 맞는 경우가 많아요"],
  ENTP: ["ENTP는 토론을 즐기는 변호사형, 식신 기운과 닮았어요", "ENTP는 아이디어 뱅크! 사주의 식상과 시너지가 나요", "ENTP 중 사업가 비율이 상위 3위 안에 들어요"],
  ENFJ: ["ENFJ는 타고난 멘토형, 사주의 정인과 잘 맞아요", "ENFJ는 사람을 끌어당기는 매력이 있어요", "ENFJ는 정관 기운이 강하면 교육자로 빛나요"],
  ENFP: ["ENFP는 호기심 대왕! 사주의 식신과 궁합이 좋아요", "ENFP는 연애할 때 가장 로맨틱한 MBTI로 꼽혀요", "ENFP의 자유로운 에너지는 목(木) 기운과 닮았어요"],
  INTJ: ["INTJ는 전략가형, 사주의 편인과 잘 맞아요", "INTJ는 전체 인구의 2%밖에 안 되는 희귀한 유형이에요", "INTJ는 금(金) 기운이 강하면 분석력이 극대화돼요"],
  INTP: ["INTP는 아인슈타인형! 편인 기운과 시너지 나요", "INTP는 논리적 사고가 뛰어나 사주 분석과 잘 맞아요", "INTP는 혼자 있는 시간이 창의력의 원천이에요"],
  INFJ: ["INFJ는 가장 희귀한 MBTI 유형이에요 (전체 1%)", "INFJ는 직관이 강해서 사주 해석에도 관심이 많아요", "INFJ의 깊은 통찰력은 사주의 정인과 닮았어요"],
  INFP: ["INFP는 이상주의자! 사주의 정인과 잘 어울려요", "INFP는 감성이 풍부해서 예술 분야에서 빛나요", "INFP는 수(水) 기운이 강하면 창작 에너지가 폭발해요"],
  ISTJ: ["ISTJ는 사회의 기둥! 사주의 정관과 찰떡이에요", "ISTJ는 가장 신뢰받는 MBTI 유형으로 꼽혀요", "ISTJ는 토(土) 기운이 강하면 안정감이 극대화돼요"],
  ISFJ: ["ISFJ는 수호자형, 사주의 정인과 잘 맞아요", "ISFJ는 전체 인구의 13%로 가장 많은 유형 중 하나예요", "ISFJ의 헌신적인 성격은 정재 기운과 닮았어요"],
  ESTJ: ["ESTJ는 관리자형! 사주의 정관과 시너지가 좋아요", "ESTJ는 조직을 이끄는 능력이 탁월해요", "ESTJ는 금(金) 기운이 강하면 실행력이 더 강해져요"],
  ESFJ: ["ESFJ는 사교적인 외교관형이에요", "ESFJ는 주변 사람들의 감정을 잘 읽는 능력자예요", "ESFJ의 배려심은 사주의 식신과 닮았어요"],
  ISTP: ["ISTP는 만능 재주꾼! 편재 기운과 잘 맞아요", "ISTP는 위기 상황에서 가장 침착한 MBTI예요", "ISTP의 실용적인 성격은 금(金) 기운과 닮았어요"],
  ISFP: ["ISFP는 예술가형! 식신 기운과 궁합이 좋아요", "ISFP는 감각이 뛰어나 미적 분야에서 빛나요", "ISFP는 자유를 사랑하는 목(木) 기운과 닮았어요"],
  ESTP: ["ESTP는 모험가형! 편관 기운과 시너지 나요", "ESTP는 행동력이 뛰어나 사업에 강해요", "ESTP는 화(火) 기운이 강하면 추진력이 극대화돼요"],
  ESFP: ["ESFP는 엔터테이너! 식신 기운과 찰떡이에요", "ESFP는 분위기를 띄우는 천재예요", "ESFP는 화(火) 기운과 만나면 인기가 폭발해요"],
};

function getLoadingTips(mbti: string): string[] {
  const mbtiTips = MBTI_TIPS[mbti] || [];
  return [...mbtiTips, ...LOADING_TIPS];
}

// 후속 질문 풀 (카테고리별 6개 이상 → 랜덤 3개 표시)
const FOLLOW_UP_POOL: Record<string, string[]> = {
  basic: [
    "내 MBTI랑 사주가 충돌하는 부분이 있어?",
    "올해 운세는 어떤 흐름이에요?",
    "연애할 때 내 패턴이 궁금해요",
    "나한테 맞는 직업군은 뭐가 있어요?",
    "재물운 쪽으로 특이한 점 있어요?",
    "내 MBTI가 사주적으로 어떤 의미예요?",
    "건강 쪽으로 조심할 게 있어요?",
    "나랑 잘 맞는 MBTI가 궁금해요",
  ],
  yearly: [
    "올해 연애운은 어떤 흐름이에요?",
    "올해 재물운이 특히 궁금해요",
    "내 MBTI가 올해 어떤 영향을 받아요?",
    "올해 건강 쪽 주의할 시기가 있어요?",
    "하반기에 특히 좋은 달이 있어요?",
    "올해 직업/이직 운은 어때요?",
    "올해 나한테 맞는 MBTI 궁합이 달라져요?",
  ],
  love: [
    "마음에 두고 있는 사람이랑 궁합 볼 수 있어요?",
    "내 MBTI가 연애에서 어떻게 작용해요?",
    "올해 좋은 인연이 오는 시기가 있어요?",
    "나한테 딱 맞는 이상형의 MBTI는?",
    "연애할 때 내가 조심해야 할 패턴이 뭐예요?",
    "재회 가능성도 볼 수 있어요?",
    "사주적으로 내가 끌리는 유형이 있어요?",
    "우리 둘의 사주 궁합이 궁금해요",
    "이 사람이랑 오래갈 수 있을까요?",
    "상대방 사주도 같이 봐주세요",
  ],
  marriage: [
    "결혼 시기가 궁금해요",
    "미래 배우자는 어떤 사람일까요?",
    "결혼 후 생활이 어떨지 궁금해요",
    "배우자 MBTI는 뭐가 잘 맞을까요?",
    "결혼운이 들어오는 시기가 있나요?",
    "사주로 본 배우자 직업/외모가 궁금해요",
    "결혼 준비할 때 좋은 시기가 있을까요?",
    "이 사람이랑 결혼하면 어떨까요?",
  ],
  reunion: [
    "내 연애 성향 자체를 먼저 분석해주세요",
    "새로운 인연이 오는 시기가 궁금해요",
    "MBTI로 봤을 때 재회 후 패턴이 궁금해요",
    "올해 전체 운세가 궁금해요",
    "직업운에서 새 인연이 올 수도 있어요?",
    "나한테 진짜 맞는 MBTI 유형은?",
  ],
  wealth: [
    "어떤 직업이 나한테 맞아요?",
    "내 MBTI가 돈 쓰는 패턴에 영향을 줘요?",
    "올해 재물운 좋은 시기가 언제예요?",
    "사업 vs 직장, 사주적으로 뭐가 맞아요?",
    "올해 전체 운세도 보고 싶어요",
    "연애운은 어때요?",
    "투자 성향이 MBTI랑 사주에서 어떻게 보여요?",
  ],
  career: [
    "재물운이랑 같이 보면 어때요?",
    "내 MBTI 직업 유형이랑 사주가 일치해요?",
    "올해 이직/전직 타이밍이 있어요?",
    "건강 관리가 일에 어떤 영향을 줘요?",
    "부업이나 사이드잡에 맞는 분야는?",
    "올해 운세 전체 흐름이 궁금해요",
    "나한테 맞는 리더십 스타일이 뭐예요?",
  ],
  health: [
    "기본 사주에서 체질을 더 깊이 보고 싶어요",
    "내 MBTI가 스트레스에 어떻게 반응해요?",
    "올해 운세랑 건강이 어떻게 연결돼요?",
    "직업 적성이랑 건강 밸런스가 궁금해요",
    "연애 스트레스가 건강에 영향 주나요?",
    "재물운도 궁금해요",
    "계절별로 특히 주의할 때가 있어요?",
  ],
  "lucky-items": [
    "올해 행운의 색상이 뭔지 알려주세요",
    "나한테 맞는 행운 액세서리 추천해주세요",
    "오행에 맞는 향수나 차 추천 있을까요?",
    "올해 피해야 할 색상이나 방위가 있나요?",
    "행운의 숫자가 궁금해요",
    "집 인테리어에 좋은 오행 아이템은?",
    "MBTI랑 사주에 맞는 패션 스타일은?",
    "올해 선물 받으면 좋은 아이템은?",
  ],
};

const LUCKY_ITEMS: Record<string, { name: string; desc: string; emoji: string; url: string }[]> = {
  목: [
    { name: "그린 원석 팔찌", desc: "목 기운 보충 행운 액세서리", emoji: "🌿", url: "#" },
    { name: "미니 화분", desc: "책상 위 목 기운 충전", emoji: "🪴", url: "#" },
  ],
  화: [
    { name: "레드 캔들", desc: "화 기운 보충 아로마 캔들", emoji: "🕯️", url: "#" },
    { name: "로즈 향수", desc: "따뜻한 화 기운의 향기", emoji: "🌹", url: "#" },
  ],
  토: [
    { name: "도자기 머그컵", desc: "토 기운을 담은 그릇", emoji: "🍵", url: "#" },
    { name: "천연 코튼 파우치", desc: "자연 소재 토 기운 아이템", emoji: "👜", url: "#" },
  ],
  금: [
    { name: "실버 미니멀 반지", desc: "금 기운 보충 액세서리", emoji: "💍", url: "#" },
    { name: "스테인리스 텀블러", desc: "금속 소재 금 기운 아이템", emoji: "🥤", url: "#" },
  ],
  수: [
    { name: "블루 수정 팔찌", desc: "수 기운 보충 행운 아이템", emoji: "💎", url: "#" },
    { name: "아쿠아 디퓨저", desc: "수 기운의 시원한 향기", emoji: "💧", url: "#" },
  ],
};

// 부족한 오행 찾기 (ohang 텍스트에서 파싱)
function getWeakOhang(content: string): string[] {
  const ohangKeys = ["목", "화", "토", "금", "수"];
  // AI 응답에서 오행 분포를 파싱하거나, 부족한 오행 키워드를 탐색
  const weakOhang: string[] = [];
  for (const key of ohangKeys) {
    if (content.includes(`${key}(`) || content.includes(`${key} 기운`) || content.includes(`${key}이 부족`) || content.includes(`${key}가 부족`) || content.includes(`${key} 부족`)) {
      weakOhang.push(key);
    }
  }
  // 부족 키워드가 없으면 랜덤 2개 추천
  if (weakOhang.length === 0) {
    const shuffled = [...ohangKeys].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }
  return weakOhang.slice(0, 2);
}

// 랜덤 3개 선택 (매번 다르게)
function getFollowUpSuggestions(category: string): string[] {
  const pool = FOLLOW_UP_POOL[category] || FOLLOW_UP_POOL.basic;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

type Step = "input" | "category" | "partner-input" | "chatting";

// 메시지 렌더링 (가독성 개선)
function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={j}>{part}</span>;
  });
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (!line.trim()) return null;

        // 제목 스타일 (## 또는 ### 으로 시작) — 볼드 처리 전에 체크
        if (line.startsWith("### ")) {
          return <h4 key={i} className="font-bold text-sm mt-4 mb-1" style={{ color: "#3182F6" }}>{renderBold(line.replace(/^###\s*/, ""))}</h4>;
        }
        if (line.startsWith("## ")) {
          return <h3 key={i} className="font-black text-base mt-5 mb-2" style={{ color: "#191F28" }}>{renderBold(line.replace(/^##\s*/, ""))}</h3>;
        }

        // **볼드** 처리
        const rendered = renderBold(line);

        // 리스트 아이템
        if (line.match(/^[-•]\s/)) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="shrink-0 mt-0.5" style={{ color: "#3182F6" }}>•</span>
              <span className="leading-relaxed">{rendered}</span>
            </div>
          );
        }

        // 일반 문단
        return <p key={i} className="leading-[1.8]">{rendered}</p>;
      })}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const [step, setStep] = useState<Step>("input");
  const [mbti, setMbti] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState(initialCategory);

  // 상대방 정보 (연애운/궁합/재회운)
  const [wantPartner, setWantPartner] = useState(false);
  const [partnerMbti, setPartnerMbti] = useState("");
  const [partnerBirthDate, setPartnerBirthDate] = useState("");
  const [partnerBirthTime, setPartnerBirthTime] = useState("");
  const [partnerTimeUnknown, setPartnerTimeUnknown] = useState(false);
  const [partnerGender, setPartnerGender] = useState<"male" | "female" | "">("");

  // 유저 세션
  const [userId, setUserId] = useState<string | null>(null);

  // 저장된 프로필
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveIsMe, setSaveIsMe] = useState(false);

  // 채팅 상태 (리셋되지 않도록 유지)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTip, setLoadingTip] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [sajuData, setSajuData] = useState<{ ilju: string; ohang: Record<string, number> } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tipInterval = useRef<NodeJS.Timeout | null>(null);

  const canProceed = mbti && birthDate && gender && nickname.trim();

  // 닉네임 localStorage 저장/불러오기
  useEffect(() => {
    const saved = localStorage.getItem("saju_nickname");
    if (saved) setNickname(saved);
  }, []);
  useEffect(() => {
    if (nickname.trim()) localStorage.setItem("saju_nickname", nickname.trim());
  }, [nickname]);

  // 유저 세션 체크 (안정적으로)
  useEffect(() => {
    const supabase = createClient();
    // 먼저 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    });
    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 저장된 프로필 불러오기
  useEffect(() => {
    loadSavedProfiles();
  }, [userId]);

  const loadSavedProfiles = async () => {
    const guestId = getGuestId();
    const params = userId ? `userId=${userId}` : `guestId=${guestId}`;
    try {
      const res = await fetch(`/api/profiles?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedProfiles(data);
        // "나" 프로필이 있으면 자동으로 정보 채우기
        const myProfile = data.find((p: SavedProfile) => p.is_me);
        if (myProfile && !mbti && !birthDate) {
          setMbti(myProfile.mbti || "");
          setBirthDate(myProfile.birth_date || "");
          setBirthTime(myProfile.birth_time || "");
          setGender((myProfile.gender as "male" | "female") || "");
          if (myProfile.birth_time === null) setBirthTimeUnknown(true);
        }
      }
    } catch {}
  };

  const saveProfile = async (name: string, isMe: boolean) => {
    const guestId = getGuestId();
    try {
      await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, guestId, name, isMe,
          mbti, birthDate, birthTime: birthTimeUnknown ? null : birthTime || null, gender,
        }),
      });
      loadSavedProfiles();
      setShowSaveForm(false);
      setSaveName("");
    } catch {}
  };

  const savePartnerProfile = async (name: string) => {
    const guestId = getGuestId();
    try {
      await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, guestId, name, isMe: false,
          mbti: partnerMbti, birthDate: partnerBirthDate,
          birthTime: partnerTimeUnknown ? null : partnerBirthTime || null,
          gender: partnerGender,
        }),
      });
      loadSavedProfiles();
    } catch {}
  };

  const deleteProfile = async (id: string) => {
    try {
      await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
      loadSavedProfiles();
    } catch {}
  };

  const loadProfile = (profile: SavedProfile) => {
    setMbti(profile.mbti || "");
    setBirthDate(profile.birth_date || "");
    setBirthTime(profile.birth_time || "");
    setBirthTimeUnknown(!profile.birth_time);
    setGender((profile.gender as "male" | "female") || "");
  };

  const loadPartnerProfile = (profile: SavedProfile) => {
    setPartnerMbti(profile.mbti || "");
    setPartnerBirthDate(profile.birth_date || "");
    setPartnerBirthTime(profile.birth_time || "");
    setPartnerTimeUnknown(!profile.birth_time);
    setPartnerGender((profile.gender as "male" | "female") || "");
  };

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 로딩 팁 로테이션 (MBTI별 팁 포함)
  useEffect(() => {
    if (loading) {
      const tips = getLoadingTips(mbti);
      setLoadingTip(tips[Math.floor(Math.random() * tips.length)]);
      tipInterval.current = setInterval(() => {
        setLoadingTip(tips[Math.floor(Math.random() * tips.length)]);
      }, 3500);
    } else {
      if (tipInterval.current) clearInterval(tipInterval.current);
    }
    return () => { if (tipInterval.current) clearInterval(tipInterval.current); };
  }, [loading, mbti]);

  // 게스트 ID
  const getGuestId = () => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("guest_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("guest_id", id); }
    return id;
  };

  // API 호출
  const callAnalysis = useCallback(async (cat: string, extraParams: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mbti,
          birthDate,
          birthTime: birthTimeUnknown ? null : birthTime || null,
          gender,
          nickname: nickname || undefined,
          category: cat,
          userId: userId || undefined,
          guestId: userId ? undefined : getGuestId(),
          ...extraParams,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.result }]);
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.saju) setSajuData({ ilju: data.saju.ilju || "", ohang: data.saju.ohang || {} });
        setAnalysisCount(prev => prev + 1);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요." }]);
    }
    setLoading(false);
  }, [mbti, birthDate, birthTime, birthTimeUnknown, gender, userId]);

  // 분석 시작
  const handleStartAnalysis = (cat: string) => {
    setCategory(cat);
    // 상대방 정보 입력이 필요한 카테고리인지 체크
    if (PARTNER_CATEGORIES.includes(cat)) {
      setWantPartner(false);
      setStep("partner-input");
      return;
    }
    startChatting(cat);
  };

  // 채팅 시작 (기존 메시지 유지하면서 새 분석 추가)
  const startChatting = (cat: string, partnerParams: Record<string, any> = {}) => {
    setStep("chatting");
    // 이전 대화가 있으면 구분선 추가
    if (messages.length > 0) {
      const catLabel = CATEGORIES.find(c => c.key === cat)?.label || cat;
      setMessages(prev => [...prev, { role: "system", content: `── ${catLabel} 분석 시작 ──` }]);
    }
    callAnalysis(cat, partnerParams);
  };

  // 상대방 프로필 저장 팝업
  const [showPartnerSave, setShowPartnerSave] = useState(false);
  const [partnerSaveName, setPartnerSaveName] = useState("");

  // 상대방 정보 포함 분석 시작
  const handleStartWithPartner = () => {
    const params = wantPartner ? {
      partnerMbti: partnerMbti || null,
      partnerBirthDate: partnerBirthDate || null,
      partnerBirthTime: partnerTimeUnknown ? null : partnerBirthTime || null,
      partnerGender: partnerGender || null,
    } : {};
    // 상대방 정보가 있고, 아직 저장 안 된 새 정보면 저장 여부 묻기
    if (wantPartner && partnerBirthDate) {
      const alreadySaved = savedProfiles.some(p =>
        p.birth_date === partnerBirthDate && p.mbti === (partnerMbti || null)
      );
      if (!alreadySaved) {
        setShowPartnerSave(true);
      }
    }
    startChatting(category, params);
  };

  // 후속 질문
  const handleSend = async (customMessage?: string) => {
    const userMsg = (customMessage || input).trim();
    if (!userMsg || loading) return;
    if (!customMessage) setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mbti, birthDate,
          birthTime: birthTimeUnknown ? null : birthTime || null,
          gender, category,
          nickname: nickname || undefined,
          sessionId, message: userMsg, isFollowUp: true,
          userId: userId || undefined,
          guestId: userId ? undefined : getGuestId(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.result }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "오류가 발생했어요. 다시 시도해주세요." }]);
    }
    setLoading(false);
  };

  // 다른 카테고리로 전환 (채팅 유지)
  const handleSwitchCategory = () => {
    setStep("category");
  };

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // 뒤로가기 (리셋하지 않음)
  const handleBack = () => {
    if (step === "chatting") {
      setStep("category");
    } else if (step === "partner-input") {
      setStep("category");
    } else if (step === "category") {
      setStep("input");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFB" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg px-5 py-4" style={{ backgroundColor: "rgba(248,250,251,0.9)", borderBottom: "1px solid #E5E8EB" }}>
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === "input" ? (
              <Link href="/" className="p-1"><ArrowLeft className="w-5 h-5" style={{ color: "#4E5968" }} /></Link>
            ) : (
              <button onClick={handleBack} className="p-1"><ArrowLeft className="w-5 h-5" style={{ color: "#4E5968" }} /></button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: "#3182F6" }} />
              <span className="font-bold" style={{ color: "#191F28" }}>합리적 미신</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === "chatting" && (
              <>
                <button onClick={handleSwitchCategory}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: "#F2F4F6", color: "#6B7684" }}>
                  다른 운세 보기
                </button>
                <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: copied ? "#E8F5E9" : "#F2F4F6", color: copied ? "#2E7D32" : "#6B7684" }}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  {copied ? "복사!" : "공유"}
                </button>
              </>
            )}
            {userId && (
              <Link href="/mypage" className="p-1.5 rounded-lg transition-all" style={{ backgroundColor: "#F2F4F6" }}>
                <UserCircle className="w-5 h-5" style={{ color: "#3182F6" }} />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto max-w-2xl w-full px-5 py-8">
        {/* Step 1: Input */}
        {step === "input" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-black mb-2" style={{ color: "#191F28" }}>내 정보 입력</h1>
              <p className="text-sm" style={{ color: "#8B95A1" }}>정확한 분석을 위해 아래 정보를 입력해주세요</p>
            </div>

            {/* 저장된 프로필 목록 */}
            {savedProfiles.length > 0 && (
              <div>
                <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>저장된 프로필</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {savedProfiles.map(profile => (
                    <button key={profile.id} onClick={() => loadProfile(profile)}
                      className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl transition-all hover:shadow-md group relative"
                      style={{ backgroundColor: profile.is_me ? "#EBF4FF" : "#FFFFFF", border: profile.is_me ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: profile.is_me ? "#3182F6" : "#F2F4F6", color: profile.is_me ? "#FFFFFF" : "#4E5968" }}>
                        {profile.is_me ? <User className="w-4 h-4" /> : profile.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold" style={{ color: "#191F28" }}>
                          {profile.name} {profile.is_me && <span className="text-[10px] font-medium" style={{ color: "#3182F6" }}>나</span>}
                        </p>
                        <p className="text-[10px]" style={{ color: "#8B95A1" }}>{profile.mbti || "?"} · {profile.birth_date}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: "#F04452", color: "#FFFFFF" }}>
                        <X className="w-3 h-3" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MBTI */}
            <div>
              <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>MBTI</label>
              <div className="grid grid-cols-4 gap-2">
                {MBTI_TYPES.map(type => (
                  <button key={type} onClick={() => setMbti(type)} className="py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: mbti === type ? "#3182F6" : "#FFFFFF", color: mbti === type ? "#FFFFFF" : "#4E5968", border: mbti === type ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            {/* Birth Date */}
            <div>
              <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>생년월일</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: birthDate ? "#191F28" : "#8B95A1" }} />
            </div>
            {/* Birth Time */}
            <div>
              <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>태어난 시간</label>
              <div className="flex items-center gap-3">
                <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} disabled={birthTimeUnknown}
                  className="flex-1 px-4 py-3.5 rounded-xl text-sm disabled:opacity-40 outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: birthTime ? "#191F28" : "#8B95A1" }} />
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input type="checkbox" checked={birthTimeUnknown} onChange={e => { setBirthTimeUnknown(e.target.checked); if (e.target.checked) setBirthTime(""); }} className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-sm" style={{ color: "#6B7684" }}>모름</span>
                </label>
              </div>
              <p className="text-xs mt-2" style={{ color: "#8B95A1" }}>시간을 알면 더 정확한 분석이 가능해요</p>
            </div>
            {/* Gender */}
            <div>
              <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>성별</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: "female" as const, label: "여성" }, { key: "male" as const, label: "남성" }].map(g => (
                  <button key={g.key} onClick={() => setGender(g.key)} className="py-3.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: gender === g.key ? "#3182F6" : "#FFFFFF", color: gender === g.key ? "#FFFFFF" : "#4E5968", border: gender === g.key ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            {/* 저장 폼 */}
            {showSaveForm && canProceed && (
              <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                <p className="text-sm font-bold" style={{ color: "#191F28" }}>프로필 저장</p>
                <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="이름 (예: 나, 남자친구, 엄마)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ backgroundColor: "#F8FAFB", border: "1px solid #E5E8EB", color: "#191F28" }} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={saveIsMe} onChange={e => setSaveIsMe(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-sm" style={{ color: "#6B7684" }}>내 프로필로 설정 (다음에 자동 불러오기)</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setShowSaveForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>취소</button>
                  <button onClick={() => saveName && saveProfile(saveName, saveIsMe)} disabled={!saveName}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: "#3182F6" }}>저장</button>
                </div>
              </div>
            )}

            {/* 닉네임 (필수) */}
            <div>
              <label className="text-sm font-bold mb-3 block" style={{ color: "#191F28" }}>
                닉네임 <span className="text-xs font-normal" style={{ color: "#F04452" }}>*필수</span>
              </label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                placeholder="분석에서 불릴 이름 (예: 동은, 블카, 민지)"
                maxLength={10}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#FFFFFF", border: nickname ? "2px solid #3182F6" : "1px solid #E5E8EB", color: "#191F28" }} />
              <p className="text-xs mt-2" style={{ color: "#3182F6" }}>AI가 닉네임으로 친근하게 불러줘요 ✨</p>
            </div>

            {/* 프로필 저장 안내 배너 */}
            {canProceed && !showSaveForm && savedProfiles.length === 0 && (
              <button onClick={() => setShowSaveForm(true)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:shadow-md"
                style={{ backgroundColor: "#EBF4FF", border: "2px dashed #3182F6" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#3182F6" }}>
                  <Save className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#191F28" }}>내 정보 저장하기</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7684" }}>저장하면 다음에 바로 불러올 수 있어요</p>
                </div>
              </button>
            )}

            <div className="flex gap-3">
              {canProceed && !showSaveForm && savedProfiles.length > 0 && (
                <button onClick={() => setShowSaveForm(true)}
                  className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: "#EBF4FF", color: "#3182F6", border: "1px solid #3182F6" }}>
                  <Save className="w-4 h-4" /> 저장
                </button>
              )}
              <button onClick={() => setStep("category")} disabled={!canProceed}
                className="flex-1 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
                style={{ backgroundColor: "#3182F6" }}>
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Category */}
        {step === "category" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-black mb-2" style={{ color: "#191F28" }}>무엇이 궁금하세요?</h1>
              <p className="text-sm" style={{ color: "#8B95A1" }}>{mbti} · {birthDate} · {gender === "female" ? "여성" : "남성"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => handleStartAnalysis(cat.key)}
                  className="flex items-center gap-3 p-5 rounded-2xl text-left transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-bold" style={{ color: "#191F28" }}>{cat.label}</span>
                </button>
              ))}
            </div>
            {messages.length > 0 && (
              <button onClick={() => setStep("chatting")} className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ backgroundColor: "#3182F6", color: "#FFFFFF" }}>
                이전 대화로 돌아가기
              </button>
            )}
            <button onClick={() => setStep("input")} className="w-full py-3 text-sm font-medium" style={{ color: "#8B95A1" }}>← 정보 수정하기</button>
          </div>
        )}

        {/* Step 2.5: 상대방 정보 (연애·궁합/결혼운/재회운) */}
        {step === "partner-input" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-black mb-2" style={{ color: "#191F28" }}>
                {CATEGORIES.find(c => c.key === category)?.emoji} {CATEGORIES.find(c => c.key === category)?.label}
              </h1>
              <p className="text-sm" style={{ color: "#8B95A1" }}>
                상대방 정보를 추가하면 더 정확한 분석이 가능해요
              </p>
            </div>

            {/* 상대방 정보 입력 여부 선택 */}
            {(
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setWantPartner(false)}
                  className="p-4 rounded-2xl text-center transition-all"
                  style={{ backgroundColor: !wantPartner ? "#3182F6" : "#FFFFFF", color: !wantPartner ? "#FFFFFF" : "#4E5968", border: !wantPartner ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                  <p className="text-sm font-bold">나만 분석</p>
                  <p className="text-xs mt-1 opacity-70">내 사주만으로 분석</p>
                </button>
                <button onClick={() => setWantPartner(true)}
                  className="p-4 rounded-2xl text-center transition-all"
                  style={{ backgroundColor: wantPartner ? "#3182F6" : "#FFFFFF", color: wantPartner ? "#FFFFFF" : "#4E5968", border: wantPartner ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                  <div className="flex items-center justify-center gap-1">
                    <UserPlus className="w-4 h-4" />
                    <p className="text-sm font-bold">상대방 추가</p>
                  </div>
                  <p className="text-xs mt-1 opacity-70">더 정확한 분석</p>
                </button>
              </div>
            )}

            {/* 상대방 입력 폼 */}
            {wantPartner && (
              <div className="space-y-5 p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                <h3 className="text-sm font-bold" style={{ color: "#191F28" }}>상대방 정보</h3>

                {/* 저장된 프로필에서 불러오기 */}
                {savedProfiles.filter(p => !p.is_me).length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "#8B95A1" }}>저장된 프로필에서 불러오기</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {savedProfiles.filter(p => !p.is_me).map(profile => (
                        <button key={profile.id} onClick={() => loadPartnerProfile(profile)}
                          className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:shadow-sm"
                          style={{ backgroundColor: "#F8FAFB", border: "1px solid #E5E8EB" }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>
                            {profile.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium" style={{ color: "#191F28" }}>{profile.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Partner MBTI */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "#6B7684" }}>MBTI (선택)</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MBTI_TYPES.map(type => (
                      <button key={type} onClick={() => setPartnerMbti(partnerMbti === type ? "" : type)} className="py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ backgroundColor: partnerMbti === type ? "#3182F6" : "#F8FAFB", color: partnerMbti === type ? "#FFFFFF" : "#4E5968", border: partnerMbti === type ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Partner Birth */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "#6B7684" }}>생년월일 (선택)</label>
                  <input type="date" value={partnerBirthDate} onChange={e => setPartnerBirthDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "#F8FAFB", border: "1px solid #E5E8EB", color: "#191F28" }} />
                </div>
                {/* Partner Time */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "#6B7684" }}>태어난 시간 (선택)</label>
                  <div className="flex items-center gap-3">
                    <input type="time" value={partnerBirthTime} onChange={e => setPartnerBirthTime(e.target.value)} disabled={partnerTimeUnknown}
                      className="flex-1 px-4 py-3 rounded-xl text-sm disabled:opacity-40 outline-none" style={{ backgroundColor: "#F8FAFB", border: "1px solid #E5E8EB", color: "#191F28" }} />
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input type="checkbox" checked={partnerTimeUnknown} onChange={e => { setPartnerTimeUnknown(e.target.checked); if (e.target.checked) setPartnerBirthTime(""); }} className="w-4 h-4 rounded accent-blue-500" />
                      <span className="text-xs" style={{ color: "#6B7684" }}>모름</span>
                    </label>
                  </div>
                </div>
                {/* Partner Gender */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "#6B7684" }}>성별 (선택)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ key: "male" as const, label: "남성" }, { key: "female" as const, label: "여성" }].map(g => (
                      <button key={g.key} onClick={() => setPartnerGender(partnerGender === g.key ? "" : g.key)} className="py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{ backgroundColor: partnerGender === g.key ? "#3182F6" : "#F8FAFB", color: partnerGender === g.key ? "#FFFFFF" : "#4E5968", border: partnerGender === g.key ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("category")} className="flex-1 py-4 rounded-2xl text-base font-bold transition-all" style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>뒤로</button>
              <button onClick={handleStartWithPartner}
                disabled={false}
                className="flex-1 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40" style={{ backgroundColor: "#3182F6" }}>
                분석 시작
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Chat */}
        {step === "chatting" && (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((msg, i) => {
                // 시스템 메시지 (구분선)
                if (msg.role === "system") {
                  return (
                    <div key={i} className="flex items-center gap-3 my-6">
                      <div className="flex-1 h-px" style={{ backgroundColor: "#E5E8EB" }} />
                      <span className="text-xs font-medium shrink-0" style={{ color: "#8B95A1" }}>{msg.content}</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: "#E5E8EB" }} />
                    </div>
                  );
                }

                const isAssistant = msg.role === "assistant";
                // 첫 분석 결과인지 확인 (이전 메시지가 system이거나 첫 메시지)
                const isFirstAnalysis = isAssistant && (i === 0 || messages[i - 1]?.role === "system");
                const weakElements = isAssistant ? getWeakOhang(msg.content) : [];

                return (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-[fadeInUp_0.4s_ease-out]`}>
                    <div className={`${msg.role === "user" ? "max-w-[75%]" : "max-w-[90%]"}`}>
                      <div className={`rounded-2xl px-5 py-4 text-sm`}
                        style={{
                          backgroundColor: msg.role === "user" ? "#3182F6" : "#FFFFFF",
                          color: msg.role === "user" ? "#FFFFFF" : "#333D4B",
                          border: isAssistant ? "1px solid #E5E8EB" : "none",
                          lineHeight: "1.8",
                          boxShadow: isAssistant ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                        }}>
                        {isAssistant ? (
                          <MessageContent content={msg.content} />
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* 행운 아이템 추천 섹션 (AI 분석 결과 하단) */}
                      {isAssistant && isFirstAnalysis && weakElements.length > 0 && (
                        <div className="mt-3 rounded-2xl p-5 text-sm"
                          style={{ background: "linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 50%, #FCE4EC 100%)", border: "1px solid #FFE082" }}>
                          <p className="font-black text-base mb-3" style={{ color: "#191F28" }}>
                            <Sparkles className="w-4 h-4 inline-block mr-1" style={{ color: "#F59E0B" }} />
                            나에게 맞는 행운 아이템
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {weakElements.flatMap(el => (LUCKY_ITEMS[el] || []).map(item => (
                              <a key={`${el}-${item.name}`} href={item.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                                style={{ backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                                <span className="text-2xl">{item.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm" style={{ color: "#191F28" }}>{item.name}</p>
                                  <p className="text-xs" style={{ color: "#6B7684" }}>{item.desc}</p>
                                </div>
                                <span className="text-xs font-medium shrink-0 px-2 py-1 rounded-lg"
                                  style={{ backgroundColor: "#FFF8E1", color: "#F59E0B" }}>
                                  {el}
                                </span>
                              </a>
                            )))}
                          </div>
                          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: "#8B95A1" }}>
                            이 링크는 쿠팡 파트너스 및 네이버 쇼핑 커넥트 활동의 일환으로, 이에 따른 소정의 수수료를 제공받습니다.
                          </p>
                        </div>
                      )}

                      {/* 공유 카드는 메시지 루프 밖에서 렌더링 */}

                      {/* 공유 버튼 (AI 분석 결과) */}
                      {isAssistant && (
                        <div className="flex justify-end mt-1.5">
                          <button
                            onClick={async () => {
                              const shareData = {
                                title: "합리적 미신",
                                text: "[합리적 미신] MBTI + 사주 분석 결과! 나도 해보기 →",
                                url: "https://kkeullim-saju.vercel.app",
                              };
                              try {
                                if (navigator.share) {
                                  await navigator.share(shareData);
                                } else {
                                  await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                                  alert("링크가 복사되었어요!");
                                }
                              } catch {}
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:bg-gray-100"
                            style={{ color: "#8B95A1" }}>
                            <Share2 className="w-3.5 h-3.5" />
                            공유
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 공유 카드 (사주 데이터가 있고 분석 완료 후) */}
              {!loading && sajuData && sajuData.ilju && messages.length > 0 && (
                <div className="flex justify-center animate-[fadeInUp_0.5s_ease-out]">
                  <ShareCard
                    mbti={mbti}
                    ilju={sajuData.ilju}
                    ohang={sajuData.ohang as any}
                    category={category}
                  />
                </div>
              )}

              {/* 후속 질문 추천 칩 */}
              {!loading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
                <div className="space-y-3 pt-4 animate-[fadeInUp_0.5s_ease-out]">
                  <p className="text-sm font-bold" style={{ color: "#3182F6" }}>💬 이런 것도 물어보세요</p>
                  <div className="flex flex-col gap-2">
                    {getFollowUpSuggestions(category).map((suggestion, i) => (
                      <button key={i} onClick={() => handleSend(suggestion)}
                        className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl text-sm font-medium transition-all hover:scale-[1.01] hover:shadow-md"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: "#191F28", animationDelay: `${i * 100}ms` }}>
                        <span>{suggestion}</span>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#3182F6" }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 상대방 프로필 저장 팝업 */}
              {showPartnerSave && (
                <div className="animate-[fadeInUp_0.4s_ease-out] p-4 rounded-2xl space-y-3" style={{ backgroundColor: "#FFF8E1", border: "1px solid #FFE082" }}>
                  <p className="text-sm font-bold" style={{ color: "#191F28" }}>상대방 정보를 저장할까요?</p>
                  <p className="text-xs" style={{ color: "#6B7684" }}>저장하면 다음에 바로 불러올 수 있어요</p>
                  <input value={partnerSaveName} onChange={e => setPartnerSaveName(e.target.value)}
                    placeholder="이름 (예: 남자친구, 썸남, 전남친)"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: "#191F28" }} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowPartnerSave(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>괜찮아요</button>
                    <button onClick={() => { if (partnerSaveName.trim()) { savePartnerProfile(partnerSaveName.trim()); } setShowPartnerSave(false); setPartnerSaveName(""); }}
                      disabled={!partnerSaveName.trim()}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: "#3182F6" }}>저장하기</button>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-5 py-4 text-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex gap-1">
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#3182F6", animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#3182F6", animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#3182F6", animationDelay: "300ms" }} />
                      </span>
                      <span className="text-xs" style={{ color: "#8B95A1" }}>분석 중... (최대 1분)</span>
                    </div>
                    <p className="text-xs" style={{ color: "#3182F6" }}>{loadingTip}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="sticky bottom-0 pt-4 pb-2" style={{ backgroundColor: "#F8FAFB" }}>
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="궁금한 것을 물어보세요..." disabled={loading}
                  className="flex-1 px-4 py-3.5 rounded-2xl text-sm disabled:opacity-50 outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB", color: "#191F28" }} />
                <button onClick={() => handleSend()} disabled={loading || !input.trim()}
                  className="p-3.5 rounded-2xl text-white transition-all hover:scale-[1.05] disabled:opacity-50"
                  style={{ backgroundColor: "#3182F6" }}>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
