import React, { useState, useEffect } from 'react';
import './App.css';
import FileSelector from './components/FileSelector';
import StatusPanel from './components/StatusPanel';
import DependencyGraph from './components/DependencyGraph';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [projectPath, setProjectPath] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [stats, setStats] = useState({ filesAnalyzed: 0, dependenciesFound: 0 });
  const [error, setError] = useState(null);

  const startAnalysis = async () => {
    if (!projectPath) return;
    
    // Reset state
    setIsAnalyzing(true);
    setDependencies([]);
    setStats({ filesAnalyzed: 0, dependenciesFound: 0 });
    setError(null);
    
    try {
      console.log("Avvio analisi per:", projectPath);
      
      // Imposta la fonte dell'evento per lo streaming
      const eventSource = new EventSource(`http://localhost:5000/api/analyze?path=${encodeURIComponent(projectPath)}`);
      
      eventSource.onmessage = (event) => {
        console.log("Received event:", event.data);
        const data = JSON.parse(event.data);
        
        if (data.type === 'dependency') {
          setDependencies(prev => [...prev, data.data]);
          setStats(data.stats);
        } else if (data.type === 'error') {
          setError(data.message);
          setIsAnalyzing(false);
          eventSource.close();
        } else if (data.type === 'complete') {
          setIsAnalyzing(false);
          setStats(data.stats);
          eventSource.close();
        }
      };
      
      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        setError('Errore nella connessione al server');
        setIsAnalyzing(false);
        eventSource.close();
      };
      
      return () => {
        eventSource.close();
      };
    } catch (err) {
      console.error("Error in analysis:", err);
      setError(err.message || 'Errore durante l\'avvio dell\'analisi');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Dependency Analyser</h1>
      
      <FileSelector 
        onPathSelected={setProjectPath} 
        selectedPath={projectPath}
      />
      
      <div className="controls">
        <button 
          onClick={startAnalysis} 
          disabled={!projectPath || isAnalyzing}
          className="analyze-button"
        >
          {isAnalyzing ? 'Analisi in corso...' : 'Avvia Analisi'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          Errore: {error}
        </div>
      )}
      
      <StatusPanel 
        stats={stats} 
        isAnalyzing={isAnalyzing} 
      />
      
      <DependencyGraph dependencies={dependencies} />
    </div>
  );
}

export default App;