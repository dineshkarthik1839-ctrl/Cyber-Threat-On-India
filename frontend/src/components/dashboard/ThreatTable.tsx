import { useState, useMemo } from "react";
import type { Threat } from "../../types/threat";
import { useThreatDetails } from "../../contexts/ThreatDetailsContext";
import { FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

const cls = (s: string) => s.toLowerCase();

export default function ThreatTable({ items }: { items: Threat[] }) {
  const { openDrawer } = useThreatDetails();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof Threat | "timestamp"; direction: "asc" | "desc" } | null>({
    key: "timestamp",
    direction: "desc"
  });

  const handleSort = (key: keyof Threat | "timestamp") => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <FaSort color="#3a4b66" size={10} />;
    return sortConfig.direction === "asc" ? <FaSortUp color="#5ac2f0" size={12} /> : <FaSortDown color="#5ac2f0" size={12} />;
  };

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (severityFilter !== "All") {
      filtered = filtered.filter(t => t.severity.toLowerCase() === severityFilter.toLowerCase());
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.sourceIp.toLowerCase().includes(lower) ||
        t.targetState.toLowerCase().includes(lower) ||
        t.attackType.toLowerCase().includes(lower) ||
        t.sourceCountry.toLowerCase().includes(lower) ||
        t.mitre.toLowerCase().includes(lower)
      );
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Threat];
        let bVal = b[sortConfig.key as keyof Threat];
        
        if (sortConfig.key === "timestamp") {
          aVal = new Date(a.timestamp).getTime() as any;
          bVal = new Date(b.timestamp).getTime() as any;
        }

        if (aVal! < bVal!) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal! > bVal!) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [items, searchTerm, severityFilter, sortConfig]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Table Toolbar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <FaSearch style={{ position: "absolute", left: 12, top: 12, color: "#4a5e78" }} />
          <input 
            type="text" 
            placeholder="Search IPs, countries, attack types..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field"
            style={{ paddingLeft: 36, background: "rgba(10, 15, 26, 0.4)", border: "1px solid #1a2d45" }}
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaFilter color="#4a5e78" size={14} />
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="field"
            style={{ width: 140, background: "rgba(10, 15, 26, 0.4)", border: "1px solid #1a2d45", padding: "10px 14px" }}
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, border: "1px solid #1a2d45", borderRadius: 8 }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#0e1624", zIndex: 10 }}>
            <tr>
              <th onClick={() => handleSort("sourceIp")} style={{ cursor: "pointer", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>Indicator {getSortIcon("sourceIp")}</div>
              </th>
              <th onClick={() => handleSort("sourceCountry")} style={{ cursor: "pointer", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>Origin {getSortIcon("sourceCountry")}</div>
              </th>
              <th onClick={() => handleSort("targetState")} style={{ cursor: "pointer", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>Target {getSortIcon("targetState")}</div>
              </th>
              <th onClick={() => handleSort("attackType")} style={{ cursor: "pointer", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>Technique {getSortIcon("attackType")}</div>
              </th>
              <th onClick={() => handleSort("severity")} style={{ cursor: "pointer", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>Severity {getSortIcon("severity")}</div>
              </th>
              <th onClick={() => handleSort("timestamp")} style={{ cursor: "pointer", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>Seen {getSortIcon("timestamp")}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((t) => (
              <tr 
                key={t.id} 
                style={{ cursor: "pointer" }}
                onClick={() => openDrawer(t)}
                className="hover-row"
              >
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>
                  <b style={{ color: "#3ab7f5", fontFamily: "monospace", fontSize: 13, letterSpacing: "0.02em" }}>{t.sourceIp}</b>
                  <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>
                    {t.id}
                  </div>
                </td>
                <td style={{ color: "#cbd5e1", padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>
                  {t.countryCode} · {t.sourceCountry}
                </td>
                <td style={{ color: "#cbd5e1", padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>
                  {t.targetState.replace(" (Confirmed Target)", "").replace(" (Projected Feed)", "")}
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>
                  <span style={{ color: "#e2effc", fontWeight: 500 }}>{t.attackType}</span>
                  <div className="muted" style={{ fontSize: 10, marginTop: 4, fontFamily: "monospace", color: "#6a7b95" }}>
                    {t.mitre}
                  </div>
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>
                  <span className={`severity ${cls(t.severity)}`}>{t.severity}</span>
                </td>
                <td className="muted" style={{ fontSize: 11, padding: "12px 16px", borderBottom: "1px solid #1a2d45" }}>
                  {new Date(t.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#6a7b95" }}>
                  No threats found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* CSS for hover */}
        <style>{`
          .hover-row { transition: all 0.2s ease; }
          .hover-row:hover { background: rgba(26, 45, 69, 0.4); }
        `}</style>
      </div>
    </div>
  );
}