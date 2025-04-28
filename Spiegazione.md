# DependecyAnalyserLib - Libreria asincrona per l'analisi delle dipendenze Java

## Panoramica del progetto

Questa libreria implementa un analizzatore asincrono di dipendenze per progetti Java, rispondendo ai requisiti dell'Assignment #02. La libreria è in grado di analizzare singoli file Java, package completi o interi progetti per identificare le dipendenze tra classi e interfacce.

## Struttura del progetto
## Componenti principali

### 1. DependecyAnalyserLib

La classe principale che fornisce i metodi asincroni per l'analisi delle dipendenze.

#### Metodi principali

##### `async getClassDependencies(classSrcFile)`

Analizza un singolo file Java e restituisce un report con le dipendenze.

```javascript
async getClassDependencies(classSrcFile) {
  try {
    // Verifica che il file esista
    await fs.access(classSrcFile);
    
    // Legge il contenuto del file
    const content = await fs.readFile(classSrcFile, 'utf8');
    
    // Estrae le dipendenze usando il parser
    const dependencies = this.parser.extractDependencies(content);
    
    // Crea e restituisce il report
    const className = path.basename(classSrcFile, '.java');
    return new ClassDepsReport(className, dependencies);
  } catch (error) {
    console.error(`Errore nell'analisi del file ${classSrcFile}:`, error);
    throw new Error(`Impossibile analizzare il file ${classSrcFile}: ${error.message}`);
  }
}

async getPackageDependencies(packageSrcFolder)
Analizza tutti i file Java in un package e restituisce un report aggregato.

async getPackageDependencies(packageSrcFolder) {
  try {
    // Trova tutti i file Java nella cartella
    const javaFiles = await this.findJavaFiles(packageSrcFolder);
    
    // Analizza ogni file Java in parallelo
    const classReports = await Promise.all(
      javaFiles.map(file => this.getClassDependencies(file))
    );
    
    // Crea il report del package
    const packageName = path.basename(packageSrcFolder);
    return new PackageDepsReport(packageName, classReports);
  } catch (error) {
    console.error(`Errore nell'analisi del package ${packageSrcFolder}:`, error);
    throw new Error(`Impossibile analizzare il package ${packageSrcFolder}: ${error.message}`);
  }
}

async getProjectDependencies(projectSrcFolder)
Analizza tutti i package in un progetto e restituisce un report completo.

async getProjectDependencies(projectSrcFolder) {
  try {
    // Trova tutti i package nel progetto
    const packages = await this.findJavaPackages(projectSrcFolder);
    
    // Analizza ogni package in parallelo
    const packageReports = await Promise.all(
      packages.map(pkg => this.getPackageDependencies(pkg))
    );
    
    // Crea il report del progetto
    const projectName = path.basename(projectSrcFolder);
    return new ProjectDepsReport(projectName, packageReports);
  } catch (error) {
    console.error(`Errore nell'analisi del progetto ${projectSrcFolder}:`, error);
    throw new Error(`Impossibile analizzare il progetto ${projectSrcFolder}: ${error.message}`);
  }
}

Metodi di supporto
async findJavaFiles(dir)
Cerca ricorsivamente tutti i file Java in una directory.

async findJavaFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isFile() && entry.name.endsWith('.java')) {
        files.push(fullPath);
      } else if (entry.isDirectory()) {
        const subFiles = await this.findJavaFiles(fullPath);
        files.push(...subFiles);
      }
    }

    return files;
  } catch (error) {
    console.error(`Errore nella ricerca di file Java in ${dir}:`, error);
    return [];
  }
}

async findJavaPackages(projectFolder)
Identifica tutti i package in un progetto analizzando le cartelle che contengono file Java.
async findJavaPackages(projectFolder) {
  try {
    const packages = new Set();
    const javaFiles = await this.findJavaFiles(projectFolder);
    
    // Estrai le cartelle dei package dai percorsi dei file Java
    javaFiles.forEach(file => {
      const dir = path.dirname(file);
      packages.add(dir);
    });
    
    return [...packages];
  } catch (error) {
    console.error(`Errore nella ricerca dei package in ${projectFolder}:`, error);
    return [];
  }
}


2. JavaParser
Analizza i file Java usando la libreria java-parser per estrarre le dipendenze.

Metodi principali
extractDependencies(content)
Estrae le dichiarazioni di import da un file Java.

3. Modelli per i report
ClassDepsReport
Rappresenta le dipendenze di una singola classe.

PackageDepsReport
Aggrega le dipendenze di tutte le classi in un package.

ProjectDepsReport
Aggrega le dipendenze di tutti i package in un progetto.

Gestione dell'asincronia
La libreria sfrutta il modello di programmazione asincrona di Node.js basato su Promises, mediante:

async/await: Per una sintassi più chiara e leggibile
fs.promises: Per operazioni asincrone sul filesystem
Promise.all: Per eseguire analisi in parallelo quando opportuno

Flusso di analisi delle dipendenze
Analisi di una classe:

Lettura asincrona del file
Parsing del contenuto tramite java-parser
Estrazione degli import
Generazione del report
Analisi di un package:

Ricerca ricorsiva dei file Java
Analisi in parallelo di ogni file
Aggregazione delle dipendenze trovate
Generazione del report
Analisi di un progetto:

Identificazione dei package
Analisi in parallelo di ogni package
Aggregazione delle dipendenze trovate
Generazione del report


Sistema di test
Il sistema di test è organizzato per verificare tutti i livelli di analisi:

testClassDependencies: Verifica l'analisi di una singola classe
testPackageDependencies: Verifica l'analisi di un package
testProjectDependencies: Verifica l'analisi di un progetto completo
Per simulare un progetto reale, la utility createTestStructure genera dinamicamente una struttura di test con:

4 package diversi
4 classi Java con varie dipendenze
Dipendenze incrociate tra package
Ottimizzazioni e considerazioni
Esecuzione parallela: Le analisi vengono eseguite in parallelo tramite Promise.all per ottimizzare le prestazioni
Gestione errori: Ogni operazione è racchiusa in blocchi try/catch per gestire correttamente gli errori
Logging: La libreria fornisce log dettagliati per facilitare il debug
Estensibilità: L'architettura modulare permette facili estensioni (es. aggiungere nuovi tipi di analisi)
Deduplicazione: Le dipendenze duplicate vengono rimosse nei report aggregati

Limitazioni attuali
La libreria attualmente estrae solo le dipendenze dichiarate esplicitamente negli import
Non analizza le dipendenze utilizzate nel codice ma non dichiarate negli import
Non gestisce import con wildcard in modo specifico (es. import java.util.*)
Non distingue tra classi e interfacce
Conclusioni
La libreria implementa tutti i requisiti richiesti per l'Assignment #02, parte 1, fornendo un'analisi completa e asincrona delle dipendenze in progetti Java. I test confermano il corretto funzionamento per tutti e tre i livelli di analisi: classi, package e progetti.