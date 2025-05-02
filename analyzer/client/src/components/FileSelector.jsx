import React, { useState } from 'react';

const FileSelector = ({ onPathSelected, selectedPath }) => {
  const [inputPath, setInputPath] = useState(selectedPath);
  
  const handleChange = (e) => {
    setInputPath(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPath) {
      onPathSelected(inputPath.trim());
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
          <button type="submit" className="submit-button">Seleziona</button>
        </div>
      </form>
    </div>
  );
};

export default FileSelector;