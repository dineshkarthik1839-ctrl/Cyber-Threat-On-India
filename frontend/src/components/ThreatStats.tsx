import React from 'react';
import { Threat } from '../types';

export const ThreatStats: React.FC<{ threats: Threat[] }> = ({ threats }) => {
  const critical = threats.filter(t => t.severity === 'Critical').length;
  const high = threats.filter(t => t.severity === 'High').length;

  return (
    <div className="threat-stats">
      <h3>Live Statistics</h3>
      <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
        <div>
          <div style={{ fontSize: '24px', color: '#ff4444', fontWeight: 'bold' }}>{critical}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Critical Events</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', color: '#ffaa00', fontWeight: 'bold' }}>{high}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>High Severity</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', color: '#5ac2f0', fontWeight: 'bold' }}>{threats.length}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Total Tracked</div>
        </div>
      </div>
    </div>
  );
};
