const JavaParser = require('../../../src/parser/JavaParser');

// Istanza del parser
const parser = new JavaParser();

/**
 * Analizza un file Java e ne estrae le dipendenze
 * @param {string} content - Contenuto del file Java
 * @returns {Array} Array di dipendenze
 */
function parseJavaFile(content) {
  try {
    return parser.extractDependencies(content);
  } catch (error) {
    console.error('Errore durante il parsing del file Java:', error);
    return [];
  }
}

module.exports = {
  parseJavaFile
};