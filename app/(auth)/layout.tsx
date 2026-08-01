export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
        background: "var(--neutral-warm)",
        display: "flex",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100dvh",
          background: "var(--surface-page)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 0 60px rgba(0,0,0,.10)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
