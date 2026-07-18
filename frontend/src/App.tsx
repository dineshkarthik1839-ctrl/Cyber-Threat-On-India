import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import IndiaView from "./pages/IndiaView";
import IocSearch from "./pages/IocSearch";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import ThreatFeed from "./pages/ThreatFeed";
import Reports from "./pages/Reports";
import ThreatMapPage from "./pages/ThreatMapPage";
import InvestigationView from "./pages/InvestigationView";
import { ThreatDetailsProvider } from "./contexts/ThreatDetailsContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

export default function App() {
  return (
    <ThreatDetailsProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/threat-feed" element={<ThreatFeed />} />
          <Route path="/india" element={<IndiaView />} />
          <Route path="/ioc-search" element={<IocSearch />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/threat-map" element={<ThreatMapPage />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/investigation/:eventId" element={<ProtectedRoute><InvestigationView /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThreatDetailsProvider>
  );
}