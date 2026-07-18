import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt, FaInfoCircle, FaHistory, FaBrain, FaCrosshairs, FaExclamationTriangle, FaSearchPlus, FaNetworkWired } from "react-icons/fa";
import type { Investigation } from "../services/investigationService";

export default function InvestigationView() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, we'd fetch the attack by eventId, then get/create the investigation
    // For now, we simulate loading state
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API fetch delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data since we need the attack data which requires backend wiring
        setInvestigation({
          id: 1,
          attack_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "NEW",
          analyst_id: null,
          ai_analysis: null,
          notes: [],
          attack: {
            id: eventId,
            sourceIp: "103.45.22.11",
            sourceCountry: "China",
            targetState: "Delhi (Confirmed Target)",
            attackType: "SSH Brute Force",
            severity: "Critical",
            confidence: 94,
            mitre: "T1110",
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {
        setError("Failed to load investigation data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ color: "#6a7b95", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }}></div>
          Loading Investigation Evidence...
        </div>
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ background: "rgba(255, 99, 116, 0.1)", padding: 32, borderRadius: 12, border: "1px solid rgba(255, 99, 116, 0.3)", textAlign: "center", color: "#ff6374" }}>
          <FaExclamationTriangle size={32} style={{ marginBottom: 16 }} />
          <h3>Investigation Not Found</h3>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")} style={{ marginTop: 16 }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { attack } = investigation;
  const isConfirmed = attack.targetState.includes("Confirmed");

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Navigation */}
      <button 
        onClick={() => navigate("/dashboard")} 
        style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "#5ac2f0", cursor: "pointer", fontWeight: 600, width: "fit-content" }}
      >
        <FaArrowLeft /> Back to Dashboard
      </button>

      {/* Investigation Header */}
      <div className="panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 24, color: "#fff" }}>Investigation: {eventId}</h1>
              <span style={{ background: "#ff637415", color: "#ff6374", padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 800, border: "1px solid #ff637450" }}>
                CRITICAL
              </span>
              <span style={{ background: "#3be2a515", color: "#3be2a5", padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 800, border: "1px solid #3be2a550" }}>
                STATUS: {investigation.status}
              </span>
            </div>
            <div style={{ color: "#7889a3", fontSize: 13, display: "flex", gap: 16 }}>
              <span>Observed: {new Date(attack.timestamp).toLocaleString()}</span>
              <span>Confidence: {attack.confidence}%</span>
              <span>Classification: {isConfirmed ? "Confirmed India Target" : "Global Intelligence"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-secondary">Assign to Me</button>
            <button className="btn btn-primary">Export Report</button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 24, alignItems: "start" }}>
        
        {/* Tabs Sidebar */}
        <div className="panel" style={{ padding: "12px 0", display: "flex", flexDirection: "column" }}>
          {[
            { id: "overview", icon: <FaInfoCircle />, label: "Overview" },
            { id: "evidence", icon: <FaSearchPlus />, label: "Evidence" },
            { id: "iocs", icon: <FaNetworkWired />, label: "Related IOCs" },
            { id: "timeline", icon: <FaHistory />, label: "Timeline & Notes" },
            { id: "mitre", icon: <FaCrosshairs />, label: "MITRE ATT&CK" },
            { id: "ai", icon: <FaBrain />, label: "AI Analysis" },
            { id: "response", icon: <FaShieldAlt />, label: "Response" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "rgba(22, 123, 184, 0.15)" : "transparent",
                border: "none",
                borderRight: activeTab === tab.id ? "3px solid #5ac2f0" : "3px solid transparent",
                color: activeTab === tab.id ? "#5ac2f0" : "#7889a3",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? 700 : 500,
                textAlign: "left",
                transition: "all 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = activeTab === tab.id ? "rgba(22, 123, 184, 0.15)" : "rgba(26, 45, 69, 0.4)"}
              onMouseOut={e => e.currentTarget.style.background = activeTab === tab.id ? "rgba(22, 123, 184, 0.15)" : "transparent"}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="panel" style={{ padding: 32, minHeight: 600 }}>
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <h2 className="section-title" style={{ fontSize: 20 }}>Event Overview</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
                  <div className="eyebrow" style={{ marginBottom: 16 }}>Source Asset</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div className="muted" style={{ fontSize: 11 }}>IP Address</div>
                      <div style={{ color: "#fff", fontSize: 16, fontFamily: "monospace" }}>{attack.sourceIp}</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 11 }}>Country</div>
                      <div style={{ color: "#fff", fontSize: 14 }}>{attack.sourceCountry}</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
                  <div className="eyebrow" style={{ marginBottom: 16 }}>Target Asset</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div className="muted" style={{ fontSize: 11 }}>Country</div>
                      <div style={{ color: "#fff", fontSize: 16 }}>India</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 11 }}>State / Region</div>
                      <div style={{ color: "#fff", fontSize: 14 }}>{attack.targetState}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="eyebrow" style={{ marginBottom: 16 }}>Attack Parameters</div>
                <table className="table" style={{ background: "#09121f", borderRadius: 12, overflow: "hidden" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 200, color: "#7889a3" }}>Attack Type</td>
                      <td style={{ color: "#fff", fontWeight: 600 }}>{attack.attackType}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#7889a3" }}>MITRE ATT&CK</td>
                      <td style={{ color: "#fff", fontFamily: "monospace" }}>{attack.mitre}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#7889a3" }}>Detection Source</td>
                      <td style={{ color: "#5ac2f0", fontWeight: 600 }}>ICTIP Live Telemetry</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <h2 className="section-title" style={{ fontSize: 20 }}>Investigation Timeline</h2>
              
              <div style={{ borderLeft: "2px solid #1a2d45", paddingLeft: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Timeline Items */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -31, top: 4, width: 12, height: 12, borderRadius: "50%", background: "#ff6374", border: "2px solid #0b121e" }} />
                  <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{new Date(attack.timestamp).toLocaleString()}</div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Critical Threat Detected</div>
                  <div style={{ color: "#7889a3", fontSize: 13, marginTop: 4 }}>Initial event ingested from AbuseIPDB indicating {attack.attackType}.</div>
                </div>
                
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -31, top: 4, width: 12, height: 12, borderRadius: "50%", background: "#5ac2f0", border: "2px solid #0b121e" }} />
                  <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{new Date(new Date(attack.timestamp).getTime() + 120000).toLocaleString()}</div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>AI Analysis Completed</div>
                  <div style={{ color: "#7889a3", fontSize: 13, marginTop: 4 }}>Risk score calculated as 94/100.</div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 12 }}>Add Analyst Note</div>
                <textarea 
                  className="field" 
                  rows={4} 
                  placeholder="Type investigation findings here..."
                  style={{ background: "#09121f", marginBottom: 12, resize: "vertical" }}
                />
                <button className="btn btn-primary">Save Note</button>
              </div>
            </div>
          )}

          {activeTab !== "overview" && activeTab !== "timeline" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400, color: "#7889a3", flexDirection: "column", gap: 16 }}>
              <FaInfoCircle size={32} opacity={0.5} />
              <p>This module is currently being populated with live telemetry data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
