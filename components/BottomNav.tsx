"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  spending: <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />,
  bills: (
    <>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
      <path d="M9 7h6M9 11h6" />
    </>
  ),
  time: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  money: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M17 12h3" />
    </>
  ),
};

function Svg({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

export function BottomNav() {
  const path = usePathname();
  const router = useRouter();
  const active = (href: string) => path === href || path.startsWith(href + "/");
  const color = (href: string) => (active(href) ? "var(--green-accent)" : "var(--text-black-soft)");

  const tab = (href: string, name: string, label: string) => {
    const on = active(href);
    return (
      <button
        onClick={() => router.push(href)}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: color(href),
          position: "relative",
        }}
      >
        <span
          style={{
            display: "flex",
            transform: on ? "translateY(-1px) scale(1.12)" : "scale(1)",
            transition: "transform 0.28s var(--ease-spring)",
          }}
        >
          <Svg name={name} />
        </span>
        <span style={{ fontSize: "1.05rem", fontWeight: 600, transition: "color 0.2s ease" }}>{label}</span>
        <span
          style={{
            position: "absolute",
            bottom: -6,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--green-accent)",
            transform: on ? "scale(1)" : "scale(0)",
            opacity: on ? 1 : 0,
            transition: "transform 0.28s var(--ease-spring), opacity 0.2s ease",
          }}
        />
      </button>
    );
  };

  return (
    <div
      style={{
        flexShrink: 0,
        height: 76,
        background: "#fff",
        boxShadow: "0 -2px 8px rgba(0,0,0,.06)",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        position: "relative",
      }}
    >
      {tab("/home", "home", "Home")}
      {tab("/spending", "spending", "Spending")}
      {/* raised center — Bills */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Link
          href="/bills"
          aria-label="Bills"
          style={{
            width: 56,
            height: 56,
            marginTop: -28,
            borderRadius: "50%",
            background: active("/bills") ? "var(--green-starbucks)" : "var(--green-accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-frap-base), var(--shadow-frap-ambient)",
            border: "3px solid #fff",
          }}
        >
          <Svg name="bills" size={24} />
        </Link>
      </div>
      {tab("/time", "time", "Time")}
      {tab("/money", "money", "Money")}
    </div>
  );
}
