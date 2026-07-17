import type { Threat } from "../../types/threat";

interface TopVectorsProps {
  threats: Threat[];
}

export default function TopVectors({ threats }: TopVectorsProps) {
  // Count attack types
  const typeMap: Record<string, number> = {};
  threats.forEach((t) => {
    const key = t.attackType;
    typeMap[key] = (typeMap[key] || 0) + 1;
  });

  const sorted = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

  const barColors = ["#ff6374", "#fb8b32", "#f5d35f", "#3b82f6", "#50d7a9", "#a78bfa"];

  return (
    <div>
      <h2 className="section-title">Top Attack Vectors</h2>
      <p className="section-subtitle" style={{ marginBottom: 18 }}>
        Most prevalent exploitation techniques
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sorted.map(([type, count], idx) => {
          const pct = Math.round((count / maxCount) * 100);
          const color = barColors[idx % barColors.length];
          return (
            <div key={type}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ color: "#c8d7e8", fontSize: 11, fontWeight: 600 }}>
                  {type}
                </span>
                <span style={{ color, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
                  {count}
                </span>
              </div>
              <div style={{ height: 5, background: "#1a2a3e", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    boxShadow: `0 0 8px ${color}44`,
                    transition: "width 0.6s ease-out"
                  }}
                />
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ color: "#6a7b95", fontSize: 11, padding: 12 }}>
            Collecting attack type telemetry…
          </div>
        )}
      </div>
    </div>
  );
}
