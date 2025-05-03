document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  
  // Crea un'interfaccia semplice
  root.innerHTML = `
    <h1>Java Dependency Analyzer</h1>
    <div class="file-selector">
      <input type="text" id="path-input" placeholder="Percorso del progetto Java...">
      <button id="browse-btn">Sfoglia</button>
      <button id="analyze-btn">Analizza</button>
    </div>
    <div class="status-panel">
      <div id="status">Seleziona una directory da analizzare</div>
      <div class="stats">
        <div>File analizzati: <span id="files-count">0</span></div>
        <div>Dipendenze trovate: <span id="deps-count">0</span></div>
      </div>
    </div>
    <div id="dependencies-container">
      <h2>Grafo delle dipendenze</h2>
      <div id="dependencies-list"></div>
    </div>
  `;
  
  // Riferimenti agli elementi
  const pathInput = document.getElementById('path-input');
  const browseBtn = document.getElementById('browse-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const status = document.getElementById('status');
  const filesCount = document.getElementById('files-count');
  const depsCount = document.getElementById('deps-count');
  const depsList = document.getElementById('dependencies-list');
  
  // Seleziona directory
  browseBtn.addEventListener('click', async () => {
    try {
      const result = await window.electron.openDirectoryDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        pathInput.value = result.filePaths[0];
      }
    } catch (err) {
      status.textContent = `Errore: ${err.message}`;
    }
  });
  
  // Avvia analisi
  analyzeBtn.addEventListener('click', async () => {
    if (!pathInput.value) {
      status.textContent = 'Seleziona prima una directory';
      return;
    }
    
    depsList.innerHTML = '';
    status.textContent = 'Analisi in corso...';
    
    try {
      await window.electron.analyzeProject(pathInput.value);
    } catch (err) {
      status.textContent = `Errore: ${err.message}`;
    }
  });
  
  // Ascolta gli eventi dell'analisi
  window.electron.onDependencyUpdate((data) => {
    if (data.type === 'dependency') {
      // Aggiorna statistiche
      filesCount.textContent = data.stats.filesAnalyzed;
      depsCount.textContent = data.stats.dependenciesFound;
      
      // Aggiungi file alla lista
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.textContent = `${data.data.fileName} (${data.data.dependencies?.length || 0} dipendenze)`;
      depsList.appendChild(fileItem);
    }
  });
  
  window.electron.onDependencyError((data) => {
    status.textContent = `Errore: ${data.message}`;
  });
  
  window.electron.onDependencyComplete((data) => {
    status.textContent = `Analisi completata: ${data.stats.filesAnalyzed} file analizzati`;
  });
});