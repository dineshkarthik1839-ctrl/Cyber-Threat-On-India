import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { ThreatDetailsProvider } from "./contexts/ThreatDetailsContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const IndiaView = lazy(() => import("./pages/IndiaView"));
const IocSearch = lazy(() => import("./pages/IocSearch"));
const Login = lazy(() => import("./pages/Login"));
const Settings = lazy(() => import("./pages/Settings"));
const ThreatFeed = lazy(() => import("./pages/ThreatFeed"));
const Reports = lazy(() => import("./pages/Reports"));
const ThreatMapPage = lazy(() => import("./pages/ThreatMapPage"));
const InvestigationView = lazy(() => import("./pages/InvestigationView"));
const WebsiteAnalyzer = lazy(() => import("./pages/WebsiteAnalyzer"));

// Global fallback loader
const GlobalLoader = () => (
  <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#050e18", color: "#8da5c4", gap: 20 }}>
    <div style={{ width: 50, height: 50, border: "3px solid rgba(26, 141, 208, 0.2)", borderTopColor: "#1a8dd0", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    <div style={{ fontSize: 14, letterSpacing: 2, fontWeight: 700, color: "#e2effc" }}>ICTIP SYSTEM INITIALIZING...</div>
    <div style={{ fontSize: 11, color: "#6a7b95" }}>Establishing secure connection to National Command Center</div>
  </div>
);

export default function App() {
  return (
    <ThreatDetailsProvider>
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/threat-feed" element={<ThreatFeed />} />
            <Route path="/india" element={<IndiaView />} />
            <Route path="/ioc-search" element={<IocSearch />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/threat-map" element={<ThreatMapPage />} />
            <Route path="/analyze" element={<ProtectedRoute><WebsiteAnalyzer /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/investigation/:eventId" element={<ProtectedRoute><InvestigationView /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ThreatDetailsProvider>
  );
}
// Force rebuild comment