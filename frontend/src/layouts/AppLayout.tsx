import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
export default function AppLayout() { return <div className="app-shell"><Sidebar /><main className="main-content"><Navbar /><Outlet /></main></div>; }