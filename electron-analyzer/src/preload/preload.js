const { contextBridge, ipcRenderer } = require('electron');

// Esponi funzionalità sicure dal processo main al renderer
contextBridge.exposeInMainWorld('electron', {
  // API per dialogo selezione directory
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  
  // API per analisi progetto
  analyzeProject: (path) => ipcRenderer.invoke('analyze-project', path),
  cancelAnalysis: () => ipcRenderer.invoke('cancel-analysis'),
  
  // Eventi in ascolto
  onDependencyUpdate: (callback) => {
    ipcRenderer.on('dependency-update', (_, data) => callback(data));
  },
  onDependencyError: (callback) => {
    ipcRenderer.on('dependency-error', (_, data) => callback(data));
  },
  onDependencyComplete: (callback) => {
    ipcRenderer.on('dependency-complete', (_, data) => callback(data));
  },
  
  // Rimuovi listener (cleanup)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('dependency-update');
    ipcRenderer.removeAllListeners('dependency-error');
    ipcRenderer.removeAllListeners('dependency-complete');
  }
});

console.log('Preload script caricato correttamente');