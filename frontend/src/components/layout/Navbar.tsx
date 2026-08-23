import { useState, useEffect } from "react";
import { FaBell, FaSignOutAlt, FaBars } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { getSessionUser, logoutAnalyst } from "../../services/authService";

export default function Navbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { email, role } = getSessionUser();
  const isLoggedIn = !!email;
  const initials = email ? email.substring(0, 2).toUpperCase() : "G";
  const displayName = email ? email.split("@")[0] : "Guest Viewer";
  const displayRole = role || "Public Access";
  const location = useLocation();

  // Live clock
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = clock.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" });
  const dateStr = clock.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  const getPageTitle = (path: string) => {
    if (path.includes("dashboard")) return "Command Center";
    if (path.includes("threat-feed")) return "Threat Feed";
    if (path.includes("india")) return "India View";
    if (path.includes("ioc-search")) return "IOC Search";
    if (path.includes("reports")) return "Intelligence Reports";
    if (path.includes("settings")) return "Settings";
    return "Dashboard";
  };
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header
      style={{
        height: 72,
        borderBottom: "1px solid #1e2c40",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
        background: "#080e19cc",
        backdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button 
          className="btn-ghost hide-on-desktop" 
          onClick={onMenuToggle}
          style={{ padding: 0, marginRight: 8 }}
        >
          <FaBars size={20} color="#e2effc" />
        </button>
        <div>
          <div className="eyebrow hide-on-mobile" style={{ fontSize: 9 }}>India Cyber Threat Intelligence Platform</div>
          <div className="eyebrow hide-on-desktop" style={{ fontSize: 9 }}>ICTIP</div>
        <div style={{ fontSize: 12, color: "#aab8c9", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#8190a6" }}>ICTIP</span>
          <span style={{ color: "#485b73", fontSize: 10 }}>/</span>
          <span style={{ color: "#e2effc", fontWeight: 650 }}>{pageTitle}</span>
          <span style={{ color: "#ff6374", marginLeft: 8, fontSize: 9, fontWeight: 700, padding: "3px 8px", background: "#ff637416", borderRadius: 4, letterSpacing: ".05em" }}>
            ELEVATED POSTURE
          </span>
        </div>
      </div>
      </div>

      {/* Live IST Clock */}
      <div className="hide-on-mobile" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#36d8a5", letterSpacing: "0.08em" }}>
          {timeStr}
        </div>
        <div style={{ fontSize: 9, color: "#6a7b95", letterSpacing: "0.06em" }}>
          {dateStr} IST
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", marginRight: 8, cursor: "pointer" }} title="Notifications">
          <FaBell size={18} color="#9bacc0" />
          <span style={{ position: "absolute", right: -3, top: -4, width: 8, height: 8, borderRadius: "50%", background: "#ff6576", border: "2px solid #080e19" }} />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderLeft: "1px solid #26364d", paddingLeft: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #1b4b6b, #153852)",
              color: "#e2effc",
              fontSize: 11,
              fontWeight: 700,
              border: "1px solid #26597c"
            }}
          >
            {initials}
          </div>
          <div className="hide-on-mobile">
            <div style={{ fontSize: 12, fontWeight: 650, color: "#e2effc" }}>{displayName}</div>
            <div style={{ fontSize: 9, color: "#8190a6", textTransform: "uppercase" }}>{displayRole}</div>
          </div>
        </div>

        {isLoggedIn && (
          <button
            onClick={logoutAnalyst}
            title="Sign out securely"
            className="btn-ghost"
            style={{ marginLeft: 4, color: "#8190a6" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6374")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8190a6")}
          >
            <FaSignOutAlt size={16} />
          </button>
        )}
      </div>
    </header>
  );
}