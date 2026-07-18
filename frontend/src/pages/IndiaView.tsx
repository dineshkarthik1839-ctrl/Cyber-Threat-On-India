import { useEffect, useState, type ComponentType } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { getStateStats, type StateStats } from "../services/threatApi";

const Map = MapContainer as unknown as ComponentType<Record<string, unknown>>;
const Dot = CircleMarker as unknown as ComponentType<Record<string, unknown>>;

type Point = [number, number];

// Mapping of Indian states to coordinates
const stateCoordinates: Record<string, Point> = {
  "andhra pradesh": [15.97, 79.74],
  assam: [26.2, 92.93],
  delhi: [28.61, 77.21],
  gujarat: [22.25, 71.19],
  karnataka: [12.97, 77.59],
  kerala: [10.85, 76.27],
  maharashtra: [19.75, 75.71],
  "madhya pradesh": [22.97, 78.65],
  rajasthan: [27.02, 74.21],
  "tamil nadu": [11.12, 78.65],
  telangana: [18.11, 79.01],
  "uttar pradesh": [26.85, 80.95],
  "west bengal": [22.98, 87.85],
  haryana: [29.06, 76.09],
  punjab: [31.14, 75.34],
  bihar: [25.09, 85.31],
  odisha: [20.95, 85.09],
  jharkhand: [23.61, 85.27],
  chhattisgarh: [21.27, 81.86]
};

export default function IndiaView() {
  const [states, setStates] = useState<StateStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getStateStats(15);
        setStates(data);
      } catch (err) {
        console.error("Failed loading India state stats", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, []);

  const totalEvents = states.reduce((sum, s) => sum + s.count, 0);

  // Return size of pulsing circle marker based on threat count
  const getMarkerRadius = (count: number) => {
    if (totalEvents === 0) return 8;
    const share = (count / totalEvents) * 100;
    return Math.min(30, Math.max(6, Math.round(share * 2.5)));
  };

  const getMarkerColor = (count: number) => {
    if (totalEvents === 0) return "#3b82f6";
    const share = (count / totalEvents) * 100;
    if (share > 25) return "#ff6374"; // High priority heat
    if (share > 10) return "#fb8b32"; // Medium priority heat
    return "#3b82f6";                // Low priority heat
  };

  return (
    <div className="page page-enter" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <div className="eyebrow">Regional Intelligence Surface</div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, color: "#f8fafc" }}>
        India Threat Heatmap
      </h1>
      <p className="muted" style={{ fontSize: 12, color: "#6a7b95", marginBottom: 20 }}>
        State-level incident density mapping. Focus defense monitoring on identified clusters.
      </p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr", gap: 20 }}>
        {/* Heatmap Map panel */}
        <div
          className="panel"
          style={{
            height: 750,
            padding: 14,
            position: "relative",
            overflow: "hidden"
          }}
        >
          <Map
            center={[20.5, 78.9]}
            zoom={5.4}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={false}
            dragging={true}
            style={{ height: "100%", width: "100%", background: "#060d18", borderRadius: 8 }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            
            {/* Draw active state markers */}
            {states.map((state) => {
              const stateName = state.state.toLowerCase();
              const coord = stateCoordinates[stateName];
              if (!coord) return null;

              const radius = getMarkerRadius(state.count);
              const color = getMarkerColor(state.count);

              return (
                 <Dot
                  key={state.state}
                  center={coord}
                  radius={radius}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.2,
                    weight: 1.5
                  }}
                >
                  <Tooltip>
                    <div style={{ fontSize: 10 }}>
                      <strong>{state.state}</strong> <br />
                      <strong>Threat Count:</strong> {state.count.toLocaleString()} <br />
                      <strong>Density Share:</strong> {state.share}%
                    </div>
                  </Tooltip>
                </Dot>
              );
            })}
          </Map>
          
          <div className="map-status" style={{ left: 24, bottom: 24, background: "rgba(10, 16, 28, 0.8)", backdropFilter: "blur(4px)" }}>
            <span style={{ background: "#fb8b32", boxShadow: "0 0 10px #fb8b32", animation: "pulse-dot 2s infinite" }} /> 
            ACTIVE HEAT SENSORS ONLINE
          </div>
        </div>

        {/* State prioritizations list */}
        <div className="panel" style={{ padding: 20, display: "flex", flexDirection: "column", height: 750 }}>
          <h2 className="section-title">State Prioritizations</h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>Highest volume regional sensors</p>
          
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
            {isLoading ? (
              <div style={{ color: "#6a7b95", padding: 24, textAlign: "center", fontSize: 12 }}>
                Loading regional prioritization metrics...
              </div>
            ) : (
              states.map((s, idx) => (
                <div
                  key={s.state}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #1a2a3e",
                    borderRadius: 8,
                    marginBottom: 6,
                    background: "rgba(255, 255, 255, 0.01)",
                    transition: "all 0.2s ease",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "center" }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 500 }}>
                      <b style={{ color: idx < 2 ? "#ff6374" : "#3ab7f5", marginRight: 12, fontFamily: "monospace", opacity: 0.8 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </b>
                      {s.state}
                    </span>
                    <b style={{ color: "#f8fafc", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                      {s.count.toLocaleString()}
                    </b>
                  </div>
                  <div style={{ height: 5, background: "#0a111a", marginTop: 10, borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${s.share}%`,
                        height: "100%",
                        background: idx < 2 ? "linear-gradient(90deg, #f43f5e, #ff6374)" : "linear-gradient(90deg, #0ea5e9, #38bdf8)",
                        borderRadius: 3,
                        boxShadow: `0 0 8px ${idx < 2 ? "rgba(244,63,94,0.4)" : "rgba(14,165,233,0.4)"}`
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#6a7b95", marginTop: 6, letterSpacing: "0.05em" }}>
                    <span>POSTURAL RISK: {idx < 2 ? <span style={{ color: "#ff6374" }}>HIGH</span> : "NORMAL"}</span>
                    <span>{s.share}% SHARE</span>
                  </div>
                </div>
              ))
            )}
            {!isLoading && states.length === 0 && (
              <div style={{ color: "#6a7b95", padding: 24, textAlign: "center", fontSize: 12 }}>
                No regional data available yet. Start the collectors or telemetry simulator.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}