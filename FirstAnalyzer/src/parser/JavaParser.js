import { parse } from 'java-parser';

export class JavaParser {
  /**
   * Estrae le dipendenze da un contenuto Java
   * @param {string} content - Il contenuto del file Java
   * @returns {Array} - Lista delle dipendenze trovate
   */
  extractDependencies(content) {
    try {
      //console.log("Analisi del codice Java...");
      const ast = parse(content);
      //console.log("AST generato correttamente");
      
      // Debug della struttura dell'AST
      //console.log("Struttura AST - children:", Object.keys(ast.children));
      
      const dependencies = [];
      
      // Naviga nella struttura corretta: ordinaryCompilationUnit
      if (ast.children && ast.children.ordinaryCompilationUnit) {
        const compilationUnit = ast.children.ordinaryCompilationUnit[0];
        
        // Debug della struttura interna
        //console.log("Struttura compilationUnit:", Object.keys(compilationUnit.children));
        
        // Estrai dipendenze dagli import
        this._extractImportDependencies(compilationUnit, content, dependencies);
        
        // Estrai dipendenze da extends/implements
        this._extractTypeRelationships(compilationUnit, dependencies);
      }
      
      return dependencies;
    } catch (error) {
      //console.error('Errore durante il parsing del file Java:', error);
      return [];
    }
  }

  /**
   * Estrae le dipendenze dalle dichiarazioni di import
   * @private
   */
  _extractImportDependencies(compilationUnit, content, dependencies) {
    // Array per tenere traccia degli import wildcard
    const wildcardImports = [];
    const specificImports = [];

    if (compilationUnit.children.importDeclaration) {
      const imports = compilationUnit.children.importDeclaration;
      //console.log(`Trovate ${imports.length} dichiarazioni di import`);
      
      for (const importDecl of imports) {
        if (importDecl.location) {
          const importText = content.substring(
            importDecl.location.startOffset,
            importDecl.location.endOffset
          ).trim();
          
          // Rimuovi "import " e ";" per ottenere solo il nome della classe/package
          let cleanImport = importText
            .replace(/^import\s+/, '')
            .replace(/;$/, '')
            .trim();
            
          // Controlla se è un import statico
          const isStatic = cleanImport.startsWith('static ');
          if (isStatic) {
            cleanImport = cleanImport.replace(/^static\s+/, '');
          }
          
          // Verifica se è una wildcard
          const isWildcard = cleanImport.endsWith('.*');
          
          if (isWildcard) {
            wildcardImports.push({
              packageName: cleanImport.substring(0, cleanImport.length - 2),
              isStatic
            });
            //console.log(`Import wildcard trovato: ${cleanImport}`);
          } else {
            specificImports.push(cleanImport);
            dependencies.push(cleanImport);
            //console.log(`Import specifico trovato: ${cleanImport}`);
          }
        }
      }
    }
    
    // Ora cerca tutti gli identificatori di tipo nel codice e collegali ai wildcard imports
    if (wildcardImports.length > 0) {
      this._findWildcardReferences(compilationUnit, wildcardImports, specificImports, dependencies);
    }
  }

  /**
   * Cerca tutti i riferimenti a classi che potrebbero venire da import wildcard
   * @private
   */
  _findWildcardReferences(compilationUnit, wildcardImports, specificImports, dependencies) {
    // Mappa per tracciare i nomi già trovati e associarli ai loro package
    const foundReferences = new Map();
    
    //console.log("INIZIO ANALISI WILDCARD - Import wildcards trovati:", wildcardImports.map(w => w.packageName).join(', '));
    //console.log("Import specifici presenti:", specificImports.join(', '));
    
    // Funzione ricorsiva per visitare i nodi dell'AST
    const visitNode = (node, path = "") => {
      if (!node || typeof node !== 'object') return;
      
      const currentPath = path ? `${path} > ${node.name || 'unnamed'}` : node.name || 'root';
      
      // Debug del nodo corrente
      if (node.name) {
        ////console.log(` Analisi nodo: ${currentPath}`);
      }
      
      // 1. Cerca gli identificatori di tipo (classi/interfacce)
      if (node.name === 'classOrInterfaceType' || node.name === 'classType') {
        ////console.log(`  Trovato nodo di tipo classe: ${node.name}`);
        
        if (node.children && node.children.Identifier) {
          const typeName = node.children.Identifier[0].image;
          ////console.log(`Nome tipo trovato: ${typeName}`);
          this._checkAndAddWildcardReference(typeName, wildcardImports, specificImports, dependencies, foundReferences);
        } else {
          ////console.log(`Nessun identificatore trovato nel nodo ${node.name}`);
        }
      }
      
      // 2. Cerca riferimenti in dichiarazioni di variabili
      else if (node.name === 'localVariableDeclaration' || node.name === 'fieldDeclaration') {
        ////console.log(` Trovata dichiarazione variabile/campo: ${node.name}`);
        
        if (node.children && node.children.unannType && node.children.unannType[0].children) {
          const unannType = node.children.unannType[0];
          ////console.log(`  Tipo non annotato trovato`);
          
          if (unannType.children.unannReferenceType) {
            const refType = unannType.children.unannReferenceType[0];
            ////console.log(`  Tipo riferimento non annotato trovato`);
            this._extractTypeNamesFromNode(refType, wildcardImports, specificImports, dependencies, foundReferences);
          } else {
            //console.log(` Nessun tipo riferimento trovato`);
          }
        } else {
          //console.log(` Struttura del tipo non riconosciuta`);
        }
      }
      
      // 3. Cerca riferimenti in creazioni di oggetti (new ClassName())
      else if (node.name === 'unqualifiedClassInstanceCreationExpression') {
        //console.log(`  Trovata creazione istanza non qualificata: ${node.name}`);
        
        // Esplora il nodo per trovare il tipo della classe da istanziare
        if (node.children && node.children.classOrInterfaceTypeToInstantiate) {
          const typeNode = node.children.classOrInterfaceTypeToInstantiate[0];
          //console.log(`Tipo da istanziare trovato`);
          
          // Estrai il nome della classe dalla struttura
          this._extractClassNameFromInstantiation(typeNode, wildcardImports, specificImports, dependencies, foundReferences);
        } else {
          //console.log(`  Struttura di creazione istanza non riconosciuta`);
        }
      }
      
      // 4. Controlla anche il tipo newExpression che contiene unqualifiedClassInstanceCreationExpression
      else if (node.name === 'newExpression') {
        //console.log(`  Trovata espressione new: ${node.name}`);
        
        if (node.children && node.children.unqualifiedClassInstanceCreationExpression) {
          const instNode = node.children.unqualifiedClassInstanceCreationExpression[0];
          
          // Delega l'estrazione al caso specifico
          visitNode(instNode, currentPath);
        }
      }
      
      // Visita tutti i figli del nodo
      if (node.children) {
        Object.entries(node.children).forEach(([key, childArray]) => {
          if (Array.isArray(childArray)) {
            childArray.forEach(child => visitNode(child, currentPath));
          }
        });
      }
    };
    
    // Inizia la visita dall'unità di compilazione
    //console.log(" Avvio analisi AST per wildcard...");
    visitNode(compilationUnit);
    //console.log("FINE ANALISI WILDCARD - Riferimenti trovati:", [...foundReferences.keys()]);
  }

  /**
   * Estrae il nome della classe da un nodo di istanziazione
   * @private
   */
  _extractClassNameFromInstantiation(typeNode, wildcardImports, specificImports, dependencies, foundReferences) {
    //console.log(" Estrazione nome classe da istanziazione");
    
    // Stampa la struttura del nodo per debug    
    if (typeNode.children && typeNode.children.Identifier) {
      const typeName = typeNode.children.Identifier[0].image;
      //console.log(` Nome classe istanziata: ${typeName}`);
      this._checkAndAddWildcardReference(typeName, wildcardImports, specificImports, dependencies, foundReferences);
    }
    else if (typeNode.children && typeNode.children.unannClassOrInterfaceType) {
      const classType = typeNode.children.unannClassOrInterfaceType[0];
      if (classType.children && classType.children.Identifier) {
        const typeName = classType.children.Identifier[0].image;
        //console.log(` Nome classe istanziata (tramite unannClassOrInterfaceType): ${typeName}`);
        this._checkAndAddWildcardReference(typeName, wildcardImports, specificImports, dependencies, foundReferences);
      }
    }
    // Traversiamo ricorsivamente tutti i figli per trovare il nome della classe
    else if (typeNode.children) {
      Object.values(typeNode.children).forEach(childArray => {
        if (Array.isArray(childArray)) {
          childArray.forEach(child => {
            this._extractClassNameFromInstantiation(child, wildcardImports, specificImports, dependencies, foundReferences);
          });
        }
      });
    }
    else {
      //console.log(` Impossibile estrarre il nome della classe da instanziare`);
    }
  }

  /**
   * Verifica se un nome di tipo può provenire da un import wildcard e lo aggiunge alle dipendenze
   * @private
   */
  _checkAndAddWildcardReference(typeName, wildcardImports, specificImports, dependencies, foundReferences) {
    //console.log(`  Verifica nome classe: "${typeName}"`);
    
    // Verifica che il nome sia valido (inizia con lettera maiuscola - convenzione Java per le classi)
    if (!typeName || !/^[A-Z]/.test(typeName)) {
      //console.log(`  Nome scartato: "${typeName}" - non inizia con lettera maiuscola`);
      return;
    }
    
    // Verifica che non sia già negli import specifici
    if (specificImports.some(imp => imp.endsWith('.' + typeName) || imp === typeName)) {
      //console.log(`  Nome ignorato: "${typeName}" - già presente negli import specifici`);
      return;
    }
    
    //console.log(` Nome valido: "${typeName}" - cercando nei package wildcard...`);
    
    // Per ogni wildcard import, aggiungi una possibile dipendenza completa
    for (const wildcard of wildcardImports) {
      const fullName = `${wildcard.packageName}.${typeName}`;
      
      if (!foundReferences.has(fullName)) {
        dependencies.push(fullName);
        foundReferences.set(fullName, true);
        //console.log(` WILDCARD MATCH TROVATO: ${fullName}`);
      } else {
        //console.log(` Riferimento già trovato: ${fullName}`);
      }
    }
    
    if (wildcardImports.length === 0) {
      //console.log(`  Nessun wildcard import disponibile per ${typeName}`);
    }
  }

  /**
   * Estrae nomi di tipo da un nodo e verifica se provengono da import wildcard
   * @private
   */
  _extractTypeNamesFromNode(node, wildcardImports, specificImports, dependencies, foundReferences) {
    if (!node || typeof node !== 'object') return;
    
    //console.log(` Estrazione nomi da nodo ${node.name || 'senza nome'}`);
    
    // Estrai direttamente dagli identificatori
    if (node.children && node.children.Identifier) {
      const typeName = node.children.Identifier[0].image;
      //console.log(` Identificatore diretto trovato: ${typeName}`);
      this._checkAndAddWildcardReference(typeName, wildcardImports, specificImports, dependencies, foundReferences);
    }
    
    // Attraversa ricorsivamente la struttura
    if (node.children) {
      Object.values(node.children).forEach(childArray => {
        if (Array.isArray(childArray)) {
          childArray.forEach(child => {
            if (child.name === 'Identifier') {
              const typeName = child.image;
              //console.log(` Identificatore annidato trovato: ${typeName}`);
              this._checkAndAddWildcardReference(typeName, wildcardImports, specificImports, dependencies, foundReferences);
            } else {
              this._extractTypeNamesFromNode(child, wildcardImports, specificImports, dependencies, foundReferences);
            }
          });
        }
      });
    }
  }

  /**
   * Estrae le dipendenze dalle relazioni tra tipi (extends/implements)
   * @private
   */
  _extractTypeRelationships(compilationUnit, dependencies) {
    if (!compilationUnit.children.typeDeclaration) return;
    
    const typeDeclarations = compilationUnit.children.typeDeclaration;
    //console.log(`Trovate ${typeDeclarations.length} dichiarazioni di tipo`);
    
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
    //console.log("Struttura normalClassDecl:", Object.keys(normalClassDecl.children || {}));
    
    // Estrai la classe estesa (extends)
    this._extractSuperclass(normalClassDecl, dependencies);
    
    // Estrai le interfacce implementate (implements)
    this._extractInterfaces(normalClassDecl, dependencies);
  }

  /**
   * Utility per log selettivo dell'AST
   * @private
   */
  _debugNode(nodeName, node) {
    if (!node) return;
    
    ////console.log(`${nodeName} - chiavi:`, Object.keys(node.children || {}));
    
    if (node.children?.Identifier) {
      //console.log(`${nodeName} > Identifier:`, node.children.Identifier[0].image);
    }
  }

  /**
   * Estrae la classe parent (extends)
   * @private
   */
  _extractSuperclass(normalClassDecl, dependencies) {
    if (!normalClassDecl.children?.classExtends) return;
    
    const classExtendsNode = normalClassDecl.children.classExtends[0];
    this._debugNode("classExtends", classExtendsNode);
    
    if (classExtendsNode.children?.classType) {
      const classType = classExtendsNode.children.classType[0];
      this._debugNode("classType", classType);
      
      // Estrai nome direttamente o tramite classOrInterfaceType
      let superClassName = null;
      
      if (classType.children?.Identifier) {
        superClassName = classType.children.Identifier[0].image;
      } 
      else if (classType.children?.classOrInterfaceType) {
        const ciType = classType.children.classOrInterfaceType[0];
        this._debugNode("classOrInterfaceType", ciType);
        
        if (ciType.children?.Identifier) {
          superClassName = ciType.children.Identifier[0].image;
        }
      }
      
      if (superClassName) {
        dependencies.push(superClassName);
        //console.log(" Superclass trovata:", superClassName);
      }
    }
  }

  /**
   * Estrae le interfacce implementate (implements)
   * @private
   */
  _extractInterfaces(normalClassDecl, dependencies) {
    if (!normalClassDecl.children || !normalClassDecl.children.classImplements) return;
    
    const implementsNode = normalClassDecl.children.classImplements[0];
    
    // Log solo le chiavi invece dell'intero JSON
    //console.log("classImplements - chiavi:", Object.keys(implementsNode.children || {}));
    
    if (implementsNode.children && implementsNode.children.interfaceTypeList) {
      const typeList = implementsNode.children.interfaceTypeList[0];
      //console.log("interfaceTypeList - chiavi:", Object.keys(typeList.children || {}));
      
      if (typeList.children && typeList.children.interfaceType) {
        // Mostra quante interfacce sono implementate
        //console.log(`Interfacce implementate trovate: ${typeList.children.interfaceType.length}`);
        
        for (const interfaceType of typeList.children.interfaceType) {
          if (interfaceType.children && interfaceType.children.classOrInterfaceType) {
            const typeNode = interfaceType.children.classOrInterfaceType[0];
            
            if (typeNode.children && typeNode.children.Identifier) {
              const interfaceName = typeNode.children.Identifier[0].image;
              dependencies.push(interfaceName);
              //console.log(" Interfaccia implementata trovata:", interfaceName);
            }
          } else if (interfaceType.children && interfaceType.children.classType) {
            const typeNode = interfaceType.children.classType[0];
            
            if (typeNode.children && typeNode.children.Identifier) {
              const interfaceName = typeNode.children.Identifier[0].image;
              dependencies.push(interfaceName);
              //console.log(" Interfaccia implementata trovata:", interfaceName);
            }
          }
        }
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
    //console.log("Struttura normalInterfaceDecl:", Object.keys(normalInterfaceDecl.children || {}));
    
    // Estrai le interfacce estese (extends)
    this._extractExtendedInterfaces(normalInterfaceDecl, dependencies);
  }

  /**
   * Estrae le interfacce estese da un'interfaccia
   * @private
   */
  _extractExtendedInterfaces(normalInterfaceDecl, dependencies) {
    if (!normalInterfaceDecl.children || !normalInterfaceDecl.children.interfaceExtends) return;
    
    const extendsNode = normalInterfaceDecl.children.interfaceExtends[0];
    //console.log("interfaceExtends - chiavi:", Object.keys(extendsNode.children || {}));
    
    if (extendsNode.children && extendsNode.children.interfaceTypeList) {
      const typeList = extendsNode.children.interfaceTypeList[0];
      //console.log("interfaceTypeList - chiavi:", Object.keys(typeList.children || {}));
      
      if (typeList.children && typeList.children.interfaceType) {
        // Mostra quante interfacce sono estese
        //console.log(`Interfacce estese trovate: ${typeList.children.interfaceType.length}`);
        
        for (const interfaceType of typeList.children.interfaceType) {
          if (interfaceType.children && interfaceType.children.classOrInterfaceType) {
            const typeNode = interfaceType.children.classOrInterfaceType[0];
            
            if (typeNode.children && typeNode.children.Identifier) {
              const extendedName = typeNode.children.Identifier[0].image;
              dependencies.push(extendedName);
              //console.log(" Interfaccia estesa trovata:", extendedName);
            }
          } else if (interfaceType.children && interfaceType.children.classType) {
            const typeNode = interfaceType.children.classType[0];
            
            if (typeNode.children && typeNode.children.Identifier) {
              const extendedName = typeNode.children.Identifier[0].image;
              dependencies.push(extendedName);
              //console.log("Interfaccia estesa trovata:", extendedName);
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
    //console.log("Struttura interfaceType:", Object.keys(interfaceType.children || {}));
    
    let typeName = null;
    
    // Prova diversi percorsi di navigazione nell'AST
    if (interfaceType.children) {
      // Percorso 1: classOrInterfaceType > Identifier
      if (interfaceType.children.classOrInterfaceType) {
        const typeNode = interfaceType.children.classOrInterfaceType[0];
        if (typeNode.children && typeNode.children.Identifier) {
          typeName = typeNode.children.Identifier[0].image;
        }
      }
      // Percorso 2: classType > Identifier
      else if (interfaceType.children.classType) {
        const classType = interfaceType.children.classType[0];
        if (classType.children && classType.children.Identifier) {
          typeName = classType.children.Identifier[0].image;
        }
      }
      // Percorso 3: Identifier diretto
      else if (interfaceType.children.Identifier) {
        typeName = interfaceType.children.Identifier[0].image;
      }
    }
    
    if (typeName) {
      dependencies.push(typeName);
      //console.log("Relazione trovata:", typeName);
    }
  }

  /**
   * Identifica il tipo di elemento Java contenuto nel file
   * @param {string} content - Il contenuto del file Java
   * @returns {Object} - Informazioni sul tipo di file (classe, interfaccia, etc.)
   */
  identifyFileType(content) {
    try {
      //console.log("Analisi del tipo di file Java...");
      const ast = parse(content);
      
      const result = {
        type: "UNKNOWN",
        name: null,
        isAbstract: false,
        modifiers: [] // Modificatori come public, private, abstract etc.
      };
      
      // Naviga nella struttura corretta: ordinaryCompilationUnit
      if (ast.children && ast.children.ordinaryCompilationUnit) {
        const compilationUnit = ast.children.ordinaryCompilationUnit[0];
        
        if (compilationUnit.children && compilationUnit.children.typeDeclaration) {
          const typeDeclarations = compilationUnit.children.typeDeclaration;
          
          // Prendiamo in considerazione solo la prima dichiarazione di tipo
          // (la principale nel file)
          if (typeDeclarations.length > 0) {
            const typeDecl = typeDeclarations[0];
            
            // Verifica se è una classe
            if (typeDecl.children && typeDecl.children.classDeclaration) {
              const classDecl = typeDecl.children.classDeclaration[0];
              if (classDecl.children && classDecl.children.normalClassDeclaration) {
                const normalClass = classDecl.children.normalClassDeclaration[0];
                
                result.type = "CLASS";
                
                // Estrai nome della classe
                if (normalClass.children && normalClass.children.typeIdentifier) {
                  result.name = normalClass.children.typeIdentifier[0].image;
                }
                
                // Verifica se è astratta
                if (normalClass.children && normalClass.children.classModifier) {
                  for (const modifier of normalClass.children.classModifier) {
                    const modText = this._getModifierText(modifier);
                    if (modText) {
                      result.modifiers.push(modText);
                      if (modText === "abstract") {
                        result.isAbstract = true;
                      }
                    }
                  }
                }
              }
            }
            
            // Verifica se è un'interfaccia
            else if (typeDecl.children && typeDecl.children.interfaceDeclaration) {
              const interfaceDecl = typeDecl.children.interfaceDeclaration[0];
              if (interfaceDecl.children && interfaceDecl.children.normalInterfaceDeclaration) {
                const normalInterface = interfaceDecl.children.normalInterfaceDeclaration[0];
                
                result.type = "INTERFACE";
                
                // Estrai nome dell'interfaccia
                if (normalInterface.children && normalInterface.children.typeIdentifier) {
                  result.name = normalInterface.children.typeIdentifier[0].image;
                }
                
                // Le interfacce sono implicitamente astratte
                result.isAbstract = true;
                
                // Estrai i modificatori
                if (normalInterface.children && normalInterface.children.interfaceModifier) {
                  for (const modifier of normalInterface.children.interfaceModifier) {
                    const modText = this._getModifierText(modifier);
                    if (modText) {
                      result.modifiers.push(modText);
                    }
                  }
                }
              }
            }
            
            // Verifica se è un'enumerazione
            else if (typeDecl.children && typeDecl.children.enumDeclaration) {
              const enumDecl = typeDecl.children.enumDeclaration[0];
              
              result.type = "ENUM";
              
              // Estrai nome dell'enumerazione
              if (enumDecl.children && enumDecl.children.typeIdentifier) {
                result.name = enumDecl.children.typeIdentifier[0].image;
              }
              
              // Estrai i modificatori
              if (enumDecl.children && enumDecl.children.enumModifier) {
                for (const modifier of enumDecl.children.enumModifier) {
                  const modText = this._getModifierText(modifier);
                  if (modText) {
                    result.modifiers.push(modText);
                  }
                }
              }
            }
          }
        }
      }
      
      //console.log(`Tipo di file identificato: ${result.type}, Nome: ${result.name}`);
      return result;
    } catch (error) {
      //console.error('Errore durante l\'identificazione del tipo di file:', error);
      return { type: "ERROR", name: null, error: error.message };
    }
  }
  
  /**
   * Estrae il testo di un modificatore
   * @private
   */
  _getModifierText(modifierNode) {
    if (modifierNode.children) {
      if (modifierNode.children.Public) return "public";
      if (modifierNode.children.Private) return "private";
      if (modifierNode.children.Protected) return "protected";
      if (modifierNode.children.Abstract) return "abstract";
      if (modifierNode.children.Static) return "static";
      if (modifierNode.children.Final) return "final";
    }
    return null;
  }
}