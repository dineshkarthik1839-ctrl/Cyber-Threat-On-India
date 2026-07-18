import type { Investigation } from "../../services/investigationService";
import { FaServer, FaCodeBranch } from "react-icons/fa";

interface Props {
  investigation: Investigation;
}

export default function EvidencePanel({ investigation }: Props) {
  const { attack } = investigation;
  const isConfirmed = attack.targetState && attack.targetState.includes("Confirmed");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h2 className="section-title" style={{ fontSize: 20, margin: 0, color: "#fff" }}>Investigation Evidence</h2>
      
      <div style={{ color: "#7889a3", fontSize: 14 }}>
        The following facts were derived deterministically from our intelligence collectors at the time of ingestion.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <FaServer /> Raw Telemetry
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, fontSize: 14 }}>
            <div style={{ color: "#7889a3" }}>Indicator:</div>
            <div style={{ color: "#5ac2f0", fontFamily: "monospace" }}>{attack.indicator} ({attack.indicator_type})</div>
            
            <div style={{ color: "#7889a3" }}>Collector:</div>
            <div style={{ color: "#fff" }}>{attack.source}</div>
            
            <div style={{ color: "#7889a3" }}>Event Timestamp:</div>
            <div style={{ color: "#fff" }}>{new Date(attack.timestamp).toLocaleString()}</div>
            
            <div style={{ color: "#7889a3" }}>Original Classification:</div>
            <div style={{ color: "#fff" }}>{attack.attack_type || "Unknown Threat"}</div>
          </div>
        </div>

        <div style={{ background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <FaCodeBranch /> Target Verification
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, fontSize: 14 }}>
            <div style={{ color: "#7889a3" }}>Target Region:</div>
            <div style={{ color: "#fff" }}>{attack.target_state}</div>
            
            <div style={{ color: "#7889a3" }}>Status:</div>
            <div style={{ color: isConfirmed ? "#ff6374" : "#3be2a5", fontWeight: 600 }}>
              {isConfirmed ? "Confirmed attack on Indian infrastructure" : "Intelligence monitoring - No direct attack detected on India"}
            </div>
            
            <div style={{ color: "#7889a3" }}>Confidence Score:</div>
            <div style={{ color: "#fff" }}>{attack.confidence} / 100</div>
          </div>
        </div>
      </div>
    </div>
  );
}
