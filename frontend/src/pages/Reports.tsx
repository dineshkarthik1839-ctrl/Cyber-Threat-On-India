import { useEffect, useState } from "react";
import { getAiBriefing, downloadReportCsv } from "../services/threatApi";
import { FaFileAlt, FaFileCsv, FaFileCode } from "react-icons/fa";

export default function Reports() {
  const [brief, setBrief] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBrief() {
      try {
        const data = await getAiBriefing();
        setBrief(data.brief);
      } catch (err) {
        console.error(err);
        setBrief("### Error compiling threat report briefing.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadBrief();
  }, []);

  const handleDownloadCsv = async () => {
    try {
      const blob = await downloadReportCsv("All", "All", "");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ictip_full_indicators_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Error exporting database CSV report.");
    }
  };

  const handleDownloadJson = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
    // Redirect to direct JSON export API link
    const token = localStorage.getItem("ictip_token");
    window.open(`${apiBase}/reports/export?format=json&Authorization=Bearer%20${token}`, "_blank");
  };

  const formatMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("# ")) {
        return <h2 key={idx} style={{ fontSize: 20, fontWeight: 800, margin: "24px 0 12px", color: "#f8fafc", borderBottom: "1px solid #1e2e42", paddingBottom: 10 }}>{line.substring(2)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={idx} style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 8px", color: "#fb8b32" }}>{line.substring(4)}</h3>;
      }
      if (line.startsWith("* ") || line.startsWith("- ")) {
        return <li key={idx} style={{ marginLeft: 20, marginBottom: 6, fontSize: 13, color: "#cbd5e1", listStyleType: "square" }}>{parseBold(line.substring(2))}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={idx} style={{ margin: "6px 0 6px 16px", fontSize: 13, color: "#cbd5e1" }}>{parseBold(line)}</div>;
      }
      if (line.trim() === "---") {
        return <hr key={idx} style={{ border: "none", borderTop: "1px solid #1e2e42", margin: "18px 0" }} />;
      }
      return <p key={idx} style={{ fontSize: 13, margin: "8px 0", lineHeight: 1.6, color: "#cbd5e1" }}>{parseBold(line)}</p>;
    });
  };

  const parseBold = (str: string) => {
    const parts = str.split("**");
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: "#ffffff" }}>{part}</strong> : part));
  };

  return (
    <div className="page page-enter" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <div className="eyebrow">Intelligence Compilations & Reports</div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, color: "#f8fafc" }}>
        Threat Reports
      </h1>
      <p className="muted" style={{ fontSize: 12, color: "#6a7b95", marginBottom: 20 }}>
        Export security analytics datasets and read weekly strategic briefings for cybersecurity directors.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20 }}>
        {/* Weekly briefing paper */}
        <div className="panel" style={{ padding: 40, minHeight: 520, background: "#060911", border: "1px solid #1e2c40", boxShadow: "inset 0 0 40px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#fb8b32", borderBottom: "1px solid #1e2c40", paddingBottom: 16, marginBottom: 20 }}>
            <FaFileAlt size={22} />
            <div>
              <b style={{ fontSize: 15, color: "#f8fafc" }}>Strategic Intelligence Briefing</b>
              <div style={{ fontSize: 9, color: "#6a7b95", marginTop: 2, letterSpacing: ".05em" }}>AUTOMATED ANOMALY ANALYSIS REPORT</div>
            </div>
          </div>
          
          <div style={{ overflowY: "auto", maxHeight: 540, paddingRight: 6 }}>
            {isLoading ? (
              <div style={{ color: "#6a7b95", textAlign: "center", padding: 40, fontSize: 12 }}>
                Synthesizing platform telemetry reports...
              </div>
            ) : (
              formatMarkdown(brief)
            )}
          </div>
        </div>

        {/* Dataset downloads */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel" style={{ padding: 22 }}>
            <h2 className="section-title">Raw Indicators Export</h2>
            <p className="section-subtitle" style={{ marginBottom: 20 }}>Download normalized indicator logs for SIEM loading</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                className="action-button"
                onClick={handleDownloadCsv}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "16px",
                  background: "rgba(22, 40, 59, 0.6)",
                  border: "1px solid #263e5b",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#cbd5e1",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(80, 215, 169, 0.15)";
                  e.currentTarget.style.borderColor = "#50d7a9";
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(80, 215, 169, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(22, 40, 59, 0.6)";
                  e.currentTarget.style.borderColor = "#263e5b";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <FaFileCsv size={18} style={{ color: "#50d7a9" }} />
                EXPORT DATASET (CSV)
              </button>

              <button
                className="action-button"
                onClick={handleDownloadJson}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "16px",
                  background: "rgba(22, 40, 59, 0.6)",
                  border: "1px solid #263e5b",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#cbd5e1",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(14, 165, 233, 0.15)";
                  e.currentTarget.style.borderColor = "#0ea5e9";
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(14, 165, 233, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(22, 40, 59, 0.6)";
                  e.currentTarget.style.borderColor = "#263e5b";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <FaFileCode size={18} style={{ color: "#0ea5e9" }} />
                EXPORT FEED (JSON)
              </button>
            </div>
          </div>
          
          <div
            className="panel"
            style={{
              padding: 20,
              background: "rgba(22, 123, 184, 0.04)",
              border: "1px solid rgba(22, 123, 184, 0.15)",
              color: "#cbd5e1",
              fontSize: 11,
              lineHeight: 1.5
            }}
          >
            <strong>Director Summary:</strong> The weekly briefing uses heuristic AI modeling to analyze active indicators targeting Indian networks, identifying threat actors, vectors, and state prioritizations. Use these PDF/markdown briefs to update executives on CISO committees.
          </div>
        </div>
      </div>
    </div>
  );
}
