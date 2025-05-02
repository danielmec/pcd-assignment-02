const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { analyzeProject } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Variabili globali per le statistiche
let stats = {
  filesAnalyzed: 0,
  dependenciesFound: 0
};

// Endpoint per avviare l'analisi
app.post('/api/analyze', (req, res) => {
  const { directoryPath } = req.body;
  
  if (!directoryPath) {
    return res.status(400).json({ error: 'Percorso directory richiesto' });
  }
  
  if (!fs.existsSync(directoryPath)) {
    return res.status(400).json({ error: 'Directory non esistente' });
  }
  
  // Resetta le statistiche
  stats = {
    filesAnalyzed: 0,
    dependenciesFound: 0
  };
  
  // Configura risposta per SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Variabile per tracciare la subscritpion
  let subscription;
  
  try {
    // Avvia l'analisi reattiva
    subscription = analyzeProject(directoryPath).subscribe({
      next: (dependency) => {
        // Aggiorna le statistiche
        stats.filesAnalyzed++;
        stats.dependenciesFound += (dependency.dependencies?.length || 0);
        
        // Invia l'aggiornamento come evento SSE
        res.write(`data: ${JSON.stringify({ 
          type: 'dependency', 
          data: dependency,
          stats: { ...stats }
        })}\n\n`);
      },
      error: (err) => {
        console.error('Errore durante l\'analisi:', err);
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: err.message 
        })}\n\n`);
        res.end();
      },
      complete: () => {
        console.log('Analisi completata');
        res.write(`data: ${JSON.stringify({ 
          type: 'complete',
          stats: { ...stats }
        })}\n\n`);
        res.end();
      }
    });
    
    // Gestisci chiusura connessione
    req.on('close', () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('Analisi interrotta: connessione client chiusa');
      }
    });
    
  } catch (error) {
    console.error('Errore nell\'avvio dell\'analisi:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error.message 
    })}\n\n`);
    res.end();
  }
});

// Aggiungi un endpoint GET per supportare EventSource nel client
app.get('/api/analyze', (req, res) => {
  const directoryPath = req.query.path;
  console.log(`Ricevuta richiesta di analisi per: ${directoryPath}`);
  
  if (!directoryPath) {
    return res.status(400).json({ error: 'Percorso directory richiesto' });
  }
  
  if (!fs.existsSync(directoryPath)) {
    return res.status(400).json({ error: 'Directory non esistente' });
  }
  
  // Resetta le statistiche
  stats = {
    filesAnalyzed: 0,
    dependenciesFound: 0
  };
  
  // Configura risposta per SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Variabile per tracciare la subscritpion
  let subscription;
  
  try {
    // Avvia l'analisi reattiva
    subscription = analyzeProject(directoryPath).subscribe({
      next: (dependency) => {
        // Aggiorna le statistiche
        stats.filesAnalyzed++;
        stats.dependenciesFound += (dependency.dependencies?.length || 0);
        
        // Invia l'aggiornamento come evento SSE
        res.write(`data: ${JSON.stringify({ 
          type: 'dependency', 
          data: dependency,
          stats: { ...stats }
        })}\n\n`);
      },
      error: (err) => {
        console.error('Errore durante l\'analisi:', err);
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: err.message 
        })}\n\n`);
        res.end();
      },
      complete: () => {
        console.log('Analisi completata');
        res.write(`data: ${JSON.stringify({ 
          type: 'complete',
          stats: { ...stats }
        })}\n\n`);
        res.end();
      }
    });
    
    // Gestisci chiusura connessione
    req.on('close', () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('Analisi interrotta: connessione client chiusa');
      }
    });
    
  } catch (error) {
    console.error('Errore nell\'avvio dell\'analisi:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error.message 
    })}\n\n`);
    res.end();
  }
});

// Endpoint per ottenere le statistiche attuali
app.get('/api/stats', (req, res) => {
  res.json(stats);
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});