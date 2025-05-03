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

// Aggiungi un endpoint GET per supportare EventSource nel client
app.get('/api/analyze', (req, res) => {
  const directoryPath = req.query.path;
  console.log(`Ricevuta richiesta GET di analisi per: ${directoryPath}`);
  
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
  
  // Aggiungi heartbeat per mantenere la connessione attiva
  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded) {
      res.write(":heartbeat\n\n");
    }
  }, 10000); // ogni 10 secondi
  
  // Variabile per tracciare la subscritpion
  let subscription;
  
  try {
    // Aggiungi anche un log all'inizio dell'analisi
    console.log(`Avvio analisi per directory: ${directoryPath}`);
    console.log(`Timestamp inizio: ${new Date().toISOString()}`);
    
    // Avvia l'analisi reattiva
    subscription = analyzeProject(directoryPath).subscribe({
      next: (dependency) => {
        // Aggiorna le statistiche
        stats.filesAnalyzed++;
        stats.dependenciesFound += (dependency.dependencies?.length || 0);
        
        // Log dettagliato di ciò che viene inviato
        console.log(`Invio file: ${dependency.fileName}`);
        console.log(`  - Package: ${dependency.packageName || 'N/A'}`);
        console.log(`  - Dipendenze: ${dependency.dependencies?.length || 0}`);
        if (dependency.dependencies && dependency.dependencies.length > 0) {
          console.log(`  - Elenco dipendenze: ${dependency.dependencies.join(', ')}`);
        }
        
        // Invia l'aggiornamento come evento SSE
        res.write(`data: ${JSON.stringify({ 
          type: 'dependency', 
          data: dependency,
          stats: { ...stats }
        })}\n\n`);
      },
      error: (err) => {
        console.error('Errore durante l\'analisi:', err);
        console.log(`Invio errore al client: ${err.message}`);
        
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: err.message 
        })}\n\n`);
        res.end();
      },
      complete: () => {
        console.log('Analisi completata');
        console.log(`Totale file analizzati: ${stats.filesAnalyzed}`);
        console.log(`Totale dipendenze trovate: ${stats.dependenciesFound}`);
        console.log('Invio messaggio di completamento al client');
        
        res.write(`data: ${JSON.stringify({ 
          type: 'complete',
          stats: { ...stats },
          message: 'Analisi completata con successo'
        })}\n\n`);
        
        // Aggiungi un piccolo ritardo prima di chiudere la connessione
        setTimeout(() => {
          console.log('Chiusura connessione SSE');
          res.end();
        }, 200);
      }
    });
    
    // Gestisci chiusura connessione
    req.on('close', () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('Analisi interrotta: connessione client chiusa');
      }
      clearInterval(heartbeatInterval);
    });
    
  } catch (error) {
    clearInterval(heartbeatInterval);
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