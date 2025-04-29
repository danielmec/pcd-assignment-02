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
        
        // Estrai dipendenze dagli import
        this._extractImportDependencies(compilationUnit, content, dependencies);
        
        // Estrai dipendenze da extends/implements
        this._extractTypeRelationships(compilationUnit, dependencies);
      }
      
      return dependencies;
    } catch (error) {
      console.error('Errore durante il parsing del file Java:', error);
      return [];
    }
  }

  /**
   * Estrae le dipendenze dalle dichiarazioni di import
   * @private
   */
  _extractImportDependencies(compilationUnit, content, dependencies) {
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

  /**
   * Estrae le dipendenze dalle relazioni tra tipi (extends/implements)
   * @private
   */
  _extractTypeRelationships(compilationUnit, dependencies) {
    if (!compilationUnit.children.typeDeclaration) return;
    
    const typeDeclarations = compilationUnit.children.typeDeclaration;
    console.log(`Trovate ${typeDeclarations.length} dichiarazioni di tipo`);
    
    for (const typeDecl of typeDeclarations) {
      // Estrai dipendenze dalle dichiarazioni di classe
      this._extractClassRelationships(typeDecl, dependencies);
      
      // Estrai dipendenze dalle dichiarazioni di interfaccia
      this._extractInterfaceRelationships(typeDecl, dependencies);
    }
  }

  /**
   * Estrae relazioni di ereditarietà dalle dichiarazioni di classe
   * @private
   */
  _extractClassRelationships(typeDecl, dependencies) {
    if (!typeDecl.children || !typeDecl.children.classDeclaration) return;
    
    const classDecl = typeDecl.children.classDeclaration[0];
    if (!classDecl.children || !classDecl.children.normalClassDeclaration) return;
    
    const normalClassDecl = classDecl.children.normalClassDeclaration[0];
    
    // Stampa la struttura per debug
    console.log("Struttura normalClassDecl:", Object.keys(normalClassDecl.children || {}));
    
    // Estrai la classe estesa (extends)
    this._extractSuperclass(normalClassDecl, dependencies);
    
    // Estrai le interfacce implementate (implements)
    this._extractInterfaces(normalClassDecl, dependencies);
  }

  /**
   * Estrae la classe parent (extends)
   * @private
   */
  _extractSuperclass(normalClassDecl, dependencies) {
    if (!normalClassDecl.children || !normalClassDecl.children.superclass) return;
    
    const superclassNode = normalClassDecl.children.superclass[0];
    // Debug compatto
    console.log("Struttura superclass:", Object.keys(superclassNode.children || {}));
    
    if (!superclassNode.children || !superclassNode.children.classType) return;
    
    const classType = superclassNode.children.classType[0];
    
    // Debug compatto
    console.log("Struttura classType:", Object.keys(classType.children || {}));
    
    // Estrai il nome della superclasse
    if (classType.children && classType.children.identifier) {
      const superClassName = classType.children.identifier[0].image;
      dependencies.push(superClassName);
      console.log("Estensione trovata:", superClassName);
    }
  }

  /**
   * Estrae le interfacce implementate (implements)
   * @private
   */
  _extractInterfaces(normalClassDecl, dependencies) {
    if (!normalClassDecl.children || !normalClassDecl.children.superinterfaces) return;
    
    const superInterfacesNode = normalClassDecl.children.superinterfaces[0];
    // Debug compatto
    console.log("Struttura superinterfaces:", Object.keys(superInterfacesNode.children || {}));
    
    if (!superInterfacesNode.children || !superInterfacesNode.children.interfaceTypeList) return;
    
    const interfaceTypeList = superInterfacesNode.children.interfaceTypeList[0];
    
    if (!interfaceTypeList.children || !interfaceTypeList.children.interfaceType) return;
    
    for (const interfaceType of interfaceTypeList.children.interfaceType) {
      if (!interfaceType.children || !interfaceType.children.classType) continue;
      
      const classType = interfaceType.children.classType[0];
      
      // Debug per capire la struttura
      console.log("Struttura interfaceType:", JSON.stringify(classType, null, 2));
      
      if (classType.children && classType.children.identifier) {
        const interfaceName = classType.children.identifier[0].image;
        dependencies.push(interfaceName);
        console.log("Implementazione trovata:", interfaceName);
      }
    }
  }

  /**
   * Estrae relazioni di ereditarietà dalle dichiarazioni di interfaccia
   * @private
   */
  _extractInterfaceRelationships(typeDecl, dependencies) {
    if (!typeDecl.children || !typeDecl.children.interfaceDeclaration) return;
    
    const interfaceDecl = typeDecl.children.interfaceDeclaration[0];
    if (!interfaceDecl.children || !interfaceDecl.children.normalInterfaceDeclaration) return;
    
    const normalInterfaceDecl = interfaceDecl.children.normalInterfaceDeclaration[0];
    
    // Debug per capire la struttura
    console.log("Struttura normalInterfaceDecl:", Object.keys(normalInterfaceDecl.children || {}));
    
    // Estrai le interfacce estese (extends)
    this._extractExtendedInterfaces(normalInterfaceDecl, dependencies);
  }

  /**
   * Estrae le interfacce estese da un'interfaccia
   * @private
   */
  _extractExtendedInterfaces(normalInterfaceDecl, dependencies) {
    // Verifica se l'interfaccia estende altre interfacce
    if (!normalInterfaceDecl.children || !normalInterfaceDecl.children.interfaceExtends) return;
    
    const extendsNode = normalInterfaceDecl.children.interfaceExtends[0];
    // FIX: Errore nella variabile "oggetto" non definita
    console.log("Struttura interfaceExtends:", Object.keys(extendsNode.children || {}));
    
    // Estrai i nomi delle interfacce estese
    if (extendsNode.children && extendsNode.children.interfaceTypeList) {
      const typeList = extendsNode.children.interfaceTypeList[0];
      
      if (typeList.children && typeList.children.interfaceType) {
        for (const interfaceType of typeList.children.interfaceType) {
          if (interfaceType.children && interfaceType.children.classOrInterfaceType) {
            const typeNode = interfaceType.children.classOrInterfaceType[0];
            if (typeNode.children && typeNode.children.identifier) {
              const extendedName = typeNode.children.identifier[0].image;
              dependencies.push(extendedName);
              console.log("Interfaccia estesa trovata:", extendedName);
            }
          }
        }
      }
    }
  }

  /**
   * Metodo ausiliario per estrarre il nome da un tipo interfaccia
   * @private
   */
  _extractInterfaceTypeName(interfaceType, dependencies) {
    // Log compatto invece del JSON completo
    console.log("Struttura interfaceType:", Object.keys(interfaceType.children || {}));
    
    let typeName = null;
    
    // Prova diversi percorsi di navigazione nell'AST
    if (interfaceType.children) {
      // Percorso 1: classOrInterfaceType > identifier
      if (interfaceType.children.classOrInterfaceType) {
        const typeNode = interfaceType.children.classOrInterfaceType[0];
        if (typeNode.children && typeNode.children.identifier) {
          typeName = typeNode.children.identifier[0].image;
        }
      }
      // Percorso 2: classType > identifier
      else if (interfaceType.children.classType) {
        const classType = interfaceType.children.classType[0];
        if (classType.children && classType.children.identifier) {
          typeName = classType.children.identifier[0].image;
        }
      }
      // Percorso 3: identifier diretto
      else if (interfaceType.children.identifier) {
        typeName = interfaceType.children.identifier[0].image;
      }
    }
    
    if (typeName) {
      dependencies.push(typeName);
      console.log("Relazione trovata:", typeName);
    }
  }
}

module.exports = JavaParser;