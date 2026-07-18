import { useState, useEffect } from "react";
import { FaGlobeAsia, FaSearch, FaCog, FaShieldAlt, FaSatelliteDish, FaFileAlt, FaBars, FaChevronLeft } from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Command Center", icon: FaSatelliteDish, shortcut: "D" },
  { to: "/threat-feed", label: "Threat Feed", icon: FaShieldAlt, shortcut: "T" },
  { to: "/india", label: "India View", icon: FaGlobeAsia, shortcut: "I" },
  { to: "/threat-map", label: "Threat Map", icon: FaGlobeAsia, shortcut: "M" },
  { to: "/ioc-search", label: "IOC Search", icon: FaSearch, shortcut: "S" },
  { to: "/reports", label: "Reports", icon: FaFileAlt, shortcut: "R" },
  { to: "/settings", label: "Settings", icon: FaCog, shortcut: "G" }
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && !collapsed) {
        onToggle();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside
      style={{
        position: "fixed",
        inset: "0 auto 0 0",
        width: collapsed ? 64 : 220,
        padding: collapsed ? "18px 8px" : "20px 12px",
        background: "#090f1b",
        borderRight: "1px solid #1e2c40",
        zIndex: 50,
        transition: "width 300ms ease, padding 300ms ease",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none" // Hide scrollbar for Firefox
      }}
    >
      {/* Header — Logo + Collapse Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0 0 12px" : "0 10px 12px",
          transition: "padding 300ms ease"
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", overflow: "hidden" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #fb8b32, #0ea5e9)",
              fontSize: 16,
              flexShrink: 0
            }}
          >
            ▣
          </div>
          {!collapsed && (
            <div style={{ whiteSpace: "nowrap" }}>
              <b style={{ letterSpacing: ".06em", fontSize: 14, color: "#ffffff" }}>ICTIP</b>
              <div className="muted" style={{ fontSize: 9, letterSpacing: ".12em", marginTop: 2 }}>
                THREAT MONITOR
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className="btn-ghost"
          style={{
            background: "none",
            border: "none",
            color: "#6a7b95",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: collapsed ? "none" : "flex",
            alignItems: "center",
            transition: "color 150ms ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#bfe4ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6a7b95")}
          title="Collapse sidebar"
        >
          <FaChevronLeft size={12} />
        </button>
      </div>

      {/* Expand button (visible when collapsed) */}
      {collapsed && (
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            color: "#6a7b95",
            cursor: "pointer",
            padding: "8px 0",
            marginBottom: 12,
            display: "flex",
            justifyContent: "center",
            transition: "color 150ms ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#bfe4ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6a7b95")}
          title="Expand sidebar"
        >
          <FaBars size={14} />
        </button>
      )}

      {/* Section Label */}
      {!collapsed && (
        <div
          className="sidebar-section-label"
          style={{
            padding: "0 10px 6px",
            fontSize: 9,
            color: "#55c5ff",
            letterSpacing: ".14em",
            fontWeight: 700,
            textTransform: "uppercase"
          }}
        >
          Operations
        </div>
      )}

      {/* Navigation Items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {nav.map(({ to, label, icon: Icon }, idx) => {
          const isActive = location.pathname === to;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={to}
              className="tooltip-wrapper"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ position: "relative" }}
            >
              <NavLink
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "10px 0" : "7px 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 8,
                  color: isActive ? "#dff3ff" : isHovered ? "#bfe4ff" : "#77869c",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(22, 123, 184, 0.2) 0%, rgba(22, 123, 184, 0.05) 100%)"
                    : isHovered
                    ? "rgba(255, 255, 255, 0.03)"
                    : "transparent",
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: isActive ? 650 : 500,
                  transition: "all 150ms ease",
                  borderLeft: isActive ? "3px solid #167bb8" : "3px solid transparent",
                  position: "relative"
                }}
              >
                <Icon
                  size={collapsed ? 18 : 16}
                  style={{
                    flexShrink: 0,
                    filter: isActive ? "drop-shadow(0 0 6px rgba(22, 123, 184, 0.6))" : "none",
                    transition: "filter 150ms ease"
                  }}
                />
                {!collapsed && (
                  <span className="sidebar-label" style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                    {label}
                  </span>
                )}
              </NavLink>

              {/* Tooltip (only when collapsed) */}
              {collapsed && isHovered && (
                <div
                  style={{
                    position: "absolute",
                    left: "calc(100% + 10px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#1a2d45",
                    color: "#e2effc",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    zIndex: 1000,
                    border: "1px solid #2a4060",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
                    pointerEvents: "none"
                  }}
                >
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* System Status Card */}
      {!collapsed && (
        <div
          className="sidebar-status"
          style={{
            padding: 10,
            border: "1px solid #24405a",
            borderRadius: 10,
            background: "#0c1929",
            marginTop: 10,
            marginBottom: 10
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#64dcb1", fontSize: 11, fontWeight: 700 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#50d7a9",
                boxShadow: "0 0 10px #50d7a9",
                animation: "pulse-dot 2s infinite"
              }}
            />
            SYSTEM ACTIVE
          </div>
          <div className="muted" style={{ fontSize: 10, marginTop: 7 }}>
            All feeds are running in active telemetry.
          </div>
        </div>
      )}

      {/* Collapsed status dot */}
      {collapsed && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <span
            title="System active"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#50d7a9",
              boxShadow: "0 0 10px #50d7a9",
              animation: "pulse-dot 2s infinite"
            }}
          />
        </div>
      )}
    </aside>
  );
}