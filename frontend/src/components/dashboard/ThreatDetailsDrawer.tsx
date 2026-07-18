import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaShieldAlt, FaMapMarkerAlt, FaCrosshairs, FaNetworkWired, FaUserSecret, FaSearchPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { Threat } from "../../types/threat";

interface ThreatDetailsDrawerProps {
  threat: Threat | null;
  onClose: () => void;
}

// Map attack types to AI-like defensive recommendations
const getRecommendations = (attackType: string): string[] => {
  const type = attackType.toLowerCase();
  if (type.includes("ddos")) {
    return [
      "Rate-limit incoming traffic from the source subnet.",
      "Engage upstream ISP or DDoS mitigation provider (e.g., Cloudflare, Akamai).",
      "Monitor internal bandwidth and load balancer metrics."
    ];
  } else if (type.includes("ransomware") || type.includes("malware")) {
    return [
      "Isolate the targeted endpoint from the corporate network immediately.",
      "Initiate memory dump and collect forensic artifacts.",
      "Block the source IP and associated IoCs at the perimeter firewall.",
      "Force password resets for compromised accounts."
    ];
  } else if (type.includes("phishing") || type.includes("credential")) {
    return [
      "Reset user credentials and revoke active session tokens.",
      "Enable hardware-backed MFA (FIDO2) for the affected user.",
      "Analyze email gateway logs for identical payloads sent to other users."
    ];
  } else if (type.includes("sql") || type.includes("exploit")) {
    return [
      "Deploy WAF rules to block identified payload signatures.",
      "Verify that the targeted application is fully patched.",
      "Review application database logs for successful exfiltration."
    ];
  } else {
    return [
      "Add source IP to the temporary blocklist (24 hours).",
      "Increase monitoring severity for the targeted internal asset.",
      "Cross-reference the source IP with historical internal logs."
    ];
  }
};

const getRiskScore = (severity: string, confidence: number): number => {
  let base = 50;
  if (severity === "Critical") base = 90;
  if (severity === "High") base = 75;
  if (severity === "Medium") base = 60;
  
  // Adjust based on confidence
  return Math.min(99, Math.round(base * (confidence / 100) + 5));
};

export default function ThreatDetailsDrawer({ threat, onClose }: ThreatDetailsDrawerProps) {
  const navigate = useNavigate();
  if (!threat) return null;

  const isConfirmed = threat.targetState.includes("Confirmed") || threat.id.includes("sim") || threat.id.includes("demo");
  const recommendations = getRecommendations(threat.attackType);
  const riskScore = getRiskScore(threat.severity, threat.confidence);

  return (
    <AnimatePresence>
      <div 
        style={{ 
          position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
          display: "flex", justifyContent: "flex-end" 
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", pointerEvents: "auto"
          }}
          onClick={onClose}
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{
            width: "100%",
            maxWidth: 500,
            background: "#0b121e",
            borderLeft: "1px solid #1a2d45",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
            height: "100%",
            position: "relative",
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a2d45", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(26, 45, 69, 0.4)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: "#f0f6fc" }}>Threat Details</h2>
              <div style={{ fontSize: 12, color: "#6a7b95", fontFamily: "monospace", marginTop: 4 }}>ID: {threat.id}</div>
            </div>
            <button 
              onClick={onClose}
              style={{ background: "transparent", border: "none", color: "#6a7b95", cursor: "pointer", padding: 8, borderRadius: 4 }}
              onMouseOver={e => e.currentTarget.style.background = "#1a2d45"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Status Badges */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ 
                padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700, 
                background: threat.severity === "Critical" ? "#ff637415" : threat.severity === "High" ? "#ffad4d15" : "#f5d35f15",
                color: threat.severity === "Critical" ? "#ff6374" : threat.severity === "High" ? "#ffad4d" : "#f5d35f",
                border: "1px solid currentColor"
              }}>
                {threat.severity.toUpperCase()} SEVERITY
              </span>
              <span style={{ 
                padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700, 
                background: isConfirmed ? "#3be2a515" : "#7889a315",
                color: isConfirmed ? "#3be2a5" : "#7889a3",
                border: "1px solid currentColor"
              }}>
                {isConfirmed ? "CONFIRMED INDIA TARGET" : "THREAT INTELLIGENCE"}
              </span>
            </div>

            {/* Core Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#111c2e", padding: 16, borderRadius: 8, border: "1px solid #1a2d45" }}>
                <div style={{ fontSize: 10, color: "#6a7b95", textTransform: "uppercase", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <FaNetworkWired /> Source Asset
                </div>
                <div style={{ fontSize: 15, color: "#f0f6fc", fontWeight: 600 }}>{threat.sourceIp}</div>
                <div style={{ fontSize: 12, color: "#7889a3", marginTop: 4 }}>{threat.sourceCountry}</div>
              </div>

              <div style={{ background: "#111c2e", padding: 16, borderRadius: 8, border: "1px solid #1a2d45" }}>
                <div style={{ fontSize: 10, color: "#6a7b95", textTransform: "uppercase", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <FaMapMarkerAlt /> Target Asset
                </div>
                <div style={{ fontSize: 15, color: "#5ac2f0", fontWeight: 600 }}>
                  {threat.targetState.replace(" (Confirmed Target)", "").replace(" (Projected Feed)", "").replace(" (Projected Surface)", "")}
                </div>
                <div style={{ fontSize: 12, color: "#7889a3", marginTop: 4 }}>India</div>
              </div>
            </div>

            {/* Attack Details */}
            <div>
              <h3 style={{ fontSize: 14, color: "#f0f6fc", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <FaCrosshairs color="#ff6374" /> Attack Vector
              </h3>
              <div style={{ background: "#111c2e", padding: "16px", borderRadius: 8, border: "1px solid #1a2d45" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#7889a3", fontSize: 12 }}>Type</span>
                  <span style={{ color: "#f0f6fc", fontSize: 13, fontWeight: 600 }}>{threat.attackType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#7889a3", fontSize: 12 }}>MITRE ATT&CK</span>
                  <span style={{ color: "#f0f6fc", fontSize: 13, fontFamily: "monospace" }}>{threat.mitre}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#7889a3", fontSize: 12 }}>Timestamp</span>
                  <span style={{ color: "#f0f6fc", fontSize: 13 }}>{new Date(threat.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7889a3", fontSize: 12 }}>Intelligence Source</span>
                  <span style={{ color: "#5ac2f0", fontSize: 13, fontWeight: 600 }}>{threat.source || "Network Sensor"}</span>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div>
              <h3 style={{ fontSize: 14, color: "#f0f6fc", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <FaUserSecret color="#2e8bc0" /> AI Threat Analysis
              </h3>
              <div style={{ background: "linear-gradient(135deg, rgba(16, 32, 54, 0.7) 0%, rgba(10, 18, 30, 0.9) 100%)", padding: "16px", borderRadius: 8, border: "1px solid #2e8bc040" }}>
                <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#7889a3", textTransform: "uppercase" }}>Risk Score</div>
                    <div style={{ fontSize: 24, color: riskScore > 75 ? "#ff6374" : "#ffad4d", fontWeight: 800 }}>{riskScore}/100</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#7889a3", textTransform: "uppercase" }}>Confidence</div>
                    <div style={{ fontSize: 24, color: "#3be2a5", fontWeight: 800 }}>{threat.confidence}%</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#b3c2d6", lineHeight: 1.5 }}>
                  AI analysis indicates a high probability that this is an automated {threat.attackType.toLowerCase()} attempt mapped to MITRE {threat.mitre}. The source IP has been observed engaging in similar activity across multiple intelligence feeds.
                </p>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h3 style={{ fontSize: 14, color: "#f0f6fc", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <FaShieldAlt color="#3be2a5" /> Recommended Defensive Actions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{ background: "#111c2e", padding: "12px 16px", borderRadius: 8, borderLeft: "3px solid #3be2a5", fontSize: 13, color: "#d9e5f3", lineHeight: 1.4 }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>

          </div>
          
          {/* Footer Action */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #1a2d45", background: "rgba(26, 45, 69, 0.4)", display: "flex", gap: 12 }}>
            <button 
              onClick={() => {
                onClose();
                navigate(`/investigation/${threat.id}`);
              }}
              style={{ flex: 1, background: "#5ac2f0", color: "#09121f", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} 
              onMouseOver={e => e.currentTarget.style.background = "#3ab7f5"} 
              onMouseOut={e => e.currentTarget.style.background = "#5ac2f0"}
            >
              <FaSearchPlus /> Investigate
            </button>
            <button style={{ flex: 1, background: "#167bb8", color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#1a8dd0"} onMouseOut={e => e.currentTarget.style.background = "#167bb8"}>
              Export Report
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
