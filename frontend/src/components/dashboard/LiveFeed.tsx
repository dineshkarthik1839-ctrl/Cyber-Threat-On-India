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
    <div style={{ overflow: "hidden", height: "100%", paddingRight: 4 }}>
      <div style={{ maxHeight: 460, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
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
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  boxShadow: `0 4px 15px rgba(0,0,0,0.3), inset 0 0 20px ${styles.color}05`,
                  position: "relative",
                  overflow: "hidden",
                  backdropFilter: "blur(8px)"
                }}
              >
                {/* Background Glow */}
                <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 100, background: `radial-gradient(circle at right, ${styles.color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

                {/* Left Section: Time & Source */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 10, color: "#6a7b95", fontFamily: "monospace", fontWeight: 600, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: styles.color }}>{formatTime(threat.timestamp)}</span>
                    <span style={{ fontSize: 9, opacity: 0.6 }}>{threat.id.split("-")[0]}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 18, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                      {countryFlag(threat.countryCode)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#e2effc", fontWeight: 700, fontSize: 11, letterSpacing: "0.5px" }}>
                        {threat.sourceIp}
                      </span>
                      <span style={{ fontSize: 9, color: "#8da5c4", textTransform: "uppercase" }}>
                        {threat.sourceCountry.length > 12 ? threat.sourceCountry.substring(0, 10) + '..' : threat.sourceCountry}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Section: Target & Vector */}
                <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 12, overflow: "hidden" }}>
                  {/* Arrow separator */}
                  <div style={{ color: "#3b5570", display: "flex", alignItems: "center", opacity: 0.5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </div>

                  {/* Target State */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ padding: 4, background: "rgba(90, 194, 240, 0.1)", borderRadius: 6, color: "#5ac2f0" }}>
                      <FaMapMarkerAlt size={11} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#5ac2f0", fontWeight: 800, fontSize: 11, whiteSpace: "nowrap" }}>
                        {threat.targetState.replace(" (Confirmed Target)", "").replace(" (Projected Feed)", "").replace(" (Projected Surface)", "").substring(0, 10)}
                      </span>
                      <span style={{ fontSize: 8, color: "#6a7b95", textTransform: "uppercase" }}>Target Node</span>
                    </div>
                  </div>

                  {/* Attack Type */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ padding: 4, background: `${styles.bg}`, borderRadius: 6, color: styles.color }}>
                      <FaCrosshairs size={11} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#e2effc", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>
                        {threat.attackType.length > 15 ? threat.attackType.substring(0, 12) + '..' : threat.attackType}
                      </span>
                      <span style={{ fontSize: 8, color: "#8190a6", fontFamily: "monospace" }}>
                        {threat.mitre}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Badges */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {isConfirmed ? (
                    <span style={{ color: "#50d7a9", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                      <FaShieldAlt size={8} /> CONFIRMED
                    </span>
                  ) : (
                    <span style={{ color: "#8190a6", fontSize: 8, fontWeight: 700 }}>
                      UNVERIFIED
                    </span>
                  )}
                  <span
                    style={{
                      color: styles.color,
                      backgroundColor: styles.bg,
                      border: `1px solid ${styles.color}50`,
                      padding: "2px 6px",
                      borderRadius: 10,
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: "uppercase"
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
