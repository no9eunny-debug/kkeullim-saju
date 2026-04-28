"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Star, ChevronDown, Check, ArrowRight, Heart, Briefcase, Coins, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/* ─────────── Header ─────────── */
function Header() {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg" style={{ backgroundColor: "rgba(255,255,255,0.85)", borderBottom: "1px solid #E5E8EB" }}>
      <div className="mx-auto max-w-5xl flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <Sparkles className="w-5 h-5" style={{ color: "#3182F6" }} />
          <span className="font-bold text-lg" style={{ color: "#191F28" }}>합리적 미신</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/login")} className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-xl transition-colors" style={{ color: "#4E5968" }}>
            로그인
          </button>
          <button onClick={() => router.push("/chat")} className="text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:scale-[1.02]" style={{ backgroundColor: "#3182F6" }}>
            시작하기
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─────────── Hero ─────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 px-5">
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #EBF4FF 0%, #FFFFFF 70%)" }} />
      <div className="mx-auto max-w-2xl text-center">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-8"
          style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}>
          <Sparkles className="w-4 h-4" />
          AI가 풀어주는 사주 × MBTI
        </motion.div>
        <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
          className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6" style={{ color: "#191F28" }}>
          MBTI와 사주가 만나면
          <br />
          <span style={{ color: "#3182F6" }}>운명이 보입니다</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
          className="text-lg sm:text-xl mb-10 leading-relaxed" style={{ color: "#6B7684" }}>
          만세력 기반 정확한 사주 데이터에
          <br className="sm:hidden" />
          {" "}3개 AI의 교차 분석을 더했어요.
          <br />
          나만의 운명 이야기, 지금 바로 확인해보세요.
        </motion.p>
        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => window.location.href = "/chat"} className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#3182F6" }}>
            무료로 시작하기 <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>
            어떻게 분석하나요?
          </button>
        </motion.div>
        <motion.p initial="hidden" animate="visible" custom={4} variants={fadeUp}
          className="mt-6 text-sm" style={{ color: "#8B95A1" }}>
          가입 없이 1회 무료 체험 가능
        </motion.p>
      </div>
    </section>
  );
}

/* ─────────── Empathy (공감) ─────────── */
const worries = [
  { icon: Heart, title: "연애가 왜 이렇게 안 풀리지?", desc: "사주로 보는 연애 패턴과 MBTI 궁합까지 함께 분석해드려요" },
  { icon: Briefcase, title: "이 직장, 나한테 맞는 걸까?", desc: "일주와 MBTI 성향으로 나에게 딱 맞는 커리어를 찾아드려요" },
  { icon: Coins, title: "돈이 모이질 않아...", desc: "재물운 흐름과 성향별 재테크 방향까지 알려드려요" },
  { icon: Shield, title: "올해 특별히 조심할 게 있을까?", desc: "세운 분석으로 올해 주의할 시기와 대처법을 알려드려요" },
];

function Empathy() {
  return (
    <section className="py-24 px-5" style={{ backgroundColor: "#F8FAFB" }}>
      <div className="mx-auto max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-16">
          <p className="text-sm font-bold mb-3" style={{ color: "#3182F6" }}>이런 고민, 해본 적 있지 않나요?</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#191F28" }}>혼자 끙끙대지 마세요</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-5">
          {worries.map((w, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1} variants={fadeUp}
              className="rounded-2xl p-7 transition-all hover:shadow-lg hover:-translate-y-1" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#EBF4FF" }}>
                <w.icon className="w-6 h-6" style={{ color: "#3182F6" }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#191F28" }}>{w.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7684" }}>{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Reviews (후기) ─────────── */
const reviews = [
  { name: "김OO", mbti: "INFJ", text: "소름 돋았어요... 일주 분석이 진짜 저를 그대로 설명하더라고요. MBTI랑 엮으니까 더 정확해요.", rating: 5 },
  { name: "이OO", mbti: "ENFP", text: "새벽 3시까지 질문했어요 ㅋㅋ 연애운 보다가 재물운, 건강운까지... 중독성 있어요", rating: 5 },
  { name: "박OO", mbti: "ISTP", text: "다른 사주 앱이랑 차원이 달라요. AI가 교차 분석해주니까 훨씬 깊이 있고 신뢰가 가요.", rating: 5 },
  { name: "최OO", mbti: "ESFJ", text: "남자친구랑 궁합 보는데 너무 재밌었어요. 서로 부족한 점까지 알려줘서 대화 주제가 됐어요!", rating: 5 },
  { name: "정OO", mbti: "INTJ", text: "사주에 관심 없었는데 MBTI랑 같이 보니까 과학적으로 느껴져서 빠졌어요. 친구한테 바로 공유함", rating: 4 },
  { name: "한OO", mbti: "ISFP", text: "로딩 중에 나오는 사주 팁도 재밌고, 결과가 진짜 공감 가요. 카톡으로 다 공유했어요", rating: 5 },
  { name: "윤OO", mbti: "INFP", text: "재회운 봤는데 진짜 울뻔... 사주로 보는 연애 패턴이 너무 정확해서 소름이에요", rating: 5 },
  { name: "장OO", mbti: "ENTJ", text: "직업 적성 분석이 신기했어요. 지금 이직 고민 중인데 방향이 좀 잡힌 느낌?", rating: 5 },
  { name: "서OO", mbti: "ENTP", text: "궁합 보고 남친이랑 한참 얘기했어요 ㅋㅋ 사주로 보니까 진짜 잘 맞는 부분이랑 조심할 부분이 딱 나오더라고요", rating: 5 },
  { name: "조OO", mbti: "ISTJ", text: "재물운 분석이 현실적이어서 좋았어요. 막연한 부자될거야~ 가 아니라 구체적인 방향을 알려줘요", rating: 4 },
  { name: "민OO", mbti: "ENFJ", text: "건강운 봤는데 평소에 약한 부분이랑 딱 맞아서 깜짝 놀랐어요. 오행 보완법도 실용적!", rating: 5 },
  { name: "강OO", mbti: "ESTP", text: "올해 운세가 진짜 찰떡이에요. 상반기에 조심하라는 거 보고 이미 겪은 일이라 소름 돋음", rating: 5 },
];

function Reviews() {
  const [scrollX, setScrollX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const interval = setInterval(() => {
      setScrollX(prev => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        const next = prev + 1;
        if (next >= maxScroll) return 0;
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollX;
    }
  }, [scrollX]);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-5">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-16">
          <p className="text-sm font-bold mb-3" style={{ color: "#3182F6" }}>실제 이용 후기</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#191F28" }}>이미 많은 분들이 빠져들었어요</h2>
        </motion.div>
      </div>
      <div ref={containerRef} className="flex gap-5 overflow-x-auto scrollbar-hide px-5"
        style={{ scrollBehavior: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}
        onMouseEnter={() => { if (containerRef.current) setScrollX(containerRef.current.scrollLeft); }}
        onMouseLeave={() => {}}>
        <div className="shrink-0 w-1 sm:w-8" />
        {reviews.map((r, i) => (
          <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
            className="shrink-0 w-72 rounded-2xl p-6" style={{ backgroundColor: "#F8FAFB", border: "1px solid #E5E8EB" }}>
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: r.rating }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              {Array.from({ length: 5 - r.rating }).map((_, j) => (
                <Star key={`e${j}`} className="w-4 h-4 text-gray-200" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#4E5968" }}>&ldquo;{r.text}&rdquo;</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}>
                {r.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#191F28" }}>{r.name}</p>
                <p className="text-xs" style={{ color: "#8B95A1" }}>{r.mbti}</p>
              </div>
            </div>
          </motion.div>
        ))}
        <div className="shrink-0 w-1 sm:w-8" />
      </div>
    </section>
  );
}

/* ─────────── ResultPreview (결과 예시) ─────────── */
const sampleResults = [
  {
    label: "연애운",
    tag: "ENFP + 경자일주 여성",
    text: "당신은 자유로운 영혼처럼 보이지만, 실제 연애에서는 안정감을 깊이 원하는 타입이에요. \uD83C\uDF19\n\n일주가 경자(庚子)인 당신은 겉으로는 쿨하고 독립적이지만, 속으로는 '나를 진심으로 이해해주는 사람'을 찾고 있어요. ENFP의 열정적인 에너지와 경금(庚金)의 단단한 내면이 만나서...",
  },
  {
    label: "재물운",
    tag: "INTJ + 임오일주 남성",
    text: "임오일주에 INTJ라면, 투자에 있어서 남다른 직관력을 가지고 계세요. \uD83D\uDCB0\n\n임수(壬水)는 큰 바다와 같은 기운으로, 돈의 흐름을 읽는 감각이 뛰어나요. 여기에 INTJ의 전략적 사고가 더해지면 장기 투자에서 빛을 발하는 타입이에요...",
  },
  {
    label: "궁합",
    tag: "ISFJ 여성 \u00D7 ENTP 남성",
    text: "서로 다른 듯 묘하게 끌리는 조합이에요! \u2728\n\nISFJ의 따뜻한 헌신과 ENTP의 자유로운 창의성은 처음엔 신선하지만, 시간이 지나면 생활 방식에서 마찰이 생길 수 있어요. 사주로 보면...",
  },
];

function ResultPreview() {
  return (
    <section className="py-24 px-5">
      <div className="mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-16">
          <p className="text-sm font-bold mb-3" style={{ color: "#3182F6" }}>실제 AI 분석 결과 미리보기</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#191F28" }}>이런 분석을 받아볼 수 있어요</h2>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-5">
          {sampleResults.map((s, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1} variants={fadeUp}
              className="relative rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
              {/* 카드 헤더 */}
              <div className="px-6 pt-6 pb-3 flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#EBF4FF", color: "#3182F6" }}>{s.label}</span>
                <span className="text-xs" style={{ color: "#8B95A1" }}>{s.tag}</span>
              </div>
              {/* AI 말풍선 */}
              <div className="px-6 pb-20 flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#3182F6" }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm p-4 text-sm leading-relaxed whitespace-pre-line" style={{ backgroundColor: "#F2F4F6", color: "#4E5968" }}>
                  {s.text}
                </div>
              </div>
              {/* 하단 gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-[80px] flex items-end justify-center pb-5"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,1) 100%)" }}>
                <button onClick={() => window.location.href = "/chat"}
                  className="text-sm font-bold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: "#3182F6" }}>
                  전체 결과 보기 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── FAQ ─────────── */
const faqs = [
  { q: "사주를 잘 몰라도 이용할 수 있나요?", a: "네! MBTI와 생년월일시만 입력하면 AI가 쉽고 재미있게 풀어드려요. 사주 지식이 없어도 충분히 이해할 수 있어요." },
  { q: "분석 결과는 얼마나 정확한가요?", a: "만세력 API로 정확한 사주 데이터를 확보하고, GPT·Gemini·Claude 3개 AI가 교차 분석해요. 단일 AI보다 훨씬 균형 잡힌 결과를 제공합니다." },
  { q: "무료로도 이용할 수 있나요?", a: "비회원은 1회, 무료 회원은 하루 5회까지 간단 분석을 받을 수 있어요. 더 깊은 분석은 베이직·프리미엄 플랜을 이용해보세요." },
  { q: "궁합을 볼 때 상대방 정보가 꼭 필요한가요?", a: "아니요! 상대방 생년월일시나 MBTI를 모르면 '모름'으로 체크해도 대략적인 궁합 분석이 가능해요. 정보가 많을수록 더 정확해져요." },
  { q: "결제 후 취소할 수 있나요?", a: "네, 구독은 언제든 해지 가능하고 다음 결제일부터 적용돼요. 남은 기간은 그대로 이용하실 수 있어요." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-24 px-5" style={{ backgroundColor: "#F8FAFB" }}>
      <div className="mx-auto max-w-2xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-16">
          <p className="text-sm font-bold mb-3" style={{ color: "#3182F6" }}>자주 묻는 질문</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#191F28" }}>궁금한 점이 있으신가요?</h2>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.3 + 1} variants={fadeUp}
              className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E8EB" }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                <span className="font-bold text-sm sm:text-base pr-4" style={{ color: "#191F28" }}>{f.q}</span>
                <ChevronDown className="w-5 h-5 shrink-0 transition-transform duration-300" style={{ color: "#8B95A1", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open === i ? "200px" : "0px", opacity: open === i ? 1 : 0 }}>
                <p className="px-6 pb-6 text-sm leading-relaxed" style={{ color: "#6B7684" }}>{f.a}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Pricing (요금제) ─────────── */
const plans = [
  {
    name: "무료", price: "0", period: "", desc: "가볍게 체험해보세요",
    features: ["하루 5회 간단 분석", "기본 성향 + MBTI 요약", "단일 카테고리"],
    cta: "무료로 시작하기", popular: false, tag: null,
  },
  {
    name: "1회 리포트", price: "4,900", period: "/회", desc: "깊이 있는 분석 한 번",
    features: ["상세 사주 + MBTI 분석 1회", "전체 카테고리 중 1개 선택", "PDF 리포트 저장", "카카오톡 공유"],
    cta: "리포트 구매하기", popular: false, tag: "첫 결제 추천",
  },
  {
    name: "베이직", price: "9,900", period: "/월", desc: "매달 나를 더 깊이 알아가기",
    features: ["하루 20회 상세 분석", "전체 카테고리 이용", "대운·세운 흐름 분석", "궁합 상세 분석", "월간 운세 업데이트"],
    cta: "베이직 시작하기", popular: true, tag: null,
  },
  {
    name: "프리미엄", price: "29,900", period: "/월", desc: "운명을 완전히 파헤치고 싶다면",
    features: ["무제한 분석", "프리미엄 심층 분석", "월운·일운까지 분석", "맞춤 조언 + 해결 방안", "궁합 심화 분석", "스페셜 리포트 월 2회"],
    cta: "프리미엄 시작하기", popular: false, tag: null,
  },
];

function Pricing() {
  return (
    <section className="py-24 px-5">
      <div className="mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-16">
          <p className="text-sm font-bold mb-3" style={{ color: "#3182F6" }}>요금제</p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#191F28" }}>나에게 맞는 플랜을 선택하세요</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1} variants={fadeUp}
              className="relative rounded-2xl p-7 flex flex-col" style={{ backgroundColor: "#FFFFFF", border: p.popular ? "2px solid #3182F6" : "1px solid #E5E8EB" }}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#3182F6" }}>
                  인기
                </div>
              )}
              {p.tag && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#FF6B35" }}>
                  {p.tag}
                </div>
              )}
              <h3 className="text-lg font-bold mb-1" style={{ color: "#191F28" }}>{p.name}</h3>
              <p className="text-sm mb-5" style={{ color: "#8B95A1" }}>{p.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-black" style={{ color: "#191F28" }}>{p.price}</span>
                <span className="text-base" style={{ color: "#8B95A1" }}>원{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: "#4E5968" }}>
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#3182F6" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => window.location.href = "/chat"}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: p.popular ? "#3182F6" : "#F2F4F6", color: p.popular ? "#FFFFFF" : "#4E5968" }}>
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── FinalCTA (최종 전환) ─────────── */
function FinalCTA() {
  return (
    <section className="py-24 px-5" style={{ backgroundColor: "#3182F6" }}>
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
          className="text-3xl sm:text-4xl font-black text-white mb-5">
          운명을 해킹할 준비 되셨나요?
        </motion.h2>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
          className="text-base sm:text-lg leading-relaxed mb-10 whitespace-pre-line" style={{ color: "rgba(255,255,255,0.85)" }}>
          {"MBTI보다 깊고, 사주보다 덜 무서운\n나만의 운명 해석을 시작하세요"}
        </motion.p>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}>
          <button onClick={() => window.location.href = "/chat"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#FFFFFF", color: "#3182F6" }}>
            무료로 시작하기 <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────── Footer ─────────── */
function Footer() {
  return (
    <footer className="py-12 px-5" style={{ backgroundColor: "#191F28" }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: "#3182F6" }} />
            <span className="font-bold text-white">합리적 미신</span>
            <span className="text-xs" style={{ color: "#6B7684" }}></span>
          </div>
          <div className="flex gap-6 text-sm" style={{ color: "#6B7684" }}>
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-white transition-colors">문의하기</a>
          </div>
        </div>
        <p className="text-xs mt-6 text-center sm:text-left" style={{ color: "#4E5968" }}>
          &copy; 2026 합리적 미신. AI 분석 결과는 참고용이며, 전문 상담을 대체하지 않습니다.
        </p>
      </div>
    </footer>
  );
}

/* ─────────── Main Page ─────────── */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Empathy />
        <Reviews />
        <ResultPreview />
        <FAQ />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
