import React from 'react';
import type { Threat } from '../types/threat';

interface ThreatListProps {
  threats: Threat[];
  onSelect: (threat: Threat) => void;
  selectedId?: string;
}

export const ThreatList: React.FC<ThreatListProps> = ({ threats, onSelect, selectedId }) => {
  return (
    <div className="threat-list">
      <h3>Active Threats</h3>
      {threats.slice(0, 10).map((threat, idx) => (
        <div 
          key={threat.id || idx}
          onClick={() => onSelect(threat)}
          style={{ 
            padding: '10px', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            background: selectedId === threat.id ? 'rgba(255,255,255,0.1)' : 'transparent'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{threat.sourceIp || 'Unknown'}</strong>
            <span style={{ color: threat.severity === 'Critical' ? '#ff4444' : '#ffaa00' }}>
              {threat.severity}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>{threat.attackType || 'Unknown Type'}</div>
        </div>
      ))}
    </div>
  );
};
