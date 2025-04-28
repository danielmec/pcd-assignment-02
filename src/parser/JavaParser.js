const { parse } = require('java-parser');

class JavaParser {
  /**
   * Estrae le dipendenze da un contenuto Java
   * @param {string} content - Il contenuto del file Java
   * @returns {Array} - Lista delle dipendenze trovate
   */
  extractDependencies(content) {
    try {
      console.log("Analisi del codice Java...");
      const ast = parse(content);
      console.log("AST generato correttamente");
      
      // Debug della struttura dell'AST
      console.log("Struttura AST - children:", Object.keys(ast.children));
      
      const dependencies = [];
      
      // Naviga nella struttura corretta: ordinaryCompilationUnit
      if (ast.children && ast.children.ordinaryCompilationUnit) {
        const compilationUnit = ast.children.ordinaryCompilationUnit[0];
        
        // Debug della struttura interna
        console.log("Struttura compilationUnit:", Object.keys(compilationUnit.children));
        
        // Cerca le dichiarazioni di import
        if (compilationUnit.children.importDeclaration) {
          const imports = compilationUnit.children.importDeclaration;
          console.log(`Trovate ${imports.length} dichiarazioni di import`);
          
          for (const importDecl of imports) {
            // Estrai la stringa di import usando le posizioni nel testo originale
            if (importDecl.location) {
              const importText = content.substring(
                importDecl.location.startOffset,
                importDecl.location.endOffset
              ).trim();
              
              // Rimuovi "import " e ";" per ottenere solo il nome della classe/package
              const cleanImport = importText
                .replace(/^import\s+/, '')
                .replace(/;$/, '')
                .trim();
                
              dependencies.push(cleanImport);
              console.log("Import trovato:", cleanImport);
            }
          }
        } else {
          console.log("Nessuna dichiarazione di import trovata nell'AST");
        }
      }
      
      return dependencies;
    } catch (error) {
      console.error('Errore durante il parsing del file Java:', error);
      return [];
    }
  }
  
  /**
   * Estrae il testo sorgente originale dal nodo dell'AST
   */
  _getSourceText(node) {
    // Se il nodo ha un campo "image", usalo direttamente
    if (node.image) return node.image;
    
    if (!node.children) return null;
    
    // Cerca di ricostruire l'import dalla struttura dell'AST
    let importName = '';
    
    // Attraversa l'AST per trovare le parti dell'import
    if (node.children.packageOrTypeName && node.children.packageOrTypeName[0]) {
      const ptn = node.children.packageOrTypeName[0];
      
      // Per package semplici
      if (ptn.children && ptn.children.Identifier) {
        const identifiers = ptn.children.Identifier.map(id => id.image);
        importName = identifiers.join('.');
      }
      
      // Per package qualificati
      if (ptn.children && ptn.children.qualifiedName && ptn.children.qualifiedName[0]) {
        const qn = ptn.children.qualifiedName[0];
        if (qn.children) {
          // Prendi il nome base
          if (qn.children.name) {
            importName = qn.children.name[0].image;
          }
          
          // Aggiungi tutte le parti qualificate
          if (qn.children.dotIdentifier) {
            qn.children.dotIdentifier.forEach(dot => {
              if (dot.children && dot.children.Identifier) {
                importName += '.' + dot.children.Identifier[0].image;
              }
            });
          }
        }
      }
    }
    
    return importName ? `import ${importName};` : null;
  }

  /**
   * Estrai il percorso completo dal nodo packageOrTypeName
   * @param {Object} node - Nodo dell'AST
   * @returns {string|null} - Percorso dell'import
   */
  _extractPackageOrTypeName(node) {
    if (!node || !node.children) return null;
    
    // Per gestire nomi qualificati (con punti)
    if (node.children.qualifiedName) {
      const qualifiedName = node.children.qualifiedName[0];
      return this._extractQualifiedNamePath(qualifiedName);
    } 
    // Per gestire nomi semplici
    else if (node.children.Identifier) {
      return node.children.Identifier[0].image;
    }
    
    return null;
  }

  /**
   * Estrae un percorso completo da un nodo qualifiedName
   * @param {Object} qualifiedName - Nodo qualifiedName dell'AST
   * @returns {string} - Percorso completo
   */
  _extractQualifiedNamePath(qualifiedName) {
    if (!qualifiedName || !qualifiedName.children) return "";
    
    let parts = [];
    
    // Estrai il primo nome
    if (qualifiedName.children.name && qualifiedName.children.name[0]) {
      const nameNode = qualifiedName.children.name[0];
      if (nameNode.children && nameNode.children.Identifier) {
        parts.push(nameNode.children.Identifier[0].image);
      }
    }
    
    // Estrai tutti i nomi dopo i punti
    if (qualifiedName.children.dotIdentifier) {
      for (const dotId of qualifiedName.children.dotIdentifier) {
        if (dotId.children && dotId.children.Identifier) {
          parts.push(dotId.children.Identifier[0].image);
        }
      }
    }
    
    return parts.join('.');
  }
}

module.exports = JavaParser;