import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Threat } from "../types/threat";
import ThreatDetailsDrawer from "../components/dashboard/ThreatDetailsDrawer";

interface ThreatDetailsContextType {
  selectedThreat: Threat | null;
  openDrawer: (threat: Threat) => void;
  closeDrawer: () => void;
}

const ThreatDetailsContext = createContext<ThreatDetailsContextType | undefined>(undefined);

export function ThreatDetailsProvider({ children }: { children: ReactNode }) {
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

  const openDrawer = (threat: Threat) => {
    setSelectedThreat(threat);
  };

  const closeDrawer = () => {
    setSelectedThreat(null);
  };

  return (
    <ThreatDetailsContext.Provider value={{ selectedThreat, openDrawer, closeDrawer }}>
      {children}
      <ThreatDetailsDrawer threat={selectedThreat} onClose={closeDrawer} />
    </ThreatDetailsContext.Provider>
  );
}

export function useThreatDetails() {
  const context = useContext(ThreatDetailsContext);
  if (context === undefined) {
    throw new Error("useThreatDetails must be used within a ThreatDetailsProvider");
  }
  return context;
}
