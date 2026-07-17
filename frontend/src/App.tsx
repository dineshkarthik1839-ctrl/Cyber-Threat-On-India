import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import IndiaView from "./pages/IndiaView";
import IocSearch from "./pages/IocSearch";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import ThreatFeed from "./pages/ThreatFeed";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/threat-feed" element={<ThreatFeed />} />
        <Route path="/india" element={<IndiaView />} />
        <Route path="/ioc-search" element={<IocSearch />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}