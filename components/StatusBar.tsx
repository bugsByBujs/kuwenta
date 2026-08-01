export function StatusBar() {
  return (
    <div
      style={{
        height: 44,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        fontSize: "1.4rem",
        fontWeight: 600,
        color: "var(--text-black)",
        background: "transparent",
      }}
    >
      <span>9:41</span>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 9l2-2 2 2M5 6l2-2 2 2M9 3l2-2 2 2" />
        </svg>
        <svg width="20" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="19" height="10" rx="2" />
          <rect x="22" y="4" width="1.5" height="4" fill="currentColor" stroke="none" />
          <rect x="3" y="3" width="15" height="6" rx="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
    </div>
  );
}
