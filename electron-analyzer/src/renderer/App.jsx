// Usa gli oggetti globali React invece degli import ES6
const { useState, useEffect } = React;

// Definizione del componente App
function App() {
  const [projectPath, setProjectPath] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [stats, setStats] = useState({ filesAnalyzed: 0, dependenciesFound: 0 });
  const [error, setError] = useState(null);
  
  // Configurazione degli eventi di comunicazione con il processo principale
  useEffect(() => {
    // Variabile di riferimento per prevenire aggiornamenti dopo lo smontaggio
    let isMounted = true;
    
    // Configura listener per gli eventi IPC
    window.electron.onDependencyUpdate((data) => {
      if (!isMounted) return;
      
      if (data.type === 'dependency') {
        console.log(`Ricevuto file: ${data.data.fileName}, dipendenze: ${data.data.dependencies ? data.data.dependencies.length : 0}`);
        setDependencies(prev => [...prev, data.data]);
        setStats(data.stats);
      }
    });
    
    window.electron.onDependencyError((data) => {
      if (!isMounted) return;
      setError(data.message);
      setIsAnalyzing(false);
    });
    
    window.electron.onDependencyComplete((data) => {
      if (!isMounted) return;
      console.log("Analisi completata:", data);
      setIsAnalyzing(false);
    });
    
    // Cleanup alla smontaggio del componente
    return () => {
      isMounted = false;
      window.electron.removeAllListeners();
    };
  }, []); 
  
  // Funzione per avviare l'analisi
  const startAnalysis = async () => {
    if (!projectPath || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setDependencies([]);
    setStats({ filesAnalyzed: 0, dependenciesFound: 0 });
    setError(null);
    console.log("Avvio analisi per:", projectPath);
    
    try {
      await window.electron.analyzeProject(projectPath);
    } catch (error) {
      console.error("Errore nell'avvio dell'analisi:", error);
      setError(error.message || "Errore durante l'analisi");
      setIsAnalyzing(false);
    }
  };
  
  // Funzione per interrompere l'analisi
  const stopAnalysis = async () => {
    try {
      const cancelled = await window.electron.cancelAnalysis();
      if (cancelled) {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Errore nell'interruzione:", error);
    }
  };

  // Funzione per gestire la selezione del percorso
  const handlePathSelected = (path) => {
    setProjectPath(path);
  };

  return (
    <div className="app-container">
      <h1>Dependency Analyzer</h1>
      
      {/* Usa il componente FileSelector esterno */}
      <FileSelector 
        onPathSelected={handlePathSelected}
        selectedPath={projectPath}
        isDisabled={isAnalyzing}
      />
      
      <div className="controls">
        <button 
          onClick={startAnalysis} 
          disabled={!projectPath || isAnalyzing}
          className="analyze-button"
        >
          {isAnalyzing ? 'Analisi in corso...' : 'Avvia Analisi'}
        </button>
        
        {isAnalyzing && (
          <button 
            onClick={stopAnalysis}
            className="cancel-button"
          >
            Interrompi
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          Errore: {error}
        </div>
      )}
      
      {/* StatusPanel component */}
      <StatusPanel 
        stats={stats} 
        isAnalyzing={isAnalyzing} 
      />
      
      {/* DependencyGraph component */}
      <div className="graph-container" id="dependency-graph">
        <h2>Grafo delle dipendenze</h2>
        {dependencies.length === 0 ? (
          <p>Nessuna dipendenza trovata. Avvia un'analisi.</p>
        ) : (
          <DependencyGraph dependencies={dependencies} />
        )}
      </div>
    </div>
  );
}

// Rendering dell'app
ReactDOM.createRoot(document.getElementById('root')).render(<App />);