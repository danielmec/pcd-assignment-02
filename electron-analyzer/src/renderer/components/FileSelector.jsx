// FileSelector.jsx
// Usa gli oggetti globali React invece degli import ES6
const { useState } = React;

const FileSelector = ({ onPathSelected, selectedPath, isDisabled }) => {
  const [inputPath, setInputPath] = useState(selectedPath || '');
  
  const handleChange = (e) => {
    setInputPath(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPath) {
      onPathSelected(inputPath.trim());
    }
  };
  
  const openFileBrowser = async () => {
    try {
      // Usa l'API Electron esposta tramite contextBridge
      const result = await window.electron.openDirectoryDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        const path = result.filePaths[0];
        setInputPath(path);
        onPathSelected(path);
      }
    } catch (err) {
      console.error('Errore durante la selezione della directory:', err);
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
            placeholder="Seleziona la directory del progetto Java..."
            className="path-input"
            disabled={isDisabled}
          />
          <button 
            type="button" 
            onClick={openFileBrowser} 
            className="browse-button"
            disabled={isDisabled}
          >
            Sfoglia
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={!inputPath || isDisabled}
          >
            Seleziona
          </button>
        </div>
      </form>
    </div>
  );
};

// Esporta il componente come variabile globale per accedervi in App.jsx
window.FileSelector = FileSelector;