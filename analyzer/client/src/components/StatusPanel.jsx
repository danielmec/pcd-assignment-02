import React from 'react';

const StatusPanel = ({ stats, isAnalyzing }) => {
  return (
    <div className="status-panel">
      <div className="status-header">
        <span className={`status-badge ${isAnalyzing ? 'active' : 'idle'}`}>
          {isAnalyzing ? 'Analisi in corso...' : 'In attesa'}
        </span>
      </div>
      
      <div className="stats-container">
        <div className="stat-box">
          <h3>File analizzati</h3>
          <div className="stat-value">{stats.filesAnalyzed}</div>
        </div>
        
        <div className="stat-box">
          <h3>Dipendenze trovate</h3>
          <div className="stat-value">{stats.dependenciesFound}</div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;