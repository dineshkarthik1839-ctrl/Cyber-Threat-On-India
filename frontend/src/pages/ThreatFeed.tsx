import { useEffect, useState, useCallback } from "react";
import ThreatTable from "../components/dashboard/ThreatTable";
import { getLiveThreatFeed } from "../services/threatApi";
import type { Threat } from "../types/threat";
import { FaSyncAlt, FaDownload } from "react-icons/fa";
import { downloadReportCsv } from "../services/threatApi";
import { TableSkeleton } from "../components/common/SkeletonLoader";

export default function ThreatFeed() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [source, setSource] = useState("All");
  
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sourcesList, setSourcesList] = useState<string[]>([]);

  const fetchFeed = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const feed = await getLiveThreatFeed(severity, source, query);
      setThreats(feed.items);
      setLastUpdated(new Date());
      
      if (feed.meta.sources && feed.meta.sources.length) {
        setSourcesList(feed.meta.sources);
      } else {
        const uniqueSources = Array.from(new Set(feed.items.map((i: any) => i.source || "Feed")));
        setSourcesList(uniqueSources);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch threat intelligence feed records.");
    } finally {
      setIsRefreshing(false);
    }
  }, [severity, source, query]);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      void fetchFeed();
    }, 300);
    
    return () => clearTimeout(debounceId);
  }, [fetchFeed]);

  const handleCsvDownload = async () => {
    try {
      const blob = await downloadReportCsv(severity, source, query);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ictip_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Failed to download CSV", err);
      alert("Error generating report CSV download.");
    }
  };

  return (
    <div className="page page-enter">
      <div className="eyebrow">Intelligence / Normalized Telemetry Log</div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, color: "#f8fafc" }}>
        Threat Intel Log
      </h1>
      <p className="muted" style={{ fontSize: 12, color: "#6a7b95", marginBottom: 20 }}>
        Query normalized cyber indicators from active intelligence sensor feeds targeting Indian networks.
      </p>
      
      <div className="panel" style={{ padding: 20 }}>
        {/* Filters Header */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="field"
            style={{ maxWidth: 300, background: "rgba(5, 9, 16, 0.6)", borderColor: "#192e47", fontSize: 13, transition: "border-color 0.2s" }}
            placeholder="Search IP, country, technique, state..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <select
            className="field"
            style={{ width: 150, background: "rgba(5, 9, 16, 0.6)", borderColor: "#192e47", fontSize: 13, cursor: "pointer" }}
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            className="field"
            style={{ width: 160, background: "rgba(5, 9, 16, 0.6)", borderColor: "#192e47", fontSize: 13, cursor: "pointer" }}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="All">All Feeds</option>
            <option value="abuseipdb">AbuseIPDB</option>
            <option value="otx">AlienVault OTX</option>
            <option value="threatfox">ThreatFox</option>
            <option value="urlhaus">URLHaus</option>
            <option value="cisa">CISA KEV</option>
            <option value="simulator">Simulator</option>
          </select>
          
          <button
            className="btn btn-secondary"
            onClick={() => void fetchFeed()}
            disabled={isRefreshing}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <FaSyncAlt style={{ animation: isRefreshing ? "spin 1s linear infinite" : undefined }} />
            Reload
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={handleCsvDownload}
            style={{ background: "#1b3c2e", borderColor: "#2d5e48", color: "#50d7a9", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#244f3d";
              e.currentTarget.style.borderColor = "#3a7a5d";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1b3c2e";
              e.currentTarget.style.borderColor = "#2d5e48";
            }}
          >
            <FaDownload />
            Export CSV
          </button>
          
          <span className="muted" style={{ fontSize: 10, marginLeft: "auto" }}>
            {lastUpdated ? `Sync: ${lastUpdated.toLocaleTimeString()}` : "Syncing..."}
          </span>
        </div>
        
        <div className="muted" style={{ fontSize: 10, margin: "-4px 0 14px 2px", color: "#6a7b95" }}>
          Active sources: {sourcesList.length ? sourcesList.join(" · ") : "None detected"}
        </div>
        
        {error && (
          <div style={{ color: "#ff6374", fontSize: 12, padding: 10, textAlign: "center" }}>
            {error}
          </div>
        )}
        
        {isRefreshing && threats.length === 0 ? (
          <TableSkeleton rows={8} />
        ) : (
          <>
            <ThreatTable items={threats} />
            {threats.length === 0 && (
              <p className="muted" style={{ padding: 24, textAlign: "center", fontSize: 12 }}>
                No intelligence records matched the current filters.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}