import { useEffect, useState } from "react";
import api from "../../services/api";

interface SensorData {
  id: number;
  sensor_uuid: string;
  name: string;
  location_country: string;
  location_state: string;
  location_city?: string;
  status: string;
  events_today: number;
  last_seen?: string;
}

export default function SensorHealth() {
  const [sensors, setSensors] = useState<SensorData[]>([]);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await api.get("/sensors");
        setSensors(response.data);
      } catch (err) {
        console.error("Failed to fetch sensors", err);
      }
    };
    
    fetchSensors();
    const interval = setInterval(fetchSensors, 15000);
    return () => clearInterval(interval);
  }, []);

  if (sensors.length === 0) return null;

  return (
    <div className="panel" style={{ padding: 18, marginTop: 20 }}>
      <h2 className="section-title">Sensor Health</h2>
      <p className="section-subtitle">Authorized telemetry ingestion nodes</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
        {sensors.map(sensor => (
          <div key={sensor.sensor_uuid} style={{ background: "rgba(10, 18, 30, 0.4)", border: "1px solid #1a2d45", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong style={{ color: "#f0f6fc", fontSize: 14 }}>{sensor.name}</strong>
              <span style={{ 
                fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 12,
                background: sensor.status === "ONLINE" ? "rgba(59, 226, 165, 0.1)" : "rgba(255, 99, 116, 0.1)",
                color: sensor.status === "ONLINE" ? "#3be2a5" : "#ff6374"
              }}>
                {sensor.status}
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#8da5c4" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Location:</span>
                <span style={{ color: "#e2effc" }}>{sensor.location_city ? `${sensor.location_city}, ` : ""}{sensor.location_state}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Events Today:</span>
                <span style={{ color: "#e2effc", fontWeight: 700 }}>{sensor.events_today.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Last Heartbeat:</span>
                <span style={{ color: "#e2effc" }}>
                  {sensor.last_seen ? new Date(sensor.last_seen + "Z").toLocaleTimeString() : "Never"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
