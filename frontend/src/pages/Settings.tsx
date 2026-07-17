import { useEffect, useState } from "react";
import { getCollectorSettings, updateCollectorSettings, type CollectorSettings } from "../services/settingsService";
import { FaCog, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { CardSkeleton } from "../components/common/SkeletonLoader";

export default function Settings() {
  const [settings, setSettings] = useState<CollectorSettings>({
    abuseipdb_enabled: true,
    otx_enabled: true,
    threatfox_enabled: true,
    urlhaus_enabled: true,
    cisa_enabled: true,
    abuseipdb_key: "",
    otx_key: "",
    poll_interval_minutes: 10,
    simulation_mode: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getCollectorSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed loading settings", err);
        setStatusMessage({ text: "Failed loading settings from backend API.", error: true });
      } finally {
        setIsLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await updateCollectorSettings(settings);
      setStatusMessage({ text: "Configurations saved successfully. Scheduler restarted.", error: false });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: "Error saving configurations to server.", error: true });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleField = (key: keyof Omit<CollectorSettings, "poll_interval_minutes" | "abuseipdb_key" | "otx_key">) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (isLoading) {
    return (
      <div className="page page-enter">
        <h1 style={{ fontSize: 25, color: "#f8fafc", marginBottom: 20 }}>Settings</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div className="eyebrow">Platform Administration</div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, color: "#f8fafc" }}>
        Settings
      </h1>
      <p className="muted" style={{ fontSize: 12, color: "#6a7b95", marginBottom: 20 }}>
        Manage live intelligence feeds, API credentials, collection cron schedules, and simulation maps.
      </p>

      {statusMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            background: statusMessage.error ? "rgba(255,99,116,0.08)" : "rgba(80,215,169,0.08)",
            border: statusMessage.error ? "1px solid #ff637488" : "1px solid #50d7a988",
            color: statusMessage.error ? "#ff6374" : "#50d7a9",
            fontSize: 12,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fadeInUp 0.3s ease"
          }}
        >
          {statusMessage.error ? <FaExclamationTriangle /> : <FaCheckCircle />}
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Intelligence Sources */}
          <div className="panel" style={{ padding: 22 }}>
            <h2 className="section-title">Threat Intelligence Feeds</h2>
            <p className="section-subtitle" style={{ marginBottom: 20 }}>Toggle active threat indicators collection modules</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "abuseipdb_enabled", name: "AbuseIPDB Feed", desc: "Ingest reported malicious attacking IP addresses (API Key Required)." },
                { key: "otx_enabled", name: "AlienVault OTX Feed", desc: "Ingest public community threat pulse indicators." },
                { key: "threatfox_enabled", name: "ThreatFox Feed (abuse.ch)", desc: "Ingest structured malware hashes, domains, and IP tags (Free API)." },
                { key: "urlhaus_enabled", name: "URLHaus Feed (abuse.ch)", desc: "Ingest active malware download hosting locations (Free API)." },
                { key: "cisa_enabled", name: "CISA KEV Catalog", desc: "Ingest Known Exploited Vulnerability listings (Free API)." }
              ].map((feed) => (
                <div
                  key={feed.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #142032",
                    paddingBottom: 12
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 650, color: "#e2effc" }}>{feed.name}</span>
                    <p style={{ fontSize: 10, color: "#6a7b95", margin: "4px 0 0" }}>{feed.desc}</p>
                  </div>
                  <div
                    onClick={() => toggleField(feed.key as any)}
                    style={{
                      width: 44,
                      height: 24,
                      background: !!settings[feed.key as keyof CollectorSettings] ? "#50d7a9" : "#1a2a3e",
                      borderRadius: 12,
                      position: "relative",
                      cursor: "pointer",
                      transition: "background 0.3s",
                      boxShadow: !!settings[feed.key as keyof CollectorSettings] ? "0 0 10px rgba(80, 215, 169, 0.3)" : "none"
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: !!settings[feed.key as keyof CollectorSettings] ? 22 : 2,
                        width: 20,
                        height: 20,
                        background: "#fff",
                        borderRadius: "50%",
                        transition: "left 0.3s, transform 0.2s",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Keys Configuration */}
          <div className="panel" style={{ padding: 22 }}>
            <h2 className="section-title">API Gateways Credentials</h2>
            <p className="section-subtitle" style={{ marginBottom: 20 }}>Configure credentials for commercial intelligence feeds</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#8190a6", display: "block", marginBottom: 7, fontWeight: 650 }}>
                  ABUSEIPDB API KEY
                </label>
                <input
                  className="field"
                  type="password"
                  value={settings.abuseipdb_key || ""}
                  onChange={(e) => setSettings((p) => ({ ...p, abuseipdb_key: e.target.value }))}
                  placeholder="Paste AbuseIPDB client key..."
                  style={{
                    background: "rgba(5, 9, 16, 0.6)",
                    borderColor: "#192e47",
                    padding: "12px 16px",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#8190a6", display: "block", marginBottom: 7, fontWeight: 650 }}>
                  ALIENVAULT OTX KEY
                </label>
                <input
                  className="field"
                  type="password"
                  value={settings.otx_key || ""}
                  onChange={(e) => setSettings((p) => ({ ...p, otx_key: e.target.value }))}
                  placeholder="Paste OTX developer token..."
                  style={{
                    background: "rgba(5, 9, 16, 0.6)",
                    borderColor: "#192e47",
                    padding: "12px 16px",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Polling Schedules & Simulation Switches */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel" style={{ padding: 22 }}>
            <h2 className="section-title">Scheduler Controls</h2>
            <p className="section-subtitle" style={{ marginBottom: 20 }}>Engine configurations</p>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#8190a6", display: "block", marginBottom: 7, fontWeight: 650 }}>
                FEED REFRESH INTERVAL (MINUTES)
              </label>
              <input
                className="field"
                type="number"
                min={2}
                max={120}
                required
                value={settings.poll_interval_minutes}
                onChange={(e) => setSettings((p) => ({ ...p, poll_interval_minutes: parseInt(e.target.value) || 10 }))}
                style={{ fontFamily: "monospace", background: "rgba(5, 9, 16, 0.6)", borderColor: "#192e47", padding: "12px 16px" }}
              />
              <span style={{ fontSize: 9, color: "#6a7b95", display: "block", marginTop: 6 }}>
                Frequencies below 5m may exceed external rate limits.
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#080e1a",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #17273b"
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 650, color: "#fb8b32" }}>SIMULATOR MODE</span>
                <p style={{ fontSize: 9, color: "#6a7b95", margin: "2px 0 0" }}>Generate simulated live attack paths</p>
              </div>
              <div
                onClick={() => toggleField("simulation_mode")}
                style={{
                  width: 44,
                  height: 24,
                  background: settings.simulation_mode ? "#0ea5e9" : "#1a2a3e",
                  borderRadius: 12,
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.3s",
                  boxShadow: settings.simulation_mode ? "0 0 10px rgba(14, 165, 233, 0.3)" : "none"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: settings.simulation_mode ? 22 : 2,
                    width: 20,
                    height: 20,
                    background: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.3s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }}
                />
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isSaving}
            style={{ width: "100%", height: 50, fontSize: 14, fontWeight: 800, animation: isSaving ? "none" : "pulse-dot 2s infinite" }}
          >
            <FaCog className={isSaving ? "spin" : ""} style={{ animation: isSaving ? "spin 1s linear infinite" : undefined }} />
            {isSaving ? "RESTARTING WORKERS..." : "SAVE CONFIGURATIONS"}
          </button>
        </div>
      </form>
    </div>
  );
}