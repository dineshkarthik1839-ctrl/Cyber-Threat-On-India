import { FaChartLine, FaCrosshairs, FaGlobeAsia, FaShieldAlt, FaSyncAlt } from "react-icons/fa";
import StatCard from "../components/dashboard/StatCard";
import ThreatTable from "../components/dashboard/ThreatTable";
import Timeline from "../components/dashboard/Timeline";
import WorldMap from "../components/dashboard/WorldMap";
import { stateData } from "../services/mockData";
import { useLiveThreatFeed } from "../hooks/useLiveThreatFeed";

const relativeTime = (date: Date | null) => {
  if (!date) return "connecting…";
  return `updated ${Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))}s ago`;
};

export default function Dashboard() {
  const { threats, isRefreshing, isUsingFallback, lastUpdated, refresh, meta } = useLiveThreatFeed();
  const criticalCount = threats.filter((threat) => threat.severity === "Critical").length;
  const targetedStates = new Set(threats.map((threat) => threat.targetState)).size;

  return <div className="page">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
      <div>
        <div className="eyebrow">Command center / live telemetry</div>
        <h1 style={{ margin: "7px 0 5px", fontSize: 25, letterSpacing: "-.035em" }}>India threat landscape</h1>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Correlated intelligence from worldwide infrastructure targeting Indian networks.</p>
      </div>
      <button className="action-button" onClick={() => void refresh()} disabled={isRefreshing} aria-label="Refresh live threat feed">
        <FaSyncAlt style={{ marginRight: 7, verticalAlign: "-1px", animation: isRefreshing ? "spin 1s linear infinite" : undefined }} />
        {isUsingFallback ? "Demo telemetry" : "Live intelligence"} · {relativeTime(lastUpdated)}
      </button>
    </div>

    {isUsingFallback && <div style={{ marginTop: 16, padding: "10px 13px", borderRadius: 8, color: "#b8c7d8", border: "1px solid #36516d", background: "#112033", fontSize: 11 }}>
      Showing demonstration telemetry while the backend connects to configured intelligence providers. Add provider API keys to switch this feed to live data.
    </div>}

    <section className="grid stats-grid" style={{ marginTop: 22 }}>
      <StatCard label="Observed events" value={threats.length.toLocaleString()} detail={isUsingFallback ? "demo events in feed" : "refreshed from live sources"} accent="#168bd6" icon={<FaChartLine />} />
      <StatCard label="Critical indicators" value={criticalCount.toLocaleString()} detail="currently prioritized" accent="#db405c" icon={<FaShieldAlt />} />
      <StatCard label="Active campaigns" value={new Set(threats.map((threat) => threat.attackType)).size.toLocaleString()} detail="detected attack techniques" accent="#f59c43" icon={<FaCrosshairs />} />
      <StatCard label="Targeted regions" value={targetedStates.toLocaleString()} detail="Indian states in feed" accent="#28bd94" icon={<FaGlobeAsia />} />
    </section>

    <section className="grid dashboard-grid">
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div><h2 className="section-title">Global attack paths</h2><p className="section-subtitle">Observed hostile infrastructure targeting Indian networks</p></div>
          <span className={`severity ${isUsingFallback ? "medium" : "critical"}`}>{isUsingFallback ? "Demo" : "Live"}</span>
        </div>
        <WorldMap />
      </div>
      <div className="panel" style={{ padding: 18 }}>
        <h2 className="section-title">AI threat assessment</h2><p className="section-subtitle">Current national risk posture</p>
        <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "27px 0" }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", display: "grid", placeItems: "center", background: "conic-gradient(#f5a243 0deg 241deg,#223146 241deg)", position: "relative" }}><div style={{ width: 88, height: 88, borderRadius: "50%", display: "grid", placeItems: "center", background: "#101b2c", textAlign: "center" }}><b style={{ fontSize: 27, color: "#f7b85b" }}>67</b><span style={{ fontSize: 9, color: "#7e8da2", marginTop: -15 }}>ELEVATED</span></div></div>
          <div><b style={{ fontSize: 13 }}>Elevated risk</b><p className="muted" style={{ fontSize: 11, lineHeight: 1.6 }}>Credential abuse and public-facing application exploits are the primary active vectors.</p></div>
        </div>
        <div style={{ borderTop: "1px solid #25354b", paddingTop: 16 }}><div className="eyebrow" style={{ fontSize: 9 }}>Recommended action</div><p style={{ fontSize: 12, lineHeight: 1.6, margin: "8px 0", color: "#cad8e8" }}>Review exposed VPN gateways and enforce phishing-resistant MFA for privileged roles.</p><button className="action-button">Open analyst brief →</button></div>
      </div>
    </section>

    <section className="grid bottom-grid">
      <div className="panel" style={{ padding: "18px 0 6px" }}>
        <div style={{ padding: "0 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 className="section-title">Live threat feed</h2><p className="section-subtitle">{meta.sources?.join(" · ") || "Latest normalized indicators"}</p></div>
          <button className="action-button" onClick={() => void refresh()}>Refresh</button>
        </div>
        <ThreatTable items={threats.slice(0, 4)} />
      </div>
      <div className="panel" style={{ padding: 18 }}><h2 className="section-title">Attack volume</h2><p className="section-subtitle">24 hour event trend</p><Timeline /></div>
    </section>

    <section className="panel" style={{ padding: 18, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h2 className="section-title">Most targeted Indian states</h2><p className="section-subtitle">Rolling 24-hour attack concentration</p></div><span className="muted" style={{ fontSize: 11 }}>{threats.length.toLocaleString()} events observed</span></div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(5,minmax(130px,1fr))", marginTop: 20 }}>{stateData.map((state) => <div key={state.state}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 9 }}><span>{state.state}</span><b>{state.attacks}</b></div><div style={{ height: 5, background: "#1a2a3e", borderRadius: 5 }}><div style={{ width: `${state.share}%`, height: "100%", borderRadius: 5, background: "linear-gradient(90deg,#238ac6,#56c1f3)" }} /></div></div>)}</div>
    </section>
  </div>;
}