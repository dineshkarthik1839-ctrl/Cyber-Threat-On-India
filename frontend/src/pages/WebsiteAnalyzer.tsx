import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaShieldAlt, FaServer, 
  FaLock, FaGlobe, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaCrosshairs
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { analyzeDomain } from "../services/scannerService";
import type { DomainScanResult } from "../types/scanner";

export default function WebsiteAnalyzer() {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DomainScanResult | null>(null);
  
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeDomain(domain);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "Analysis failed. Please try again later.";
      
      if (!err.response) {
        errorMessage = "Backend unavailable. The server is offline or unreachable.";
      } else if (err.response.status === 404) {
        errorMessage = "Analysis endpoint not found. The backend API is not responding at the expected route.";
      } else if (err.response.status === 400) {
        errorMessage = err.response.data?.detail || "Invalid domain provided.";
      } else if (err.response.status === 401) {
        errorMessage = "Unauthorized. Please log in again.";
      } else if (err.response.data && typeof err.response.data === 'string' && err.response.data.includes("Not Found")) {
        errorMessage = "Analysis endpoint not found (Server returned 404 text).";
      } else if (err.response.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical": return "#ff4444";
      case "High": return "#ff8800";
      case "Medium": return "#ffcc00";
      case "Low": return "#00cc66";
      default: return "#888";
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px 0", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
          <FaSearch color="#0ea5e9" />
          Website Security Risk Analyzer
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: 600 }}>
          Enter a public domain or URL to perform a non-intrusive threat intelligence audit, checking DNS, SSL, security headers, and known IOC reputation.
        </p>
      </div>

      <div className="panel" style={{ padding: 24, marginBottom: 30 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            className="field"
            placeholder="e.g., example.com or https://malicious-site.net"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, fontSize: 16, padding: "12px 16px" }}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading || !domain.trim()}
            style={{ padding: "0 32px", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
          >
            {isLoading ? (
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
            ) : <FaSearch />}
            {isLoading ? "SCANNING..." : "ANALYZE"}
          </button>
        </form>
        {error && (
          <div style={{ marginTop: 16, padding: 12, background: "rgba(255, 68, 68, 0.1)", border: "1px solid rgba(255, 68, 68, 0.3)", borderRadius: 6, color: "#ff4444" }}>
            {error}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.scan_uuid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 24 }}>
              
              {/* Scorecard */}
              <div className="panel" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderTop: `4px solid ${getRiskColor(result.risk_level)}` }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#8a9bb3", fontSize: 14, letterSpacing: 1 }}>OVERALL RISK SCORE</h3>
                <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, color: getRiskColor(result.risk_level), textShadow: `0 0 20px ${getRiskColor(result.risk_level)}44` }}>
                  {result.risk_score}
                </div>
                <div style={{ marginTop: 12, fontSize: 20, fontWeight: 700, color: getRiskColor(result.risk_level) }}>
                  {result.risk_level.toUpperCase()} RISK
                </div>
                
                <div style={{ marginTop: 32, width: "100%" }}>
                  <button 
                    className="btn btn-danger" 
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    onClick={() => navigate(`/investigation?ioc=${result.domain}`)}
                  >
                    <FaCrosshairs /> Escalate to Investigation
                  </button>
                </div>
              </div>

              {/* Top Level Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="panel" style={{ padding: 20, flex: 1 }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <FaGlobe color="#0ea5e9" /> Network Information
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>TARGET DOMAIN</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{result.domain}</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>RESOLVED IPs</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {result.ip_addresses.length > 0 ? result.ip_addresses.map((ip: string) => (
                          <span key={ip} style={{ padding: "2px 8px", background: "rgba(14, 165, 233, 0.1)", borderRadius: 4, fontSize: 13 }}>{ip}</span>
                        )) : <span className="muted">No public IPs</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel" style={{ padding: 20, flex: 1 }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <FaShieldAlt color={result.has_malicious_reputation ? "#ff4444" : "#0ea5e9"} /> Threat Intelligence (OTX)
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>KNOWN MALICIOUS PULSES</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: result.has_malicious_reputation ? "#ff4444" : "#0ea5e9" }}>
                        {result.otx_pulses}
                      </div>
                    </div>
                    {result.has_malicious_reputation && (
                      <div style={{ padding: "8px 16px", background: "rgba(255, 68, 68, 0.1)", color: "#ff4444", borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                        <FaExclamationTriangle /> Warning: This domain is associated with known threat actor activity.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* SSL Info */}
              <div className="panel" style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <FaLock color="#0ea5e9" /> SSL / TLS Configuration
                </h3>
                {result.ssl_info.error ? (
                  <div style={{ color: "#ff4444", fontSize: 14 }}>
                    <FaTimesCircle style={{ marginRight: 6 }}/> SSL Check Failed: {result.ssl_info.error}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {result.ssl_info.valid ? <FaCheckCircle color="#00cc66" /> : <FaTimesCircle color="#ff4444" />}
                      <span style={{ fontWeight: 600 }}>Certificate is {result.ssl_info.valid ? "Valid" : "Invalid"}</span>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 2 }}>ISSUER</div>
                      <div>{result.ssl_info.issuer || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 2 }}>EXPIRES</div>
                      <div>{result.ssl_info.expires || "Unknown"}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Headers */}
              <div className="panel" style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <FaServer color="#0ea5e9" /> Security Headers
                </h3>
                {result.security_headers.error ? (
                  <div style={{ color: "#ff4444", fontSize: 14 }}>
                    <FaTimesCircle style={{ marginRight: 6 }}/> HTTP Check Failed: {result.security_headers.error}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(result.security_headers).slice(0, 8).map(([key, value]) => (
                      <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
                        <div style={{ fontSize: 12, color: "#8a9bb3", fontWeight: 600, wordBreak: "break-word" }}>{key}</div>
                        <div style={{ fontSize: 12, wordBreak: "break-all" }}>{value as string}</div>
                      </div>
                    ))}
                    {Object.keys(result.security_headers).length > 8 && (
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>+ {Object.keys(result.security_headers).length - 8} more headers</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <p className="muted" style={{ fontSize: 13 }}>
                <strong>Note:</strong> Live attack telemetry unavailable. Connect an authorized security data source (WAF/CDN) in Settings to view observed live attacks for domains you control.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
