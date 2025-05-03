import React, { useState, useRef } from 'react';

const FileSelector = ({ onPathSelected, selectedPath }) => {
  const [inputPath, setInputPath] = useState(selectedPath);
  const fileInputRef = useRef(null);
  
  const handleChange = (e) => {
    setInputPath(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPath) {
      onPathSelected(inputPath.trim());
    }
  };
  
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Per ottenere il percorso della directory selezionata
      // Nota: a causa delle restrizioni di sicurezza del browser, otteniamo solo
      // un riferimento al file, non il percorso completo in un'applicazione web standard
      
      const selectedFolder = e.target.files[0];
      // Se l'app è in ambiente Electron o simile, potrebbe essere disponibile il percorso completo
      const path = selectedFolder.path || selectedFolder.webkitRelativePath.split('/')[0];
      
      if (path) {
        setInputPath(path);
        onPathSelected(path);
      }
    }
  };
  
  const openFileBrowser = async () => {
    try {
      // Mostra il selettore di directory nativo
      const directoryHandle = await window.showDirectoryPicker();
      // Ottieni il nome della directory
      const directoryName = directoryHandle.name;
      setInputPath(directoryName);
      onPathSelected(directoryName);
    } catch (err) {
      // Fallback al metodo standard
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="file-selector">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            value={inputPath}
            onChange={handleChange}
            placeholder="Inserisci il percorso della directory Java..."
            className="path-input"
          />
          <button 
            type="button" 
            onClick={openFileBrowser} 
            className="browse-button"
          >
            Sfoglia
          </button>
          <button type="submit" className="submit-button">Seleziona</button>
          
          {/* Input file nascosto */}
          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory="true"
            directory="true"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
        </div>
      </form>
    </div>
  );
};

export default FileSelector;