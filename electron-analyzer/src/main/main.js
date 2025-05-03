const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { analyzeProject } = require('./analyzer');

// Mantieni un riferimento globale all'oggetto window
let mainWindow;
let analyzerSubscription = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    }
  });

  // Carica l'UI: in sviluppo carica un URL, altrimenti un file HTML locale
  const isDev = process.argv.includes('--dev');
  
  const startUrl = isDev 
    ? 'http://localhost:3000' // Se stai usando React con dev server
    : `file://${path.join(__dirname, '../renderer/index.html')}`;
  
  // Sempre aprire DevTools per debug
  mainWindow.webContents.openDevTools();
  
  // Aggiungi log per tracciare il caricamento
  console.log(`Caricamento URL: ${startUrl}`);
  
  mainWindow.loadURL(startUrl);
  
  // Aggiungi listener per gli errori di caricamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Errore di caricamento: ${errorDescription} (${errorCode})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Gestione IPC (Inter-Process Communication)

// Dialog per selezionare cartella
ipcMain.handle('open-directory-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleziona directory del progetto Java'
  });
  return result;
});

// Avvio analisi progetto
ipcMain.handle('analyze-project', async (event, directoryPath) => {
  try {
    console.log(`Avvio analisi per directory: ${directoryPath}`);
    
    const stats = {
      filesAnalyzed: 0,
      dependenciesFound: 0
    };
    
    // Cancella eventuali analisi precedenti
    if (analyzerSubscription) {
      analyzerSubscription.unsubscribe();
      analyzerSubscription = null;
    }
    
    // Restituisce una Promise che si risolve quando l'analisi è completa
    return new Promise((resolve, reject) => {
      analyzerSubscription = analyzeProject(directoryPath).subscribe({
        next: (dependency) => {
          // Aggiorna statistiche
          stats.filesAnalyzed++;
          stats.dependenciesFound += (dependency.dependencies?.length || 0);
          
          // Invia i dati al renderer
          mainWindow.webContents.send('dependency-update', {
            type: 'dependency',
            data: dependency,
            stats
          });
        },
        error: (err) => {
          console.error('Errore durante l\'analisi:', err);
          mainWindow.webContents.send('dependency-error', {
            type: 'error',
            message: err.message
          });
          reject(err);
        },
        complete: () => {
          console.log('Analisi completata');
          console.log(`Totale file analizzati: ${stats.filesAnalyzed}`);
          console.log(`Totale dipendenze trovate: ${stats.dependenciesFound}`);
          
          mainWindow.webContents.send('dependency-complete', {
            type: 'complete',
            stats,
            message: 'Analisi completata con successo'
          });
          analyzerSubscription = null;
          resolve({ success: true, stats });
        }
      });
    });
  } catch (error) {
    console.error('Errore nell\'avvio dell\'analisi:', error);
    mainWindow.webContents.send('dependency-error', {
      type: 'error',
      message: error.message
    });
    return { success: false, error: error.message };
  }
});

// Cancellazione analisi
ipcMain.handle('cancel-analysis', () => {
  if (analyzerSubscription) {
    analyzerSubscription.unsubscribe();
    analyzerSubscription = null;
    console.log('Analisi interrotta dall\'utente');
    return true;
  }
  return false;
});