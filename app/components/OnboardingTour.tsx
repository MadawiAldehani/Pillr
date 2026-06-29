"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Clock, List, LayoutDashboard, Search, X, ChevronRight, ChevronLeft, MessageCircle } from "lucide-react";
import { useApp } from "@/app/store";

const TOUR_KEY = "pillr_tour_v1";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
  accent: string;
  bg: string;
  iconBg: string;
}

const STEPS: Step[] = [
  {
    icon: (
      <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
        <rect width="36" height="20" rx="10" fill="#1D9E75" />
        <rect x="18" width="18" height="20" rx="10" fill="#178A66" />
        <line x1="18" y1="0" x2="18" y2="20" stroke="#fff" strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
    title: "Welcome to Pillr 💊",
    description: "Your AI-powered companion for pharmacy practice in Kuwait. Here's a quick tour of everything you can do.",
    accent: "#1D9E75",
    bg: "linear-gradient(135deg, #0F2438 0%, #133048 100%)",
    iconBg: "rgba(255,255,255,0.12)",
  },
  {
    icon: <MessageSquare size={30} strokeWidth={1.8} />,
    title: "Rx Assistant",
    description: "Check drug interactions instantly using AI. Type the medications and patient details to get a clinical analysis.",
    tip: "Try: Warfarin + Aspirin",
    accent: "#1D9E75",
    bg: "linear-gradient(135deg, #E7F4EE 0%, #D0EDE0 100%)",
    iconBg: "#C0E6D2",
  },
  {
    icon: <Clock size={30} strokeWidth={1.8} />,
    title: "Duty Tracker",
    description: "Clock in and out of shifts, log on-call hours, and track your monthly shift compliance — all in one place.",
    tip: "Tap Clock In to start your shift",
    accent: "#6366F1",
    bg: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
    iconBg: "#C7D2FE",
  },
  {
    icon: <List size={30} strokeWidth={1.8} />,
    title: "Case Log",
    description: "Save every case you handle. Track medications, severity levels, DRPs, and flag cases that need doctor follow-up.",
    tip: "Cases saved from Rx Assistant appear here automatically",
    accent: "#D97706",
    bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
    iconBg: "#FCD34D",
  },
  {
    icon: <Search size={30} strokeWidth={1.8} />,
    title: "Drug Search",
    description: "Look up any drug for clinical details, common interactions, and dosing guidance from your reference library.",
    tip: "Search by brand name or generic name",
    accent: "#0891B2",
    bg: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
    iconBg: "#7DD3FC",
  },
  {
    icon: <MessageCircle size={30} strokeWidth={1.8} />,
    title: "Feedback",
    description: "Have a feature idea or found a bug? Send feedback directly to the admin. Your input shapes how Pillr improves.",
    tip: "Feature requests are always welcome",
    accent: "#7C3AED",
    bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
    iconBg: "#C4B5FD",
  },
  {
    icon: <LayoutDashboard size={30} strokeWidth={1.8} />,
    title: "You're all set! 🎉",
    description: "Your dashboard shows shifts logged, cases this month, DRPs caught, and shift compliance — all at a glance.",
    tip: "The dashboard updates in real time",
    accent: "#1D9E75",
    bg: "linear-gradient(135deg, #E7F4EE 0%, #D0EDE0 100%)",
    iconBg: "#C0E6D2",
  },
];

export function OnboardingTour() {
  const { state } = useApp();
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (
      state.supabaseUser &&
      state.screen !== "login" &&
      state.screen !== "agreement" &&
      state.screen !== "resetpassword"
    ) {
      const seen = typeof window !== "undefined" && localStorage.getItem(TOUR_KEY);
      if (!seen) setVisible(true);
    }
  }, [state.screen, state.supabaseUser]);

  const dismiss = () => {
    if (typeof window !== "undefined") localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  };

  const goTo = (next: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 120);
  };

  if (!visible) return null;

  const current  = STEPS[step];
  const isFirst  = step === 0;
  const isLast   = step === STEPS.length - 1;
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,20,34,0.70)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          width: "100%",
          maxWidth: 400,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(10,20,34,0.30)",
          transform: animating ? "scale(0.97)" : "scale(1)",
          opacity: animating ? 0 : 1,
          transition: "transform 0.12s ease, opacity 0.12s ease",
        }}
      >
        {/* ── Hero section ── */}
        <div
          style={{
            background: current.bg,
            padding: "32px 28px 26px",
            position: "relative",
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {/* Skip button */}
          <button
            onClick={dismiss}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(0,0,0,0.12)",
              border: "none", cursor: "pointer",
              color: step === 0 ? "rgba(255,255,255,0.8)" : "#64748B",
              padding: "5px 10px",
              borderRadius: 999,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 12, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <X size={11} /> Skip
          </button>

          {/* Icon */}
          <div
            style={{
              width: 72, height: 72,
              borderRadius: 20,
              background: current.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: step === 0 ? "#fff" : current.accent,
              boxShadow: `0 8px 24px ${current.accent}25`,
            }}
          >
            {current.icon}
          </div>

          {/* Text */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 20, fontWeight: 700,
                color: step === 0 ? "#fff" : "#0F2438",
                marginBottom: 10,
                letterSpacing: "-0.01em",
              }}
            >
              {current.title}
            </div>
            <div
              style={{
                fontSize: 14, lineHeight: 1.65,
                color: step === 0 ? "rgba(255,255,255,0.78)" : "#4A5568",
              }}
            >
              {current.description}
            </div>
          </div>

          {/* Tip pill */}
          {current.tip && (
            <div
              style={{
                background: "rgba(255,255,255,0.85)",
                border: `1.5px solid ${current.accent}30`,
                borderRadius: 999,
                padding: "5px 14px",
                fontSize: 12, fontWeight: 500,
                color: current.accent,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              💡 {current.tip}
            </div>
          )}
        </div>

        {/* ── Progress bar ── */}
        <div style={{ height: 3, background: "#F1F5F9" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: current.accent,
              transition: "width 0.3s ease, background 0.3s ease",
            }}
          />
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fff",
          }}
        >
          {/* Step dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === step ? 20 : 7,
                  height: 7,
                  borderRadius: 99,
                  background: i === step ? current.accent : i < step ? `${current.accent}50` : "#E2E8F0",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {!isFirst && (
              <button
                onClick={() => goTo(step - 1)}
                style={{
                  height: 40, width: 40,
                  background: "#F7F8FA",
                  border: "1px solid #E2E8F0",
                  borderRadius: 11,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748B",
                }}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <button
              onClick={isLast ? dismiss : () => goTo(step + 1)}
              style={{
                height: 40,
                padding: isLast ? "0 22px" : "0 18px",
                background: current.accent,
                border: "none",
                borderRadius: 11,
                cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.2s",
              }}
            >
              {isLast ? "Get started!" : <>Next <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
