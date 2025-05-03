import React, { useState, useEffect } from 'react';
import './App.css';
import FileSelector from './components/FileSelector';
import StatusPanel from './components/StatusPanel';
import DependencyGraph from './components/DependencyGraph';
import { fromEvent, Subject, Observable, of, EMPTY } from 'rxjs';
import { map, switchMap, catchError, tap, takeUntil, distinctUntilChanged } from 'rxjs/operators';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [projectPath, setProjectPath] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [stats, setStats] = useState({ filesAnalyzed: 0, dependenciesFound: 0 });
  const [error, setError] = useState(null);
  
  // Soggetti reattivi
  const analyze$ = new Subject();
  const cancel$ = new Subject();
  
  // Effetto per gestire l'analisi reattivamente
  useEffect(() => {
    // Variabile di riferimento per prevenire aggiornamenti di stato dopo lo smontaggio
    let isMounted = true;
    
    const subscription = analyze$.pipe(
      // Limita le emissioni a una sola per projectPath
      // (questo eviterà richieste ripetute)
      distinctUntilChanged(),
      tap(() => {
        if (isMounted) {
          setIsAnalyzing(true);
          setDependencies([]);
          setStats({ filesAnalyzed: 0, dependenciesFound: 0 });
          setError(null);
          console.log("Avvio analisi per:", projectPath);
        }
      }),
      switchMap(path => {
        return new Observable(observer => {
          console.log("Creazione nuovo EventSource per:", path);
          
          // Configura EventSource una sola volta per ogni path
          const eventSource = new EventSource(
            `${API_URL}/analyze?path=${encodeURIComponent(path)}`
          );
          
          // Quando arriva un messaggio dal server
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log("Evento ricevuto:", data.type);
              
              // Gestisci esplicitamente gli eventi di completamento
              if (data.type === 'complete') {
                console.log("Analisi completata, chiusura connessione");
                eventSource.close();
                observer.next(data); // Invia l'evento complete anche all'observer
                observer.complete();  // Completa l'observer
                return;
              }
              
              observer.next(data);
            } catch (err) {
              console.error("Errore parsing JSON:", err);
            }
          };
          
          // Gestione errori migliorata
          eventSource.onerror = (err) => {
            console.error("EventSource error:", err);
            eventSource.close();
            observer.error(new Error('Errore nella connessione al server'));
          };
          
          // Funzione di cleanup esplicita
          return () => {
            console.log("Cleanup: chiusura EventSource");
            eventSource.close();
          };
        }).pipe(
          takeUntil(cancel$) // Aggiungi qui il takeUntil
        );
      }),
      // Gestisce gli errori senza fermare lo stream principale
      catchError(err => {
        console.error("Stream error:", err);
        if (isMounted) {
          setError(err.message || 'Errore durante l\'analisi');
          setIsAnalyzing(false);
        }
        // Restituisci uno stream vuoto invece di propagare l'errore
        return EMPTY;
      })
    ).subscribe({
      next: (data) => {
        if (!data || !isMounted) return;
        
        if (data.type === 'dependency') {
          console.log(`Ricevuto file: ${data.data.fileName}, dipendenze: ${data.data.dependencies ? data.data.dependencies.length : 0}`);
          setDependencies(prev => [...prev, data.data]);
          setStats(data.stats);
        } else if (data.type === 'error') {
          setError(data.message);
          setIsAnalyzing(false);
        } else if (data.type === 'complete') {
          console.log("Ricevuto evento di completamento");
          if (isMounted) {
            setIsAnalyzing(false); 
          }
        }
      },
      error: (err) => {
        console.error("Subscription error:", err);
        if (isMounted) {
          setError(err.message || 'Errore imprevisto');
          setIsAnalyzing(false);
        }
      },
      complete: () => {
        console.log("Stream completato");
        if (isMounted) {
          setIsAnalyzing(false); // Importante: assicurati che questo venga eseguito
        }
      }
    });
    
    // Cleanup alla smontaggio del componente
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [projectPath]); // Dipendenza da projectPath
  
  // Funzione per avviare l'analisi
  const startAnalysis = () => {
    if (!projectPath || isAnalyzing) return;
    console.log("Avvio analisi");
    analyze$.next(projectPath);
  };
  
  // Funzione per interrompere l'analisi
  const stopAnalysis = () => {
    cancel$.next();
    setIsAnalyzing(false);
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
      
      <StatusPanel 
        stats={stats} 
        isAnalyzing={isAnalyzing} 
      />
      
      <DependencyGraph dependencies={dependencies} />
    </div>
  );
}

export default App;