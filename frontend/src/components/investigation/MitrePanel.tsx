
import type { Investigation } from "../../services/investigationService";
import { FaCrosshairs, FaBookOpen } from "react-icons/fa";

interface Props {
  investigation: Investigation;
}

export default function MitrePanel({ investigation }: Props) {
  const { attack } = investigation;
  const mitreCode = attack.mitre_tactic || "T0000";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h2 className="section-title" style={{ fontSize: 20, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
        <FaCrosshairs /> MITRE ATT&CK Mapping
      </h2>
      
      <div style={{ color: "#7889a3", fontSize: 14 }}>
        The observed activity was mapped to the following tactic in the MITRE ATT&CK Framework.
      </div>

      <div style={{ background: "#09121f", padding: 32, borderRadius: 12, border: "1px solid #1a2d45" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ background: "#5ac2f0", color: "#09121f", padding: "16px 24px", borderRadius: 8, fontWeight: 800, fontSize: 24 }}>
            {mitreCode}
          </div>
          <div>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 20, marginBottom: 8 }}>{attack.attack_type || "Unknown Activity"}</h3>
            <p style={{ margin: 0, color: "#7889a3", lineHeight: 1.6 }}>
              {attack.description || "The intelligence feed did not provide a detailed description for this indicator."}
            </p>
            <a 
              href={`https://attack.mitre.org/techniques/${mitreCode}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, color: "#5ac2f0", textDecoration: "none", fontWeight: 600 }}
            >
              <FaBookOpen /> View full documentation on MITRE
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
