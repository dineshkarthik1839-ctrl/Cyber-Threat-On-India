import React, { useState } from 'react';
import { ThreatGlobe } from '../Globe/ThreatGlobe';
import { ThreatList } from '../ThreatList';
import { ThreatStats } from '../ThreatStats';
import { useThreatData } from '../../hooks/useThreatData';
import { SearchBar } from '../Search/SearchBar';
import type { Threat } from '../../types/threat';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { threats } = useThreatData();
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🌍 Cyber Threat Intelligence Dashboard</h1>
        <SearchBar onSearch={(query) => console.log('Search:', query)} />
      </header>
      
      <div className="dashboard-grid">
        {/* Globe takes 60% of screen */}
        <div className="globe-section">
          <ThreatGlobe 
            threats={threats}
            onThreatClick={setSelectedThreat}
            autoRotate={true}
            height="70vh"
          />
        </div>
        
        {/* Side panel takes 40% */}
        <div className="side-panel">
          <ThreatStats threats={threats} />
          <ThreatList 
            threats={threats}
            onSelect={setSelectedThreat}
            selectedId={selectedThreat?.id}
          />
        </div>
      </div>
    </div>
  );
};
