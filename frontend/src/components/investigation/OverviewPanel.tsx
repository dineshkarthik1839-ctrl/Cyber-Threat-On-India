
import type { Investigation } from "../../services/investigationService";

interface Props {
  investigation: Investigation;
}

export default function OverviewPanel({ investigation }: Props) {
  const { attack } = investigation;
  const isConfirmed = attack.targetState && attack.targetState.includes("Confirmed");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h2 className="section-title" style={{ fontSize: 20, margin: 0, color: "#fff" }}>Event Overview</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Source Asset</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>IP Address / Indicator</div>
              <div style={{ color: "#fff", fontSize: 16, fontFamily: "monospace" }}>{attack.indicator}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Country</div>
              <div style={{ color: "#fff", fontSize: 14 }}>{attack.source_country || "Unknown"}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Source Intelligence</div>
              <div style={{ color: "#fff", fontSize: 14 }}>{attack.source}</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Target Asset</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Country</div>
              <div style={{ color: "#fff", fontSize: 16 }}>{attack.target_country || "India"}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>State / Region</div>
              <div style={{ color: "#fff", fontSize: 14 }}>{attack.target_state}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Status</div>
              <div style={{ color: isConfirmed ? "#ff6374" : "#5ac2f0", fontSize: 14, fontWeight: 600 }}>
                {isConfirmed ? "Confirmed Target" : "Intelligence Feed"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Attack Parameters</div>
        <table className="table" style={{ background: "#09121f", borderRadius: 12, overflow: "hidden", width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: 200, color: "#7889a3", padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>Attack Type</td>
              <td style={{ color: "#fff", fontWeight: 600, padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>{attack.attack_type || "Unknown"}</td>
            </tr>
            <tr>
              <td style={{ color: "#7889a3", padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>Severity</td>
              <td style={{ color: attack.severity === "Critical" ? "#ff6374" : "#5ac2f0", fontWeight: 600, padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>{attack.severity}</td>
            </tr>
            <tr>
              <td style={{ color: "#7889a3", padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>Confidence</td>
              <td style={{ color: "#fff", padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>{attack.confidence}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
