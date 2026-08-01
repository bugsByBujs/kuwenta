import { BottomNav } from "@/components/BottomNav";
import { SheetHost } from "@/components/SheetHost";
import { StatusBar } from "@/components/StatusBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
          height: "100dvh",
          background: "var(--surface-page)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 0 60px rgba(0,0,0,.10)",
          overflow: "hidden",
        }}
      >
        <StatusBar />
        <main style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }} className="no-scrollbar">
          {children}
        </main>
        <BottomNav />
        <SheetHost />
      </div>
    </div>
  );
}
