
import type { Investigation } from "../../services/investigationService";
import { FaShieldAlt, FaTerminal, FaBan } from "react-icons/fa";

interface Props {
  investigation: Investigation;
}

export default function ResponsePanel({ investigation }: Props) {
  const { attack } = investigation;
  const attackType = (attack.attack_type || "").toLowerCase();
  
  // Recommend actions based strictly on the factual attack type
  let recommendations = [];
  
  if (attackType.includes("brute force") || attackType.includes("ssh") || attackType.includes("rdp")) {
    recommendations = [
      { action: "Block IP at Edge Firewall", type: "blocking", command: `iptables -A INPUT -s ${attack.indicator} -j DROP` },
      { action: "Force Password Resets", type: "policy", desc: "Audit and enforce MFA for all externally facing remote access portals." }
    ];
  } else if (attackType.includes("ddos") || attackType.includes("flood")) {
    recommendations = [
      { action: "Enable Rate Limiting", type: "blocking", desc: "Activate rate limiting on WAF for traffic originating from associated ASNs." },
      { action: "Engage Anti-DDoS Provider", type: "policy", desc: "Route traffic through scrubbing center if volumetric thresholds are exceeded." }
    ];
  } else if (attackType.includes("malware") || attackType.includes("ransomware") || attackType.includes("c2")) {
    recommendations = [
      { action: "Isolate Affected Endpoints", type: "blocking", desc: "Immediately isolate hosts communicating with this C2 indicator." },
      { action: "Add IOC to EDR", type: "policy", command: `Set-MpPreference -DisableRealtimeMonitoring $false; Add-MpPreference -ThreatIDDefaultAction_Ids ${attack.indicator} -ThreatIDDefaultAction_Actions 2` }
    ];
  } else {
    recommendations = [
      { action: "Monitor IP Traffic", type: "policy", desc: "Add to watchlists and monitor for anomalous lateral movement." },
      { action: "Block IP", type: "blocking", command: `iptables -A INPUT -s ${attack.indicator} -j DROP` }
    ];
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h2 className="section-title" style={{ fontSize: 20, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
        <FaShieldAlt /> Recommended Response
      </h2>
      
      <div style={{ color: "#7889a3", fontSize: 14 }}>
        The following remediation steps are recommended based on the classified attack type: <strong style={{color:"#fff"}}>{attack.attack_type || "Suspicious Activity"}</strong>.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {recommendations.map((rec, idx) => (
          <div key={idx} style={{ background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {rec.type === "blocking" ? <FaBan color="#ff6374" size={20} /> : <FaShieldAlt color="#5ac2f0" size={20} />}
              <h3 style={{ margin: 0, color: "#fff", fontSize: 16 }}>{rec.action}</h3>
            </div>
            
            {rec.desc && (
              <p style={{ margin: 0, color: "#7889a3", fontSize: 14 }}>{rec.desc}</p>
            )}
            
            {rec.command && (
              <div style={{ marginTop: 16, background: "#0b121e", padding: 16, borderRadius: 8, border: "1px solid #1a2d45", display: "flex", alignItems: "center", gap: 12 }}>
                <FaTerminal color="#7889a3" />
                <code style={{ color: "#3be2a5", fontFamily: "monospace", fontSize: 14 }}>
                  {rec.command}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
