import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt, FaInfoCircle, FaHistory, FaBrain, FaCrosshairs, FaExclamationTriangle, FaSearchPlus, FaNetworkWired, FaCircleNotch } from "react-icons/fa";
import { investigationService } from "../services/investigationService";
import type { Investigation } from "../services/investigationService";

import OverviewPanel from "../components/investigation/OverviewPanel";
import TimelinePanel from "../components/investigation/TimelinePanel";
import IocsPanel from "../components/investigation/IocsPanel";
import EvidencePanel from "../components/investigation/EvidencePanel";
import MitrePanel from "../components/investigation/MitrePanel";
import AiAnalysisPanel from "../components/investigation/AiAnalysisPanel";
import ResponsePanel from "../components/investigation/ResponsePanel";

export default function InvestigationView() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      // Determine if eventId is simulation or integer
      let attackId;
      if (eventId.startsWith("sim-")) {
        setError("Simulation events cannot be investigated in the DB.");
        setLoading(false);
        return;
      } else {
        attackId = parseInt(eventId, 10);
      }
      
      if (isNaN(attackId)) {
        throw new Error("Invalid attack ID");
      }
      
      // Try to create/fetch investigation
      const data = await investigationService.createInvestigation(attackId, null);
      // Wait, we need to get the full investigation with attack
      const fullData = await investigationService.getInvestigation(data.id);
      setInvestigation(fullData);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load investigation data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!investigation) return;
    try {
      setStatusUpdating(true);
      await investigationService.updateStatus(investigation.id, newStatus);
      const updated = await investigationService.getInvestigation(investigation.id);
      setInvestigation(updated);
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const exportReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ color: "#6a7b95", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <FaCircleNotch className="fa-spin" size={40} />
          Loading Investigation Details...
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
  const isConfirmed = attack.target_state && attack.target_state.includes("Confirmed");
  
  const statusOptions = ["NEW", "TRIAGE", "INVESTIGATING", "MONITORING", "RESOLVED", "FALSE POSITIVE"];

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
              <h1 style={{ margin: 0, fontSize: 24, color: "#fff" }}>Investigation: INV-{investigation.id}</h1>
              <span style={{ background: attack.severity === "Critical" ? "#ff637415" : "#5ac2f015", color: attack.severity === "Critical" ? "#ff6374" : "#5ac2f0", padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 800, border: attack.severity === "Critical" ? "1px solid #ff637450" : "1px solid #5ac2f050" }}>
                {attack.severity.toUpperCase()}
              </span>
              
              <select 
                value={investigation.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                style={{ background: "#1a2d45", color: "#fff", border: "1px solid #3be2a550", padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 800, outline: "none", cursor: "pointer" }}
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {statusUpdating && <FaCircleNotch className="fa-spin" color="#7889a3" size={12} />}
            </div>
            <div style={{ color: "#7889a3", fontSize: 13, display: "flex", gap: 16 }}>
              <span>Observed: {new Date(attack.timestamp).toLocaleString()}</span>
              <span>Confidence: {attack.confidence}%</span>
              <span>Classification: {isConfirmed ? "Confirmed India Target" : "Global Intelligence"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-primary" onClick={exportReport}>Export Report (PDF)</button>
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
          {activeTab === "overview" && <OverviewPanel investigation={investigation} />}
          {activeTab === "timeline" && <TimelinePanel investigation={investigation} />}
          {activeTab === "iocs" && <IocsPanel investigation={investigation} />}

          {activeTab === "evidence" && <EvidencePanel investigation={investigation} />}
          {activeTab === "mitre" && <MitrePanel investigation={investigation} />}
          {activeTab === "ai" && <AiAnalysisPanel investigation={investigation} />}
          {activeTab === "response" && <ResponsePanel investigation={investigation} />}
        </div>
      </div>
    </div>
  );
}
