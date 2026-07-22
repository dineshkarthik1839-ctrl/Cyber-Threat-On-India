import React, { useState, useEffect } from 'react';
import { ThreatGlobe } from '../Globe/ThreatGlobe';
import { ThreatList } from '../ThreatList';
import { ThreatStats } from '../ThreatStats';
import { useThreatData } from '../../hooks/useThreatData';
import { SearchBar } from '../Search/SearchBar';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { threats, loading, error } = useThreatData();
  const [selectedThreat, setSelectedThreat] = useState(null);

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
