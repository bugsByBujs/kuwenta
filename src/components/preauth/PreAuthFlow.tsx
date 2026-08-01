"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { peso } from "@/lib/money";
import { payBreakdown, hourlyRate, type PayConfig } from "@/lib/ph";
import { signIn, signUp, signInWithGoogle, completeSetup } from "@/actions/auth";
import type { AccountInput } from "@/schemas";

/* ---------------- content ---------------- */
const SLIDES = [
  {
    icon: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M16 12h4"/><circle cx="16" cy="12" r="0.5" fill="currentColor"/></svg>`,
    title: "All your money, one place",
    body: "Track banks, e-wallets, and cash together — see every peso across your accounts at a glance.",
  },
  {
    icon: `<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/></svg>`,
    title: "Just type it, tama na",
    body: 'Say "paid 120 coffee sa GoTyme" and Kuwenta logs the expense to the right account for you.',
  },
  {
    icon: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    title: "Split every sahod smartly",
    body: "Auto-divide each cutoff into bills, daily food, savings, and an untouchable emergency fund.",
  },
];

const BANK_OPTIONS: { label: string; type: AccountInput["type"] }[] = [
  { label: "GCash", type: "wallet" },
  { label: "Maya", type: "wallet" },
  { label: "GoTyme", type: "bank" },
  { label: "SeaBank", type: "bank" },
  { label: "Maribank", type: "bank" },
  { label: "BPI", type: "bank" },
  { label: "BDO", type: "bank" },
  { label: "UnionBank", type: "bank" },
  { label: "Cash on hand", type: "cash" },
];

type Phase = "onboarding" | "auth" | "otp" | "setup";

/* floating-label input matching the design-system Input */
function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focus, setFocus] = useState(false);
  const floated = focus || value.length > 0;
  return (
    <div style={{ position: "relative", height: 54 }}>
      <label
        style={{
          position: "absolute",
          left: 12,
          top: floated ? 8 : 17,
          fontSize: floated ? "1.05rem" : "1.5rem",
          color: focus ? "var(--green-accent)" : "var(--text-black-soft)",
          transition: "all .15s ease",
          pointerEvents: "none",
          letterSpacing: floated ? ".04em" : 0,
          textTransform: floated ? "uppercase" : "none",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          height: 54,
          boxSizing: "border-box",
          padding: floated ? "20px 12px 6px" : "0 12px",
          border: `1px solid ${focus ? "var(--green-accent)" : "var(--input-border)"}`,
          borderRadius: "var(--radius-input)",
          fontSize: "1.6rem",
          fontFamily: "var(--font-sans)",
          color: "var(--text-black)",
          outline: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}

const pillBtn = (bg: string, color: string, border = bg): React.CSSProperties => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 24px",
  borderRadius: "var(--radius-pill)",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: "1.6rem",
  cursor: "pointer",
  textAlign: "center",
  background: bg,
  color,
  border: `1px solid ${border}`,
});

export function PreAuthFlow({ initial = "onboarding" }: { initial?: Phase | "register" }) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>(initial === "register" ? "auth" : (initial as Phase));
  const [authMode, setAuthMode] = useState<"login" | "register">(
    initial === "register" ? "register" : "login"
  );
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // auth fields
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("+63 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);

  // otp
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // setup
  const [salary, setSalary] = useState("18000");
  const [pay, setPay] = useState<PayConfig>({
    scheduleType: "fixed",
    workDays: 22,
    hoursPerDay: 8,
    sss: true,
    philhealth: true,
    pagibig: true,
    minimumWage: false,
  });
  const [banks, setBanks] = useState<Set<string>>(
    () => new Set(["GCash", "GoTyme", "Maribank", "Cash on hand"])
  );

  const salaryNum = Number(salary) || 0;
  const bd = useMemo(() => payBreakdown(salaryNum, pay), [salaryNum, pay]);

  /* ------------- auth actions ------------- */
  async function doLogin() {
    setBusy(true);
    setError(null);
    const { error } = await signIn({ email, password });
    if (error) {
      setError(error);
      setBusy(false);
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  async function doRegister() {
    if (!agree) {
      setError("Please agree to the Terms to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await signUp({ email, password, fullName, mobile });
    if (error) {
      setError(error);
      setBusy(false);
      return;
    }
    setBusy(false);
    setPhase("otp");
  }

  async function googleAuth() {
    setError(null);
    const { url, error } = await signInWithGoogle();
    if (error) {
      setError(error);
      return;
    }
    if (url) window.location.assign(url);
  }

  function onOtpChange(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  }
  const otpComplete = otp.every((d) => d !== "");

  async function finishSetup() {
    setBusy(true);
    setError(null);
    const chosen = BANK_OPTIONS.filter((b) => banks.has(b.label));
    const { error } = await completeSetup({
      salary: salaryNum,
      pay,
      banks: chosen.map((b) => ({ name: b.label, type: b.type, balance: 0 })),
    });
    if (error) {
      setError(error);
      setBusy(false);
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  /* ================= render ================= */
  if (phase === "onboarding") {
    const s = SLIDES[slide];
    const last = slide === SLIDES.length - 1;
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--green-house)",
          color: "#fff",
          padding: "20px 28px 32px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {SLIDES.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === slide ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === slide ? "#fff" : "var(--white-a30)",
                  transition: "width .2s",
                }}
              />
            ))}
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setAuthMode("register");
              setPhase("auth");
            }}
            style={{ color: "var(--white-a70)", fontSize: "1.3rem", textDecoration: "none" }}
          >
            Skip
          </a>
        </div>
        <div
          key={slide}
          className="slide-in"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: "50%",
              background: "var(--white-a10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--white-a20)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff" }} dangerouslySetInnerHTML={{ __html: s.icon }} />
            </div>
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 600, lineHeight: 1.25 }}>{s.title}</div>
          <div style={{ fontSize: "1.5rem", color: "var(--white-a70)", maxWidth: 300, lineHeight: 1.5 }}>
            {s.body}
          </div>
        </div>
        {last ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => {
                setAuthMode("register");
                setPhase("auth");
              }}
              style={pillBtn("#fff", "var(--green-accent)")}
            >
              Sign up
            </button>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setAuthMode("login");
                setPhase("auth");
              }}
              style={{
                textAlign: "center",
                color: "#fff",
                fontSize: "1.4rem",
                fontWeight: 600,
                textDecoration: "none",
                padding: 8,
              }}
            >
              Log in
            </a>
          </div>
        ) : (
          <button onClick={() => setSlide(slide + 1)} style={pillBtn("#fff", "var(--green-accent)")}>
            Continue
          </button>
        )}
      </div>
    );
  }

  if (phase === "auth") {
    const isLogin = authMode === "login";
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 28px",
          background: "var(--neutral-warm)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "3.6rem",
              color: "var(--green-starbucks)",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Kuwenta
          </div>
          <div style={{ fontSize: "1.5rem", color: "var(--text-black-soft)" }}>
            Track every peso, painlessly.
          </div>
        </div>

        <button
          onClick={googleAuth}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: 13,
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--input-border)",
            background: "#fff",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "var(--text-black)",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.3 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.4 36.4 44 30.9 44 24c0-1.3-.1-2.3-.4-3.5z" />
          </svg>
          Continue with Google
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "20px 0",
            color: "var(--text-black-soft)",
            fontSize: "1.2rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
          or
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isLogin && <FloatingInput label="Full name" value={fullName} onChange={setFullName} />}
          {!isLogin && <FloatingInput label="Mobile number" value={mobile} onChange={setMobile} />}
          <FloatingInput label="Email" type="email" value={email} onChange={setEmail} />
          <FloatingInput label="Password" type="password" value={password} onChange={setPassword} />

          {!isLogin && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--green-accent)" }}
              />
              <span style={{ fontSize: "1.4rem", color: "var(--text-black)" }}>I agree to the Terms</span>
            </label>
          )}

          {error && <p style={{ fontSize: "1.3rem", color: "var(--red)" }}>{error}</p>}

          <button
            onClick={isLogin ? doLogin : doRegister}
            disabled={busy}
            style={{ ...pillBtn("var(--green-accent)", "#fff"), marginTop: 8, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
          </button>
          <div style={{ textAlign: "center", fontSize: "1.4rem", color: "var(--text-black-soft)", marginTop: 8 }}>
            {isLogin ? "No account yet? " : "Already have an account? "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setError(null);
                setAuthMode(isLogin ? "register" : "login");
              }}
              style={{ textDecoration: "underline" }}
            >
              {isLogin ? "Create one" : "Log in"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "otp") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 28px",
          background: "var(--neutral-warm)",
        }}
      >
        <button
          onClick={() => setPhase("auth")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-black-soft)",
            cursor: "pointer",
            marginBottom: 20,
            alignSelf: "flex-start",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ fontSize: "2.2rem", fontWeight: 600, color: "var(--green-starbucks)", marginBottom: 6 }}>
          Verify your number
        </div>
        <div style={{ fontSize: "1.4rem", color: "var(--text-black-soft)", marginBottom: 28 }}>
          Enter the 6-digit code we sent to {mobile.trim() || "+63 917 XXX XX21"}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                otpRefs.current[i] = el;
              }}
              value={d}
              onChange={(e) => onOtpChange(i, e.target.value)}
              maxLength={1}
              inputMode="numeric"
              style={{
                width: 44,
                height: 54,
                textAlign: "center",
                fontSize: "2rem",
                fontWeight: 700,
                border: "1px solid var(--input-border)",
                borderRadius: "var(--radius-input)",
                color: "var(--text-black)",
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: "1.3rem", color: "var(--text-black-soft)", marginBottom: 24 }}>
          Didn&apos;t get it?{" "}
          <a href="#" onClick={(e) => e.preventDefault()} style={{ textDecoration: "underline" }}>
            Resend code
          </a>
        </div>
        <button
          onClick={() => setPhase("setup")}
          disabled={!otpComplete}
          style={pillBtn(
            otpComplete ? "var(--green-accent)" : "var(--ceramic)",
            otpComplete ? "#fff" : "var(--text-black-soft)",
            otpComplete ? "var(--green-accent)" : "var(--input-border)"
          )}
        >
          Verify
        </button>
      </div>
    );
  }

  // phase === "setup"
  const chip = (on: boolean): React.CSSProperties => ({
    padding: "9px 16px",
    borderRadius: "var(--radius-pill)",
    border: `1px solid ${on ? "var(--green-accent)" : "var(--input-border)"}`,
    background: on ? "var(--green-accent)" : "#fff",
    color: on ? "#fff" : "var(--text-black)",
    fontSize: "1.3rem",
    fontWeight: 600,
    cursor: "pointer",
  });
  const seg = (on: boolean): React.CSSProperties => ({
    flex: 1,
    padding: 10,
    borderRadius: "var(--radius-pill)",
    border: `1px solid ${on ? "var(--green-accent)" : "var(--input-border)"}`,
    background: on ? "var(--green-accent)" : "#fff",
    color: on ? "#fff" : "var(--text-black)",
    fontSize: "1.3rem",
    fontWeight: 600,
    cursor: "pointer",
  });
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "1.1rem",
    color: "var(--text-black-soft)",
    textTransform: "uppercase",
    letterSpacing: ".5px",
    marginBottom: 6,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    border: "1px solid var(--input-border)",
    borderRadius: "var(--radius-input)",
    fontSize: "1.6rem",
    fontFamily: "var(--font-sans)",
    color: "var(--text-black)",
  };
  const row = (k: string, v: string, color = "var(--red)") => (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--text-black-soft)" }}>{k}</span>
      <span style={{ color }}>{v}</span>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        padding: "48px 28px 32px",
        background: "var(--neutral-warm)",
        overflowY: "auto",
      }}
    >
      <div style={{ fontSize: "2.2rem", fontWeight: 600, color: "var(--green-starbucks)", marginBottom: 6 }}>
        A few basics
      </div>
      <div style={{ fontSize: "1.4rem", color: "var(--text-black-soft)", marginBottom: 24 }}>
        This helps Kuwenta set up your accounts and pay cycle.
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Monthly salary (₱)</label>
        <input value={salary} onChange={(e) => setSalary(e.target.value)} inputMode="numeric" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Work schedule</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPay({ ...pay, scheduleType: "fixed" })} style={seg(pay.scheduleType === "fixed")}>
            Fixed days
          </button>
          <button onClick={() => setPay({ ...pay, scheduleType: "flexible" })} style={seg(pay.scheduleType === "flexible")}>
            Flexible
          </button>
        </div>
      </div>

      {pay.scheduleType === "fixed" ? (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Work days / month</label>
          <input
            value={String(pay.workDays)}
            onChange={(e) => setPay({ ...pay, workDays: Number(e.target.value) || 0 })}
            inputMode="numeric"
            style={inputStyle}
          />
        </div>
      ) : (
        <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)", marginBottom: 16 }}>
          No fixed days needed — pay is computed per hour logged (₱{hourlyRate(bd.net, pay).toFixed(2)}/hr) from your
          Time &amp; Pay log.
        </div>
      )}

      <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 4 }}>
        Government benefits
      </div>
      <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)", marginBottom: 12 }}>
        Mandatory contributions Kuwenta deducts from your pay estimate.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setPay({ ...pay, sss: !pay.sss })} style={chip(pay.sss)}>SSS</button>
        <button onClick={() => setPay({ ...pay, philhealth: !pay.philhealth })} style={chip(pay.philhealth)}>PhilHealth</button>
        <button onClick={() => setPay({ ...pay, pagibig: !pay.pagibig })} style={chip(pay.pagibig)}>Pag-IBIG</button>
        <button onClick={() => setPay({ ...pay, minimumWage: !pay.minimumWage })} style={chip(pay.minimumWage)}>
          I&apos;m a minimum wage earner
        </button>
      </div>

      <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 10 }}>
        Estimated take-home pay
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
          padding: 16,
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: "1.3rem",
        }}
      >
        {row("Gross monthly", peso(bd.gross), "var(--text-black)")}
        {row("SSS", "-" + peso(bd.sss))}
        {row("PhilHealth", "-" + peso(bd.philhealth))}
        {row("Pag-IBIG", "-" + peso(bd.pagibig))}
        {row("Withholding tax", "-" + peso(bd.withholdingTax))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <span style={{ color: "var(--text-black)", fontWeight: 600 }}>Net monthly pay</span>
          <span style={{ color: "var(--green-starbucks)", fontWeight: 700 }}>{peso(bd.net)}</span>
        </div>
      </div>

      <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 4 }}>
        Which banks or e-wallets do you use?
      </div>
      <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)", marginBottom: 12 }}>
        Pick all that apply — you can add more later.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {BANK_OPTIONS.map((b) => {
          const on = banks.has(b.label);
          return (
            <button
              key={b.label}
              onClick={() => {
                const next = new Set(banks);
                if (on) next.delete(b.label);
                else next.add(b.label);
                setBanks(next);
              }}
              style={chip(on)}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      {error && <p style={{ fontSize: "1.3rem", color: "var(--red)", marginBottom: 12 }}>{error}</p>}

      <button
        onClick={finishSetup}
        disabled={busy || banks.size === 0}
        style={{ ...pillBtn("var(--green-accent)", "#fff"), opacity: busy || banks.size === 0 ? 0.6 : 1 }}
      >
        {busy ? "Setting up…" : "Finish setup"}
      </button>
    </div>
  );
}
