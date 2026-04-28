// components/Navigation.tsx
"use client";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "오늘의 운세", href: "/daily" },
  { label: "분석하기", href: "/chat" },
  { label: "마이페이지", href: "/mypage" },
];

export default function Navigation() {
  return (
    <nav className="hidden sm:flex items-center gap-6">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: "#4E5968" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
