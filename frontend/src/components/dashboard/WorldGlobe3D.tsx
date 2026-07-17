import { useEffect, useState } from "react";
import type { Threat } from "../../types/threat";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface WorldGlobe3DProps {
  threats: Threat[];
}

const origins3D: Record<string, [number, number]> = {
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

const destinations3D: Record<string, [number, number]> = {
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

const colorForSeverity = (severity: Threat["severity"]) => {
  const map: Record<string, string> = {
    Critical: "#ff6374",
    High: "#fb8b32",
    Medium: "#f5d35f",
    Low: "#50d7a9"
  };
  return map[severity] || "#9bacc0";
};

function latLngToVector3D(lat: number, lng: number): Point3D {
  const radLat = (lat * Math.PI) / 180;
  const radLng = (lng * Math.PI) / 180;
  return {
    x: Math.cos(radLat) * Math.sin(radLng),
    y: Math.sin(radLat),
    z: Math.cos(radLat) * Math.cos(radLng)
  };
}

export default function WorldGlobe3D({ threats }: WorldGlobe3DProps) {
  const [rotation, setRotation] = useState(0);
  const [activePaths, setActivePaths] = useState<any[]>([]);
  const [ripples, setRipples] = useState<any[]>([]);
  
  const width = 600;
  const height = 400;
  const radius = 170;
  const cx = width / 2;
  const cy = height / 2;

  // Globe rotation loop
  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setRotation((prev) => (prev + 0.3) % 360);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Hydrate paths from current threat feed
  useEffect(() => {
    if (!threats.length) return;

    setActivePaths((prev) => {
      const currentPaths = [...prev];
      // Sync last 8 threats
      const recent = threats.slice(0, 8);
      
      for (const threat of recent) {
        if (currentPaths.some((p) => p.id === threat.id)) continue;

        const originName = threat.sourceCountry.toLowerCase();
        const targetName = threat.targetState.toLowerCase();

        const fromLatLng = origins3D[originName] || origins3D["global feed"];
        const toLatLng = destinations3D[targetName.replace(" (confirmed target)", "").replace(" (projected feed)", "").replace(" (projected surface)", "")] || destinations3D.india;

        const v0 = latLngToVector3D(fromLatLng[0], fromLatLng[1]);
        const v1 = latLngToVector3D(toLatLng[0], toLatLng[1]);
        const color = colorForSeverity(threat.severity);

        // Stagger initial progress values on load
        const initialProgress = prev.length === 0 ? Math.random() * 0.45 : 0;

        currentPaths.push({
          id: threat.id,
          v0,
          v1,
          color,
          progress: initialProgress,
          status: "animating",
          severity: threat.severity,
          origin: threat.sourceCountry,
          target: threat.targetState,
          ip: threat.sourceIp
        });
      }
      return currentPaths.slice(-15);
    });
  }, [threats]);

  // Handle particle travel updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePaths((prev) =>
        prev
          .map((p) => {
            if (p.status === "landed") return p;

            const nextProgress = p.progress + 0.016;
            if (nextProgress >= 1) {
              // Trigger ripple collision effect
              const ripId = `rip-${p.id}-${Date.now()}`;
              setRipples((r) => [...r, { id: ripId, vector: p.v1, color: p.color, scale: 0.1 }].slice(-8));

              // Clean up path from the collection in 4 seconds
              setTimeout(() => {
                setActivePaths((current) => current.filter((item) => item.id !== p.id));
              }, 4000);

              return { ...p, progress: 1, status: "landed" };
            }
            return { ...p, progress: nextProgress };
          })
      );
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Ingress ripples expansion
  useEffect(() => {
    const interval = setInterval(() => {
      setRipples((prev) =>
        prev
          .map((r) => {
            const nextScale = r.scale + 0.07;
            if (nextScale >= 1.0) return null;
            return { ...r, scale: nextScale };
          })
          .filter(Boolean)
      );
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const project = (v: Point3D, h = 1.0) => {
    const radRot = (rotation * Math.PI) / 180;
    
    const rx = v.x * Math.cos(radRot) - v.z * Math.sin(radRot);
    const rz = v.x * Math.sin(radRot) + v.z * Math.cos(radRot);
    const ry = v.y;

    const sx = cx + rx * radius * h;
    const sy = cy - ry * radius * h;
    
    return { x: sx, y: sy, visible: rz >= 0, z: rz };
  };

  const renderParallels = () => {
    const paths = [];
    const step = 20;
    for (let lat = -60; lat <= 60; lat += step) {
      const radLat = (lat * Math.PI) / 180;
      const rLat = radius * Math.cos(radLat);
      const yLat = cy - radius * Math.sin(radLat);
      
      paths.push(
        <ellipse
          key={`lat-${lat}`}
          cx={cx}
          cy={yLat}
          rx={rLat}
          ry={rLat * 0.22}
          fill="none"
          stroke="#103657"
          strokeWidth={0.8}
          opacity={0.35}
        />
      );
    }
    return paths;
  };

  const renderMeridians = () => {
    const paths = [];
    const step = 30;
    for (let deg = 0; deg < 180; deg += step) {
      const rad = (deg * Math.PI) / 180;
      paths.push(
        <ellipse
          key={`lon-${deg}`}
          cx={cx}
          cy={cy}
          rx={radius * Math.abs(Math.sin(rad))}
          ry={radius}
          fill="none"
          stroke="#103657"
          strokeWidth={0.8}
          opacity={0.35}
          transform={`rotate(${deg}, ${cx}, ${cy})`}
        />
      );
    }
    return paths;
  };

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        background: "#03070d",
        border: "1px solid #142842",
        boxShadow: "inset 0 0 15px rgba(22, 123, 184, 0.15)",
        borderRadius: 8,
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden"
      }}
    >
      {/* Responsive viewBox settings for scaling globe dynamically */}
      <svg
        viewBox="0 0 600 400"
        width="100%"
        height="100%"
        style={{ background: "transparent" }}
      >
        <circle cx={cx} cy={cy} r={radius} fill="#040811" stroke="#1c3b63" strokeWidth={1.5} />
        
        <circle
          cx={cx}
          cy={cy}
          r={radius + 4}
          fill="none"
          stroke="rgba(22, 123, 184, 0.2)"
          strokeWidth={6}
          style={{ filter: "blur(4px)" }}
        />

        {renderParallels()}
        {renderMeridians()}

        {activePaths.map((p) => {
          const pathPoints: string[] = [];
          const stepCount = 25;
          let isPathVisible = false;

          for (let i = 0; i <= stepCount; i++) {
            const t = i / stepCount;
            const vx = (1 - t) * p.v0.x + t * p.v1.x;
            const vy = (1 - t) * p.v0.y + t * p.v1.y;
            const vz = (1 - t) * p.v0.z + t * p.v1.z;
            const len = Math.sqrt(vx * vx + vy * vy + vz * vz);

            const heightMultiplier = 1.0 + Math.sin(t * Math.PI) * 0.18;
            const pt = project(
              { x: vx / len, y: vy / len, z: vz / len },
              heightMultiplier
            );
            
            if (pt.visible) {
              isPathVisible = true;
            }
            pathPoints.push(`${pt.x},${pt.y}`);
          }

          if (!isPathVisible) return null;

          return (
            <g key={p.id}>
              <polyline
                points={pathPoints.join(" ")}
                fill="none"
                stroke={p.color}
                strokeWidth={3}
                opacity={p.status === "animating" ? 0.16 : 0.04}
              />
              <polyline
                points={pathPoints.join(" ")}
                fill="none"
                stroke={p.color}
                strokeWidth={1.1}
                opacity={p.status === "animating" ? 0.75 : 0.15}
                strokeDasharray={p.status === "animating" ? "3 5" : undefined}
              />
            </g>
          );
        })}

        {/* Floating particles */}
        {activePaths
          .filter((p) => p.status === "animating")
          .map((p) => {
            const t = p.progress;
            const vx = (1 - t) * p.v0.x + t * p.v1.x;
            const vy = (1 - t) * p.v0.y + t * p.v1.y;
            const vz = (1 - t) * p.v0.z + t * p.v1.z;
            const len = Math.sqrt(vx * vx + vy * vy + vz * vz);

            const h = 1.0 + Math.sin(t * Math.PI) * 0.18;
            const pt = project({ x: vx / len, y: vy / len, z: vz / len }, h);

            if (!pt.visible) return null;

            return (
              <g key={`part-${p.id}`}>
                <circle cx={pt.x} cy={pt.y} r={7} fill={p.color} opacity={0.35} />
                <circle cx={pt.x} cy={pt.y} r={2} fill="#ffffff" />
              </g>
            );
          })}

        {/* Origin Nodes */}
        {activePaths.map((p) => {
          const pt = project(p.v0);
          if (!pt.visible) return null;

          return (
            <g key={`origin-node-${p.id}`}>
              <circle cx={pt.x} cy={pt.y} r={3.5} fill={p.color} />
              <circle cx={pt.x} cy={pt.y} r={1.5} fill="#ffffff" />
            </g>
          );
        })}

        {/* Indian collision waves */}
        {ripples.map((r) => {
          const pt = project(r.vector);
          if (!pt.visible) return null;

          return (
            <circle
              key={r.id}
              cx={pt.x}
              cy={pt.y}
              r={r.scale * 30}
              fill="none"
              stroke={r.color}
              strokeWidth={1.5}
              opacity={1 - r.scale}
            />
          );
        })}

        {/* Indian State targets */}
        {activePaths.map((p) => {
          const pt = project(p.v1);
          if (!pt.visible) return null;

          return (
            <circle
              key={`target-node-${p.id}`}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={p.color}
              opacity={0.65}
            />
          );
        })}
      </svg>
      
      <div className="map-status" style={{ border: "1px solid #14324f", background: "#050e18f2" }}>
        <span style={{ background: "#fb8b32", boxShadow: "0 0 10px #fb8b32" }} /> 
        3D ROTATING GLOBE WIREFRAME ACTIVE
      </div>
    </div>
  );
}
