import { useEffect, useState } from "react";
import WorldMap from "../components/dashboard/WorldMap";
import { useLiveThreatFeed } from "../hooks/useLiveThreatFeed";
import { FaSyncAlt, FaExpand } from "react-icons/fa";
import Timeline from "../components/dashboard/Timeline";
import TopVectors from "../components/dashboard/TopVectors";
import { getTimelineStats, type TimelineStats } from "../services/threatApi";

export default function ThreatMapPage() {
  const { threats, isDemo, isUnavailable, isRefreshing, refresh } = useLiveThreatFeed();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeline, setTimeline] = useState<TimelineStats[]>([]);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const tl = await getTimelineStats();
        setTimeline(tl);
      } catch (err) {
        console.error(err);
      }
    };
    void fetchTimeline();
    const interval = setInterval(fetchTimeline, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const el = document.getElementById("threat-map-full-container");
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="page page-enter" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 40px)", paddingBottom: 20, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Visualization</div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, color: "#f8fafc" }}>
            Global Threat Map
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 12, color: "#6a7b95" }}>
            Real-time telemetry and heat map of incoming cyber attacks.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" onClick={toggleFullscreen}>
            <FaExpand style={{ marginRight: 6 }} /> {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
          <button className="btn btn-secondary" onClick={refresh} disabled={isRefreshing}>
            <FaSyncAlt style={{ marginRight: 6, animation: isRefreshing ? "spin 1s linear infinite" : undefined }} />
            {isUnavailable ? "Offline" : isDemo ? "Demo" : "Live"}
          </button>
        </div>
      </div>

      <div className="threat-map-grid">
        {/* Left Side Panel: Threat Graph (Timeline) */}
        <div className="panel" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "#e2effc" }}>Attack Velocity</h3>
          <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#6a7b95" }}>24-hour event timeline distribution</p>
          <div style={{ flex: 1 }}>
             <Timeline data={timeline} />
          </div>
        </div>

        {/* Center: Threat Map */}
        <div className="panel" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#e2effc" }}>Global Threat Map</h3>
          <div style={{ position: "relative", height: "calc(100vh - 220px)", minHeight: 600 }}>
            <WorldMap threats={threats} isDemo={isDemo} />
          </div>
        </div>

        {/* Right Side Panel: Threat Analysis */}
        <div className="panel" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#e2effc" }}>Threat Analysis</h3>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <TopVectors threats={threats} />
          </div>
        </div>
      </div>
    </div>
  );
}
