import { useMemo, useState } from "react";
import ThreatTable from "../components/dashboard/ThreatTable";
import { useLiveThreatFeed } from "../hooks/useLiveThreatFeed";

export default function ThreatFeed() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const { threats, isRefreshing, isUsingFallback, lastUpdated, refresh, meta } = useLiveThreatFeed();
  const filtered = useMemo(() => threats.filter((threat) => (
    (severity === "All" || threat.severity === severity)
    && `${threat.sourceIp} ${threat.sourceCountry} ${threat.attackType} ${threat.targetState}`.toLowerCase().includes(query.toLowerCase())
  )), [query, severity, threats]);

  return <div className="page">
    <div className="eyebrow">Intelligence / normalized telemetry</div>
    <h1 style={{ margin: "7px 0 5px", fontSize: 25 }}>Threat feed</h1>
    <p className="muted" style={{ fontSize: 12 }}>Auto-refreshing worldwide indicators targeting India. {isUsingFallback ? "Demo mode is active." : "Live provider data is active."}</p>
    <div className="panel" style={{ padding: 18, marginTop: 22 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input className="field" style={{ maxWidth: 380 }} placeholder="Search IP, country, technique, or state" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="field" style={{ width: 140 }} value={severity} onChange={(event) => setSeverity(event.target.value)}><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
        <button className="action-button" onClick={() => void refresh()} disabled={isRefreshing}>{isRefreshing ? "Refreshing…" : "Refresh now"}</button>
        <span className="muted" style={{ fontSize: 10 }}>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Connecting…"}</span>
      </div>
      <div className="muted" style={{ fontSize: 10, margin: "-7px 0 14px" }}>{meta.sources?.length ? `Sources: ${meta.sources.join(" · ")}` : "Sources will appear when connected."}</div>
      <ThreatTable items={filtered} />
      {!filtered.length && <p className="muted" style={{ padding: 20, textAlign: "center" }}>No indicators match the current filters.</p>}
    </div>
  </div>;
}