// Usa path per gestire i percorsi in modo più affidabile
const path = require('path');
const JavaParser = require('../parser/JavaParser');

// Istanza del parser
const parser = new JavaParser();

/**
 * Analizza un file Java e ne estrae le dipendenze
 * @param {string} content - Contenuto del file Java
 * @returns {Array} Array di dipendenze
 */
function parseJavaFile(content) {
  try {
    // Verifica se il contenuto è valido
    if (!content || typeof content !== 'string') {
      throw new Error('Contenuto del file non valido');
    }
    
    return parser.extractDependencies(content);
  } catch (error) {
    console.error('Errore durante il parsing del file Java:', error);
    // Fornisci un messaggio di errore più descrittivo
    throw new Error(`Errore nell'analisi del file: ${error.message}`);
  }
}

module.exports = {
  parseJavaFile
};