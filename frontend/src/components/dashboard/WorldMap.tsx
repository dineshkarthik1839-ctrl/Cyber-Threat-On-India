import { useState, useEffect, type ComponentType } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";
import type { Threat } from "../../types/threat";
import { useThreatDetails } from "../../contexts/ThreatDetailsContext";

const Map = MapContainer as unknown as ComponentType<Record<string, unknown>>;
const Dot = CircleMarker as unknown as ComponentType<Record<string, unknown>>;
const Line = Polyline as unknown as ComponentType<Record<string, unknown>>;

type Point = [number, number];

// Geographic coordinates for threat origins
const origins: Record<string, Point> = {
  australia: [-25.3, 133.8],
  bangladesh: [23.7, 90.4],
  brazil: [-14.2, -51.9],
  canada: [56.1, -106.3],
  china: [35.9, 104.2],
  france: [46.2, 2.2],
  germany: [51.2, 10.5],
  india: [20.6, 78.9],
  indonesia: [-0.8, 113.9],
  iran: [32.4, 53.7],
  japan: [36.2, 138.3],
  netherlands: [52.1, 5.3],
  pakistan: [30.4, 69.3],
  russia: [61.5, 105.3],
  singapore: [1.4, 103.8],
  turkey: [38.9, 35.2],
  ukraine: [48.4, 31.2],
  "united kingdom": [55.4, -3.4],
  "united states": [37.1, -95.7],
  vietnam: [14.1, 108.3],
  "global feed": [45.0, 10.0]
};

// Target state coordinates in India
const destinations: Record<string, Point> = {
  "andhra pradesh": [15.9, 79.7],
  assam: [26.2, 92.9],
  delhi: [28.61, 77.21],
  gujarat: [22.3, 71.2],
  karnataka: [12.97, 77.59],
  kerala: [10.85, 76.27],
  maharashtra: [19.08, 72.88],
  "madhya pradesh": [23.3, 77.4],
  rajasthan: [26.9, 75.8],
  "tamil nadu": [13.08, 80.27],
  telangana: [17.39, 78.49],
  "uttar pradesh": [26.85, 80.95],
  "west bengal": [22.57, 88.36],
  india: [22.6, 79.3]
};

const colorFor = (severity: Threat["severity"]) => {
  const map: Record<string, string> = {
    Critical: "#ff6374",
    High: "#fb8b32",
    Medium: "#f5d35f",
    Low: "#50d7a9"
  };
  return map[severity] || "#9bacc0";
};

const getCityForState = (state: string) => {
  const map: Record<string, string> = {
    "andhra pradesh": "Amaravati",
    assam: "Guwahati",
    delhi: "New Delhi",
    gujarat: "Ahmedabad",
    karnataka: "Bengaluru",
    kerala: "Kochi",
    maharashtra: "Mumbai",
    "madhya pradesh": "Bhopal",
    rajasthan: "Jaipur",
    "tamil nadu": "Chennai",
    telangana: "Hyderabad",
    "uttar pradesh": "Lucknow",
    "west bengal": "Kolkata",
    india: "New Delhi"
  };
  return map[state.toLowerCase()] || "City";
};

// Utility to calculate Bezier curve points in lat/lng space
function getBezierPoints(from: Point, to: Point, pointsCount = 35): Point[] {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  
  const offset = 0.22;
  const controlLat = midLat + (-dLng * offset) + 12.0; 
  const controlLng = midLng + (dLat * offset);

  const points: Point[] = [];
  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

// Particle Component: Animates a glowing laser core along the points array
interface ParticleProps {
  points: Point[];
  color: string;
  onComplete: () => void;
}

function AttackParticle({ points, color, onComplete }: ParticleProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const duration = 1800; // 1.8 seconds travel time
    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const idx = Math.floor(progress * (points.length - 1));
      setIndex(idx);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [points, onComplete]);

  const currentPoint = points[index];
  if (!currentPoint) return null;

  return (
    <>
      {/* Outer glow ring */}
      <Dot
        center={currentPoint}
        radius={8}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 0
        }}
      />
      {/* Inner bright core */}
      <Dot
        center={currentPoint}
        radius={2.5}
        pathOptions={{
          color: "#ffffff",
          fillColor: color,
          fillOpacity: 1.0,
          weight: 1.0
        }}
      />
    </>
  );
}

// Impact Ripple Component: Animates a expanding, fading ring at target
interface RippleProps {
  center: Point;
  color: string;
  onComplete: () => void;
}

function ImpactRipple({ center, color, onComplete }: RippleProps) {
  const [radius, setRadius] = useState(2);
  const [opacity, setOpacity] = useState(0.8);

  useEffect(() => {
    const duration = 900; 
    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setRadius(2 + progress * 26);
      setOpacity(0.8 * (1 - progress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  return (
    <Dot
      center={center}
      radius={radius}
      pathOptions={{
        color: color,
        fillColor: "transparent",
        opacity: opacity,
        weight: 1.8
      }}
    />
  );
}

// Active path details tracking
interface ActivePath {
  id: string;
  points: Point[];
  color: string;
  originName: string;
  targetName: string;
  sourceIp: string;
  attackType: string;
  severity: Threat["severity"];
  status: "animating" | "landed";
}

interface HistoricalPoint {
  id: string;
  center: Point;
  targetName: string;
  attackType: string;
  color: string;
}

interface WorldMapProps {
  threats: Threat[];
  isDemo: boolean;
}

export default function WorldMap({ threats, isDemo }: WorldMapProps) {
  const { openDrawer } = useThreatDetails();
  const [activePaths, setActivePaths] = useState<ActivePath[]>([]);
  const [ripples, setRipples] = useState<{ id: string; center: Point; color: string }[]>([]);
  const [historicalPoints, setHistoricalPoints] = useState<HistoricalPoint[]>([]);

  useEffect(() => {
    if (!threats.length) return;

    const latestThreat = threats[0];
    
    if (activePaths.some((p) => p.id === latestThreat.id)) return;

    const originName = latestThreat.sourceCountry.toLowerCase();
    const targetName = latestThreat.targetState.toLowerCase();

    let from = origins[originName];
    if (!from) {
      const originKeys = Object.keys(origins).filter(k => k !== "india" && k !== "global feed");
      const randKey = originKeys[Math.floor(Math.random() * originKeys.length)];
      from = origins[randKey];
    }

    let to = destinations[targetName.replace(" (confirmed target)", "").replace(" (projected feed)", "").replace(" (projected surface)", "")];
    if (!to) {
      to = destinations.india;
    }

    const color = colorFor(latestThreat.severity);
    const points = getBezierPoints(from, to);

    const newPath: ActivePath = {
      id: latestThreat.id,
      points,
      color,
      originName: latestThreat.sourceCountry,
      targetName: latestThreat.targetState,
      sourceIp: latestThreat.sourceIp,
      attackType: latestThreat.attackType,
      severity: latestThreat.severity,
      status: "animating"
    };

    setActivePaths((prev) => [newPath, ...prev].slice(0, 15));
  }, [threats, activePaths]);

  const handleParticleComplete = (pathId: string, targetPoint: Point, color: string) => {
    setActivePaths((prev) =>
      prev.map((p) => (p.id === pathId ? { ...p, status: "landed" } : p))
    );

    const rippleId = `ripple-${pathId}-${Date.now()}`;
    setRipples((prev) => [...prev, { id: rippleId, center: targetPoint, color }]);

    setTimeout(() => {
      setActivePaths((prev) => {
        const path = prev.find((p) => p.id === pathId);
        if (path) {
          setHistoricalPoints((hp) => [
            { id: path.id, center: targetPoint, targetName: path.targetName, attackType: path.attackType, color },
            ...hp
          ].slice(0, 100)); // Keep last 100 impacts on map
        }
        return prev.filter((p) => p.id !== pathId);
      });
    }, 4500);
  };

  const handleRippleComplete = (rippleId: string) => {
    setRipples((prev) => prev.filter((r) => r.id !== rippleId));
  };

  return (
    <div className="threat-map" style={{ height: "100%", border: "1px solid #142842", boxShadow: "inset 0 0 15px rgba(22, 123, 184, 0.15)" }}>
      <Map
        center={[20.5, 78.9]}
        zoom={4.5}
        zoomControl={true}
        attributionControl={false}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        boxZoom={false}
        style={{ height: "100%", width: "100%", background: "#090f1b" }}
      >
        {/* Custom CSS for map tooltips to make them glassmorphic and borderless */}
        <style>{`
          .state-label-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .state-label-tooltip::before {
            display: none !important;
          }
          .leaflet-tooltip {
            background: rgba(10, 15, 26, 0.95) !important;
            border: 1px solid #1a8dd0 !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7) !important;
            color: #ffffff !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            transition: none !important;
            animation: none !important;
          }
          .empty-icon {
            display: none;
          }
        `}</style>
        
        {/* Google Maps Theme for clarity and accurate city labels */}
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />

        
        {/* Glowing laser curves - render thick visible outer line first, then sharp solid inner line */}
        {activePaths.map((p) => (
          <Line
            key={`glow-${p.id}`}
            positions={p.points}
            pathOptions={{
              color: p.color,
              weight: 8,
              opacity: p.status === "animating" ? 0.4 : 0.1
            }}
            eventHandlers={{
              click: () => {
                const threat = threats.find(t => t.id === p.id);
                if (threat) openDrawer(threat);
              }
            }}
          >
            <Tooltip>
              <div style={{ fontSize: 11, color: "#ffffff", textShadow: "0px 1px 3px rgba(0,0,0,0.8)" }}>
                <strong>Attacker:</strong> {p.sourceIp} <br />
                <strong>Origin:</strong> {p.originName} <br />
                <strong>Target:</strong> {p.targetName} <br />
                <strong>Vector:</strong> {p.attackType} <br />
                <strong>Severity:</strong> {p.severity}
              </div>
            </Tooltip>
          </Line>
        ))}

        {activePaths.map((p) => (
          <Line
            key={`core-${p.id}`}
            positions={p.points}
            pathOptions={{
              color: p.color,
              weight: 3.5,
              opacity: p.status === "animating" ? 1.0 : 0.3,
              dashArray: p.status === "animating" ? "8 6" : undefined
            }}
            eventHandlers={{
              click: () => {
                const threat = threats.find(t => t.id === p.id);
                if (threat) openDrawer(threat);
              }
            }}
          />
        ))}

        {/* Origin dot markers */}
        {activePaths.map((p) => (
          <Dot
            key={`origin-${p.id}`}
            center={p.points[0]}
            radius={2.5}
            pathOptions={{
              color: p.color,
              fillColor: "#ffffff",
              fillOpacity: 1.0,
              weight: 1.0
            }}
          >
            <Tooltip>
              <div style={{ fontSize: 11, color: "#ffffff", textShadow: "0px 1px 3px rgba(0,0,0,0.8)" }}>
                <strong>Origin:</strong> {p.originName} <br />
                <strong>IP:</strong> {p.sourceIp}
              </div>
            </Tooltip>
          </Dot>
        ))}

        {/* Target destination markers with pulse-like visual cores */}
        {activePaths.map((p) => (
          <Dot
            key={`target-${p.id}`}
            center={p.points[p.points.length - 1]}
            radius={4}
            pathOptions={{
              color: p.color,
              fillColor: p.color,
              fillOpacity: 0.35,
              weight: 1.0
            }}
            eventHandlers={{
              click: () => {
                const threat = threats.find(t => t.id === p.id);
                if (threat) openDrawer(threat);
              }
            }}
          >
            <Tooltip>
              <div style={{ fontSize: 11, color: "#ffffff", textShadow: "0px 1px 3px rgba(0,0,0,0.8)" }}>
                <strong>Destination:</strong> {getCityForState(p.targetName)}, {p.targetName} <br />
                <strong>Threat Vector:</strong> {p.attackType}
              </div>
            </Tooltip>
          </Dot>
        ))}

        {/* Animated particles */}
        {activePaths
          .filter((p) => p.status === "animating")
          .map((p) => (
            <AttackParticle
              key={`particle-${p.id}`}
              points={p.points}
              color={p.color}
              onComplete={() =>
                handleParticleComplete(p.id, p.points[p.points.length - 1], p.color)
              }
            />
          ))}

        {/* Collision impact ripples */}
        {ripples.map((r) => (
          <ImpactRipple
            key={r.id}
            center={r.center}
            color={r.color}
            onComplete={() => handleRippleComplete(r.id)}
          />
        ))}

        {/* Historical impact points that stay on map */}
        {historicalPoints.map((hp) => (
          <Dot
            key={`hist-${hp.id}`}
            center={hp.center}
            radius={3.5}
            pathOptions={{
              color: hp.color,
              fillColor: hp.color,
              fillOpacity: 0.85,
              weight: 0
            }}
            eventHandlers={{
              click: () => {
                const threat = threats.find(t => t.id === hp.id);
                if (threat) openDrawer(threat);
              }
            }}
          >
            <Tooltip>
              <div style={{ fontSize: 11, color: "#ffffff", textShadow: "0px 1px 3px rgba(0,0,0,0.8)" }}>
                <strong>Destination:</strong> {getCityForState(hp.targetName)}, {hp.targetName} <br />
                <strong>Threat Vector:</strong> {hp.attackType} <br />
                <em style={{ fontSize: 9, opacity: 0.7, color: "#a5b4fc" }}>Recorded Historical Impact</em>
              </div>
            </Tooltip>
          </Dot>
        ))}
      </Map>
      
      <div className="map-status" style={{ border: "1px solid #14324f", background: "#050e18f2" }}>
        <span /> {isDemo ? "DEMO INDIA TELEMETRY" : "LIVE SOC INGRESS STREAM"} · {threats.length} ACTIVE PATHS
      </div>
      
      {/* Map Legend Overlay */}
      <div style={{ position: "absolute", zIndex: 500, right: 16, bottom: 15, background: "rgba(10, 15, 26, 0.8)", border: "1px solid #1a2d45", padding: "10px 14px", borderRadius: 8, backdropFilter: "blur(8px)", fontSize: 10, color: "#cbd5e1" }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#f0f6fc", fontSize: 11 }}>THREAT LEGEND</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff6374" }}></span> Critical
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fb8b32" }}></span> High
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f5d35f" }}></span> Medium
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#50d7a9" }}></span> Low
          </div>
        </div>
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #1a2d45", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 2, background: "#ff6374" }}></span> Confirmed Attack
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 2, borderBottom: "2px dashed #9bacc0" }}></span> Intelligence Stream
          </div>
        </div>
      </div>
      
      {!threats.length && (
        <div className="map-empty" style={{ background: "#03070dcc" }}>
          Connecting to national cybersecurity feed...
        </div>
      )}
    </div>
  );
}
