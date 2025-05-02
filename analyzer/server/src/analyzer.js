const { Observable, from } = require('rxjs');
const { mergeMap, map, filter } = require('rxjs/operators');
const fs = require('fs').promises;
const path = require('path');
const { parseJavaFile } = require('./parser-adapter');

/**
 * Analizza un progetto Java e restituisce un Observable di dipendenze
 * @param {string} projectPath - Percorso della directory del progetto
 * @returns {Observable} Observable che emette dipendenze
 */
function analyzeProject(projectPath) {
  return findJavaFiles(projectPath).pipe(
    mergeMap(filePath => {
      return from(fs.readFile(filePath, 'utf8')).pipe(
        map(content => {
          const fileName = path.basename(filePath);
          const packageName = extractPackageName(filePath, projectPath);
          
          // Analizza il file con il parser
          const dependencies = parseJavaFile(content);
          
          return {
            fileName,
            packageName,
            filePath,
            dependencies
          };
        })
      );
    }),
    filter(result => result !== null)
  );
}

/**
 * Trova tutti i file Java in una directory ricorsivamente
 * @param {string} directory - Directory da scansionare
 * @returns {Observable} Observable che emette percorsi di file
 */
function findJavaFiles(directory) {
  return new Observable(subscriber => {
    const scanDir = async (dir) => {
      try {
        const files = await fs.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            await scanDir(fullPath);
          } else if (file.name.endsWith('.java')) {
            subscriber.next(fullPath);
          }
        }
      } catch (error) {
        subscriber.error(error);
      }
    };
    
    // Avvia la scansione e completa quando finito
    scanDir(directory)
      .then(() => subscriber.complete())
      .catch(err => subscriber.error(err));
    
    // Cleanup function
    return () => {
      console.log('Scansione dei file interrotta');
    };
  });
}

/**
 * Estrae il nome del package dal percorso del file
 * @param {string} filePath - Percorso del file
 * @param {string} basePath - Percorso base del progetto
 * @returns {string} Nome del package
 */
function extractPackageName(filePath, basePath) {
  const relativePath = path.relative(basePath, path.dirname(filePath));
  return relativePath.replace(/[\/\\]/g, '.') || 'default';
}

module.exports = {
  analyzeProject
};