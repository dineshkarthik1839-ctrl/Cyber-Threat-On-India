import type { Threat } from "../../types/threat";

interface AttackTickerProps {
  threats: Threat[];
}

function countryFlag(code: string): string {
  if (!code || code === "--" || code.length !== 2) return "🌐";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

const severityColor: Record<string, string> = {
  critical: "#ff6374",
  high: "#fb8b32",
  medium: "#f5d35f",
  low: "#50d7a9"
};

export default function AttackTicker({ threats }: AttackTickerProps) {
  // Use more threats for a longer marquee
  const latest = threats.slice(0, 25);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 54, // Increased height
        background: "linear-gradient(180deg, #060b14 0%, #080e19 100%)",
        borderTop: "1px solid #1a2a3e",
        display: "flex",
        alignItems: "center",
        zIndex: 9999,
        overflow: "hidden",
        paddingLeft: 8
      }}
    >
      {/* Pulsing Live indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px 0 8px",
          borderRight: "1px solid #1a2a3e",
          marginRight: 12,
          flexShrink: 0,
          background: "#060b14",
          zIndex: 2,
          height: "100%"
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ff6374",
            boxShadow: "0 0 8px #ff6374",
            animation: "pulse 1.5s infinite"
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 800, color: "#ff6374", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          LIVE
        </span>
      </div>

      {/* Scrolling ticker items */}
      <div style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", display: "flex", alignItems: "center", position: "relative" }}>
        <div style={{ display: "inline-block", animation: "marquee 90s linear infinite", paddingLeft: "100%" }}>
          {latest.map((t, idx) => {
            const sevColor = severityColor[t.severity.toLowerCase()] || "#6a7b95";
            return (
              <span
                key={`${t.id}-${idx}`}
                className="ticker-item"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  marginRight: 24,
                  padding: "6px 14px",
                  background: "rgba(10, 18, 30, 0.6)",
                  border: `1px solid ${sevColor}40`,
                  borderRadius: 30,
                  boxShadow: `0 0 10px ${sevColor}15, inset 0 0 10px rgba(0,0,0,0.5)`,
                  backdropFilter: "blur(4px)",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 26, height: 26, boxShadow: "0 2px 4px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {countryFlag(t.countryCode)}
                </span>
                <span style={{ color: "#8da5c4", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.5px" }}>
                  {t.sourceIp}
                </span>
                <span style={{ color: sevColor, fontSize: 12, opacity: 0.8, display: "flex", alignItems: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </span>
                <span style={{ color: "#e2effc", fontWeight: 700, fontSize: 11, letterSpacing: "0.5px", textShadow: "0 0 5px rgba(226,239,252,0.3)" }}>
                  {t.targetState.replace(" (Confirmed Target)", "").replace(" (Projected Feed)", "").replace(" (Projected Surface)", "")}
                </span>
                <span
                  style={{
                    color: sevColor,
                    background: `${sevColor}20`,
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    boxShadow: `0 0 8px ${sevColor}40`,
                    border: `1px solid ${sevColor}60`
                  }}
                >
                  {t.attackType}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        .ticker-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ticker-item:hover {
          transform: scale(1.03);
          background: rgba(16, 28, 48, 0.85) !important;
          z-index: 10;
          box-shadow: 0 4px 15px rgba(0,0,0,0.6) !important;
        }
      `}</style>
    </div>
  );
}
