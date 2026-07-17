import { useState } from "react";
import { lookupIoc, type IocLookupResponse } from "../services/threatApi";
import { FaSearch, FaShieldAlt, FaInfoCircle, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function IocSearch() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<IocLookupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const ind = value.trim();
    if (!ind) return;

    setIsLoading(true);
    setSearched(true);
    setError(null);
    setResult(null);

    try {
      const data = await lookupIoc(ind);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch indicator reputation. Check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "#ff6374"; // Critical Red
    if (score >= 50) return "#fb8b32"; // High Orange
    return "#50d7a9";                  // Low Green
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "N/A (Reputation check)";
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="page page-enter" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <div className="eyebrow">SOC Investigation Workspace</div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, color: "#f8fafc" }}>
        IOC Investigation
      </h1>
      <p className="muted" style={{ fontSize: 12, color: "#6a7b95", marginBottom: 20 }}>
        Query IP addresses, host domains, malware hashes, CVEs, or active URLs against threat catalogs.
      </p>

      <div className="panel" style={{ padding: 24, maxWidth: 960 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              className="field"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter indicator (e.g. 185.220.101.45, cve-2026-1188, domain.com)..."
              disabled={isLoading}
              style={{
                background: "rgba(5, 9, 16, 0.6)",
                borderColor: "#192e47",
                padding: "16px 24px",
                fontSize: 15,
                borderRadius: 12,
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={isLoading}
            style={{
              padding: "16px 28px",
              background: "#167bb8",
              color: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              borderRadius: 12,
              fontWeight: 700,
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <FaSearch size={14} />
            {isLoading ? "Searching..." : "Investigate"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 18, color: "#ff6374", fontSize: 12 }}>
            • {error}
          </div>
        )}

        {isLoading && (
          <div style={{ marginTop: 24, color: "#6a7b95", fontSize: 12, textAlign: "center" }}>
            Enriching indicator details from global databases...
          </div>
        )}

        {!isLoading && searched && result && (
          <div style={{ marginTop: 24 }}>
            {/* Top Summary Banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(8, 14, 24, 0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(26, 42, 62, 0.5)",
                padding: "20px 24px",
                borderRadius: 12,
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
              }}
            >
              <div>
                <span
                  style={{
                    color: getRiskColor(result.risk_score),
                    background: `${getRiskColor(result.risk_score)}15`,
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 99,
                    fontWeight: 700,
                    textTransform: "uppercase"
                  }}
                >
                  {result.severity} Severity Alarms
                </span>
                <h2 style={{ fontSize: 18, margin: "8px 0 2px", color: "#f8fafc", fontFamily: "monospace" }}>
                  {result.indicator}
                </h2>
                <div style={{ fontSize: 10, color: "#6a7b95" }}>
                  Indicator Class: {result.type.toUpperCase()} · Feeds: {result.sources.join(", ")}
                </div>
              </div>
              
              {/* Risk Gauge */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#8190a6" }}>CALCULATED RISK SCORE</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: getRiskColor(result.risk_score), fontFamily: "monospace" }}>
                    {result.risk_score}/100
                  </div>
                </div>
                <div style={{ width: 8, height: 48, background: "#1a2a3e", borderRadius: 4, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${result.risk_score}%`,
                      background: getRiskColor(result.risk_score),
                      borderRadius: 4,
                      boxShadow: `0 0 12px ${getRiskColor(result.risk_score)}`,
                      animation: "slide-up 1s ease-out"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Metadata Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginTop: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Description */}
                <div>
                  <div style={{ fontSize: 10, color: "#8190a6", fontWeight: 700, letterSpacing: ".05em", marginBottom: 6 }}>
                    THREAT PROFILE DETAILS
                  </div>
                  <div
                    style={{
                      background: "#080e18",
                      border: "1px solid #142133",
                      borderRadius: 8,
                      padding: 14,
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "#cbd5e1"
                    }}
                  >
                    <div style={{ fontWeight: 650, color: "#fb8b32", marginBottom: 6 }}>
                      {result.attack_type}
                    </div>
                    {result.description}
                  </div>
                </div>

                {/* Playbook Action */}
                <div>
                  <div style={{ fontSize: 10, color: "#8190a6", fontWeight: 700, letterSpacing: ".05em", marginBottom: 6 }}>
                    SOC PLAYBOOK RECOMMENDATION
                  </div>
                  <div
                    style={{
                      background: "rgba(80, 215, 169, 0.04)",
                      border: "1px solid rgba(80, 215, 169, 0.2)",
                      borderRadius: 8,
                      padding: 16,
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: "#cbd5e1",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(80, 215, 169, 0.08)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(80, 215, 169, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(80, 215, 169, 0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#50d7a9", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                      <FaShieldAlt size={14} /> Defensive Actions
                    </div>
                    {result.recommendation}
                  </div>
                </div>
              </div>

              {/* Sidebar Metrics Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    background: "#080e18",
                    border: "1px solid #142133",
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 12
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid #1a2a3e" }}>
                    <span style={{ color: "#8190a6" }}>Verification State</span>
                    {result.found ? (
                      <span style={{ color: "#50d7a9", fontWeight: 650, display: "flex", alignItems: "center", gap: 4 }}>
                        <FaCheckCircle size={10} /> Active Alert
                      </span>
                    ) : (
                      <span style={{ color: "#fb8b32", fontWeight: 650, display: "flex", alignItems: "center", gap: 4 }}>
                        <FaExclamationTriangle size={10} /> Reputation Only
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a2a3e" }}>
                    <span style={{ color: "#8190a6" }}>Confidence Rating</span>
                    <span style={{ color: "#e2effc", fontWeight: 650, fontFamily: "monospace" }}>{result.confidence}%</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a2a3e" }}>
                    <span style={{ color: "#8190a6" }}>MITRE ATT&CK Mapping</span>
                    <span style={{ color: "#3ab7f5", fontWeight: 650, fontFamily: "monospace" }}>{result.mitre_tactic}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10 }}>
                    <span style={{ color: "#8190a6" }}>Last Correlated</span>
                    <span style={{ color: "#cbd5e1", textAlign: "right" }}>
                      <FaCalendarAlt size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      {formatDate(result.last_seen)}
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: "0 10px", fontSize: 10, color: "#6a7b95", lineHeight: 1.4 }}>
                  <FaInfoCircle size={10} style={{ marginRight: 6 }} />
                  Reputation data is updated dynamically from integrated threat intelligence servers.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}