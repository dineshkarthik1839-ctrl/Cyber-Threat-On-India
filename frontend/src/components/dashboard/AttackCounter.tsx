interface AttackCounterProps {
  total: number;
  critical: number;
  campaigns: number;
  regions: number;
  isOffline?: boolean;
  isDemo?: boolean;
}

export default function AttackCounter({ total, critical, campaigns, regions, isOffline, isDemo }: AttackCounterProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 20
      }}
    >
      {[
        {
          label: "TOTAL INVESTIGATED INDICATORS",
          value: total.toLocaleString(),
          color: "#0ea5e9",
          desc: "Accumulated intelligence"
        },
        {
          label: "CRITICAL SEVERITY ALERTS",
          value: critical.toLocaleString(),
          color: "#ff6374",
          desc: "Prioritized defense tickets"
        },
        {
          label: "ACTIVE THREAT CAMPAIGNS",
          value: campaigns.toLocaleString(),
          color: "#fb8b32",
          desc: "Distinct malware/exploit families"
        },
        {
          label: "TARGETED INDIAN REGIONS",
          value: `${regions} States`,
          color: "#50d7a9",
          desc: "State-level telemetry mappings"
        }
      ].map((item, idx) => (
        <div
          key={idx}
          className="panel"
          style={{
            padding: "20px 24px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(16, 28, 48, 0.6) 0%, rgba(8, 14, 24, 0.8) 100%)",
            border: "1px solid #1f3047",
            borderRadius: 12
          }}
        >
          {/* Subtle colored glow bubble in the corner */}
          <div
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: item.color,
              filter: "blur(35px)",
              right: -30,
              top: -30,
              opacity: 0.15,
              pointerEvents: "none"
            }}
          />
          
          <div>
            <div className="eyebrow" style={{ fontSize: 9, color: "#8190a6", letterSpacing: ".1em", margin: 0 }}>
              {item.label}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                marginTop: 10,
                color: item.color,
                fontFamily: "monospace",
                letterSpacing: "-0.04em"
              }}
            >
              {item.value}
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <div style={{ fontSize: 10, color: "#6a7b95" }}>
              • {item.desc}
            </div>
            {(isOffline || isDemo) && (
              <div style={{ fontSize: 9, color: isOffline ? "#8190a6" : "#b684ff", border: `1px solid ${isOffline ? "#36516d" : "#5a3d8a"}`, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.2)" }}>
                {isOffline ? "Historical" : "Simulated"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
