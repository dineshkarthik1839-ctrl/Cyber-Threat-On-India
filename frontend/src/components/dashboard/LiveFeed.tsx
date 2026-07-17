import { motion, AnimatePresence } from "framer-motion";
import type { Threat } from "../../types/threat";
import { FaShieldAlt, FaMapMarkerAlt, FaCrosshairs } from "react-icons/fa";

interface LiveFeedProps {
  threats: Threat[];
}

// Convert 2-letter country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code === "--" || code.length !== 2) return "🌐";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export default function LiveFeed({ threats }: LiveFeedProps) {
  const getSeverityStyle = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === "critical") return { color: "#ff6374", bg: "rgba(255, 99, 116, 0.08)" };
    if (sev === "high") return { color: "#fb8b32", bg: "rgba(251, 139, 50, 0.08)" };
    if (sev === "medium") return { color: "#f5d35f", bg: "rgba(245, 211, 95, 0.08)" };
    return { color: "#50d7a9", bg: "rgba(80, 215, 169, 0.08)" };
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString();
    } catch {
      return "00:00:00";
    }
  };

  return (
    <div style={{ overflow: "hidden", height: "100%", paddingRight: 8 }}>
      <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
        <AnimatePresence initial={false}>
          {threats.slice(0, 15).map((threat, idx) => {
            const styles = getSeverityStyle(threat.severity);
            const isConfirmed = threat.targetState.includes("Confirmed") || threat.id.includes("sim") || threat.id.includes("demo");

            return (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: idx * 0.02 }}
                style={{
                  background: "linear-gradient(135deg, rgba(16, 32, 54, 0.7) 0%, rgba(10, 18, 30, 0.9) 100%)",
                  border: `1px solid ${styles.color}25`,
                  borderLeft: `4px solid ${styles.color}`,
                  borderRadius: 12,
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  boxShadow: `0 8px 20px rgba(0,0,0,0.4), inset 0 0 30px ${styles.color}05`,
                  position: "relative",
                  overflow: "hidden",
                  backdropFilter: "blur(8px)"
                }}
              >
                {/* Background Glow */}
                <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 150, background: `radial-gradient(circle at right, ${styles.color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

                {/* Left Section: Time & Source */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 220 }}>
                  <div style={{ fontSize: 11, color: "#6a7b95", fontFamily: "monospace", fontWeight: 600, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ color: styles.color }}>{formatTime(threat.timestamp)}</span>
                    <span style={{ fontSize: 9, opacity: 0.6 }}>ID: {threat.id.split("-")[0]}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                      {countryFlag(threat.countryCode)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#e2effc", fontWeight: 700, fontSize: 13, letterSpacing: "0.5px" }}>
                        {threat.sourceIp}
                      </span>
                      <span style={{ fontSize: 10, color: "#8da5c4", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {threat.sourceCountry}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Section: Target & Vector */}
                <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 24 }}>
                  {/* Arrow separator */}
                  <div style={{ color: "#3b5570", display: "flex", alignItems: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </div>

                  {/* Target State */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 150 }}>
                    <div style={{ padding: 6, background: "rgba(90, 194, 240, 0.1)", borderRadius: 8, color: "#5ac2f0" }}>
                      <FaMapMarkerAlt size={14} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#5ac2f0", fontWeight: 800, fontSize: 13, textShadow: "0 0 10px rgba(90,194,240,0.4)" }}>
                        {threat.targetState.replace(" (Confirmed Target)", "").replace(" (Projected Feed)", "").replace(" (Projected Surface)", "")}
                      </span>
                      <span style={{ fontSize: 9, color: "#6a7b95", textTransform: "uppercase", letterSpacing: "0.5px" }}>Target Node</span>
                    </div>
                  </div>

                  {/* Attack Type */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ padding: 6, background: `${styles.bg}`, borderRadius: 8, color: styles.color }}>
                      <FaCrosshairs size={14} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#e2effc", fontWeight: 700, fontSize: 13 }}>
                        {threat.attackType}
                      </span>
                      <span style={{ fontSize: 10, color: "#8190a6", fontFamily: "monospace" }}>
                        {threat.mitre}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {isConfirmed ? (
                    <span style={{ color: "#50d7a9", border: "1px solid rgba(80, 215, 169, 0.3)", background: "rgba(80, 215, 169, 0.1)", fontSize: 9, padding: "4px 10px", borderRadius: 6, fontWeight: 800, letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6 }}>
                      <FaShieldAlt size={10} /> CONFIRMED
                    </span>
                  ) : (
                    <span style={{ color: "#8190a6", border: "1px solid rgba(129, 144, 166, 0.3)", background: "rgba(129, 144, 166, 0.1)", fontSize: 9, padding: "4px 10px", borderRadius: 6, fontWeight: 700, letterSpacing: "0.5px" }}>
                      UNVERIFIED
                    </span>
                  )}
                  <span
                    style={{
                      color: styles.color,
                      backgroundColor: styles.bg,
                      border: `1px solid ${styles.color}50`,
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      boxShadow: `0 0 15px ${styles.color}30`
                    }}
                  >
                    {threat.severity}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {threats.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#6a7b95", background: "rgba(10, 18, 30, 0.4)", borderRadius: 12, border: "1px dashed #1e2c40" }}>
            <FaShieldAlt size={32} style={{ opacity: 0.2, marginBottom: 16 }} />
            <br />
            Waiting for active threat stream indicators...
          </div>
        )}
      </div>
    </div>
  );
}
