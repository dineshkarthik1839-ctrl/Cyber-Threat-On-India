import { useState, useEffect } from "react";
import type { Investigation } from "../../services/investigationService";
import { investigationService } from "../../services/investigationService";
import { FaCircleNotch, FaExclamationTriangle, FaNetworkWired } from "react-icons/fa";

interface Props {
  investigation: Investigation;
}

export default function IocsPanel({ investigation }: Props) {
  const [iocs, setIocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIocs();
  }, [investigation.id]);

  const loadIocs = async () => {
    try {
      setLoading(true);
      const data = await investigationService.getIocs(investigation.id);
      setIocs(data);
      setError(null);
    } catch (err) {
      setError("Failed to load related IOCs.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 64, color: "#7889a3" }}>
        <FaCircleNotch className="fa-spin" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "rgba(255, 99, 116, 0.1)", padding: 24, borderRadius: 12, color: "#ff6374", display: "flex", gap: 12 }}>
        <FaExclamationTriangle size={20} />
        <div>
          <h4 style={{ margin: 0, marginBottom: 8 }}>IOC Error</h4>
          <p style={{ margin: 0 }}>{error}</p>
          <button onClick={loadIocs} className="btn btn-secondary" style={{ marginTop: 12 }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="section-title" style={{ fontSize: 20, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          <FaNetworkWired /> Related IOC Activity
        </h2>
        <span className="badge" style={{ background: "#1a2d45", color: "#7889a3", padding: "4px 12px", borderRadius: 16 }}>
          {iocs.length} related events found
        </span>
      </div>

      <div style={{ color: "#7889a3", fontSize: 14 }}>
        The following attacks share the same indicator (<strong>{investigation.attack.indicator}</strong>) across the threat intelligence database.
      </div>
      
      {iocs.length > 0 ? (
        <table className="table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", background: "#09121f", borderRadius: 8, overflow: "hidden" }}>
          <thead>
            <tr>
              <th style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: "#7889a3", fontSize: 12, textTransform: "uppercase" }}>Time</th>
              <th style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: "#7889a3", fontSize: 12, textTransform: "uppercase" }}>Target</th>
              <th style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: "#7889a3", fontSize: 12, textTransform: "uppercase" }}>Severity</th>
              <th style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: "#7889a3", fontSize: 12, textTransform: "uppercase" }}>Source Intelligence</th>
            </tr>
          </thead>
          <tbody>
            {iocs.map((ioc) => (
              <tr key={ioc.id}>
                <td style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: "#fff", fontSize: 14 }}>
                  {new Date(ioc.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: "#fff", fontSize: 14 }}>
                  {ioc.target}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: ioc.severity === "Critical" ? "#ff6374" : "#5ac2f0", fontSize: 14, fontWeight: 600 }}>
                  {ioc.severity}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #1a2d45", color: "#7889a3", fontSize: 14 }}>
                  {ioc.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ background: "#09121f", padding: 32, borderRadius: 12, border: "1px solid #1a2d45", textAlign: "center", color: "#7889a3" }}>
          No related indicators found in historical records.
        </div>
      )}
    </div>
  );
}
