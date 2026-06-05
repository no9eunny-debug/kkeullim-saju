"use client";

import { useEffect } from "react";

// 방문자 통계용 — 하루 1회/기기 방문 기록 (관리자 대시보드 집계)
export default function VisitTracker() {
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("visit_logged_date") === today) return;
      let gid = localStorage.getItem("guest_id");
      if (!gid) {
        gid = crypto.randomUUID();
        localStorage.setItem("guest_id", gid);
      }
      localStorage.setItem("visit_logged_date", today);
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: gid }),
      }).catch(() => {});
    } catch {}
  }, []);
  return null;
}
