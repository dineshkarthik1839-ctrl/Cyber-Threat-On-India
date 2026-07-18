import { useEffect, useState, useRef } from "react";
import { FaSyncAlt } from "react-icons/fa";
import AttackCounter from "../components/dashboard/AttackCounter";
import LiveFeed from "../components/dashboard/LiveFeed";
import Timeline from "../components/dashboard/Timeline";
import WorldMap from "../components/dashboard/WorldMap";
import AIInsight from "../components/dashboard/AIInsight";
import AttackTicker from "../components/dashboard/AttackTicker";
import TopVectors from "../components/dashboard/TopVectors";
import { useLiveThreatFeed } from "../hooks/useLiveThreatFeed";
import {
  getOverviewStats,
  getStateStats,
  getTimelineStats,
  type OverviewStats,
  type StateStats,
  type TimelineStats
} from "../services/threatApi";

const relativeTime = (date: Date | null) => {
  if (!date) return "connecting…";
  return `updated ${Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))}s ago`;
};

export default function Dashboard() {
  const { threats, isRefreshing, isUnavailable, isDemo, lastUpdated, refresh } = useLiveThreatFeed();
  
  const [overview, setOverview] = useState<OverviewStats>({
    total_events: 0,
    critical_events: 0,
    active_campaigns: 0,
    targeted_regions: 0
  });
  const [states, setStates] = useState<StateStats[]>([]);
  const [timeline, setTimeline] = useState<TimelineStats[]>([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const fetchDashboardStats = async () => {
    try {
      const [over, st, tl] = await Promise.all([
        getOverviewStats(),
        getStateStats(5),
        getTimelineStats()
      ]);
      setOverview(over);
      setStates(st);
      setTimeline(tl);
    } catch (err) {
      console.error("Error loading dashboard metrics: ", err);
    }
  };

  useEffect(() => {
    void fetchDashboardStats();
    
    const interval = setInterval(() => {
      void fetchDashboardStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleRefresh = async () => {
    await refresh();
    await fetchDashboardStats();
  };

  const toggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Failed to enter fullscreen mode", err);
      });
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="page page-enter" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", paddingBottom: 52 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div className="eyebrow">National Command Center / Live Telemetry</div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: "-.035em", color: "#f8fafc" }}>
            India Cyber Threat Landscape
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 12, color: "#6a7b95" }}>
            Correlated threat feeds mapping worldwide malicious ingress targeting Indian endpoints.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh live threat feed"
        >
          <FaSyncAlt
            style={{
              marginRight: 7,
              verticalAlign: "-1px",
              animation: isRefreshing ? "spin 1s linear infinite" : undefined
            }}
          />
          {isUnavailable ? "Feed offline" : isDemo ? "Demo Mode" : "Live Stream"} · {relativeTime(lastUpdated)}
        </button>
      </div>

      {isUnavailable && (
        <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, color: "#b8c7d8", border: "1px solid #36516d", background: "#112033", fontSize: 11 }}>
          <strong>Attention:</strong> The live intelligence telemetry feed is currently offline. Showing cached local historical data.
        </div>
      )}

      {/* Dynamic Counter Panels */}
      <AttackCounter
        total={overview.total_events || threats.length}
        critical={overview.critical_events || threats.filter((t) => t.severity === "Critical").length}
        campaigns={overview.active_campaigns || new Set(threats.map((t) => t.attackType)).size}
        regions={overview.targeted_regions || new Set(threats.map((t) => t.targetState)).size}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10 }}>
        {/* World Map panel wrapper supporting Fullscreen API */}
        <div
          ref={mapWrapperRef}
          id="threat-map-wrapper"
          className="panel"
          style={{
            padding: isFullscreen ? "24px 28px" : 18,
            minHeight: isFullscreen ? "100vh" : 540,
            background: "#03070d",
            position: "relative",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <div>
              <h2 className="section-title" style={{ fontSize: isFullscreen ? 18 : 15 }}>Global Attack Paths</h2>
              <p className="section-subtitle">Real-time threat pathways terminating in target states of India</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn btn-ghost"
                onClick={toggleFullscreen}
                style={{ fontSize: 11, background: "#112033" }}
              >
                {isFullscreen ? "Exit Fullscreen" : "Watch Fullscreen"}
              </button>
              <span className={`severity ${isUnavailable ? "medium" : "critical"}`}>
                {isUnavailable ? "Offline" : isDemo ? "Simulation" : "Active Stream"}
              </span>
            </div>
          </div>

          {/* Map canvas container with relative controls overlays */}
          <div style={{ flex: 1, position: "relative", height: isFullscreen ? "calc(100vh - 90px)" : "auto" }}>
            <div style={{ height: isFullscreen ? "100%" : "490px", borderRadius: 12, overflow: "hidden", border: "1px solid #142842" }}>
              <WorldMap threats={threats} isDemo={isDemo} />
            </div>
          </div>
        </div>
      </div>

      <div className="three-col-grid">
        {/* Live Threat Log */}
        <div className="panel" style={{ padding: "12px 18px", display: "flex", flexDirection: "column" }}>
          <h2 className="section-title" style={{ marginBottom: 2 }}>Live Ticker</h2>
          <p className="section-subtitle" style={{ marginBottom: 10 }}>Normalized incoming security incidents</p>
          <div style={{ flex: 1, minHeight: 0 }}>
            <LiveFeed threats={threats} />
          </div>
        </div>

        {/* Attack Volume Timeline */}
        <div className="panel" style={{ padding: 18 }}>
          <h2 className="section-title">Incident Velocity</h2>
          <p className="section-subtitle">24-hour event timeline distribution</p>
          <Timeline data={timeline} />
        </div>

        {/* Top Attack Vectors */}
        <div className="panel" style={{ padding: 18 }}>
          <TopVectors threats={threats} />
        </div>
      </div>

      {/* Most targeted states list */}
      <section className="panel" style={{ padding: 24, marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 className="section-title" style={{ fontSize: "1.3rem" }}>Most Targeted Indian States</h2>
            <p className="section-subtitle" style={{ fontSize: "0.9rem" }}>State-level concentration and defensive posture ranking</p>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>
            {(overview.total_events || threats.length).toLocaleString()} events tracked
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 24 }}>
          {states.map((state) => (
            <div key={state.state}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: "#cbd5e1", fontWeight: 650 }}>{state.state}</span>
                <b style={{ color: "#5ac2f0" }}>{state.count}</b>
              </div>
              <div style={{ height: 6, background: "#1a2a3e", borderRadius: 3 }}>
                <div
                  style={{
                    width: `${state.share}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                    boxShadow: "0 0 8px rgba(59,130,246,0.4)"
                  }}
                />
              </div>
              <div style={{ fontSize: 9, color: "#6a7b95", marginTop: 4 }}>
                {state.share}% of total surface volume
              </div>
            </div>
          ))}
          {states.length === 0 && (
            <div style={{ color: "#6a7b95", fontSize: 11 }}>
              Analyzing regional telemetry data...
            </div>
          )}
        </div>
      </section>

      {/* Fixed-position FortiGuard-style scrolling attack ticker */}
      <AttackTicker threats={threats} />

      {/* Floating AI Co-Pilot */}
      <AIInsight />
    </div>
  );
}