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





electron:
# Riassunto dell'applicazione Java Dependency Analyzer

## Cosa fa l'applicazione

Java Dependency Analyzer è un'applicazione desktop che permette di analizzare le dipendenze nei progetti Java. L'applicazione:

1. **Scansiona progetti Java** selezionati dall'utente
2. **Estrae le dipendenze** da ogni file Java trovato
3. **Visualizza graficamente** le relazioni tra classi tramite un grafo interattivo
4. **Fornisce statistiche** sul numero di file analizzati e dipendenze trovate

## Tecnologie utilizzate

### Framework principale
- **Electron**: framework per lo sviluppo di applicazioni desktop multi-piattaforma usando tecnologie web

### Backend (Main Process)
- **Node.js**: ambiente di esecuzione JavaScript lato server
- **RxJS**: libreria per programmazione reattiva, utilizzata per gestire gli stream di dati durante l'analisi
- **fs.promises**: API del filesystem di Node.js per operazioni asincrone
- **IPC (Inter-Process Communication)**: meccanismo di comunicazione tra il processo principale e il renderer

### Frontend (Renderer Process)
- **React**: libreria JavaScript per costruire interfacce utente
- **D3.js**: libreria per la visualizzazione di dati, utilizzata per creare il grafo delle dipendenze
- **Babel**: compilatore JavaScript per la compatibilità con la sintassi JSX

### Parser Java
- **JavaParser**: modulo personalizzato per analizzare i file Java ed estrarre le dipendenze

### Architettura
- **Pattern MVC**: separazione tra modelli (analyzer.js), viste (componenti React) e controller (main.js)
- **Architettura a componenti**: UI organizzata in componenti React modulari (FileSelector, StatusPanel, DependencyGraph)
- **Modello Publisher-Subscriber**: per la comunicazione asincrona durante l'analisi

## Flusso di lavoro dell'applicazione

1. L'utente seleziona una directory di un progetto Java
2. L'app scansiona ricorsivamente la directory cercando file `.java`
3. Ogni file trovato viene analizzato per estrarre le sue dipendenze
4. I risultati vengono inviati incrementalmente all'interfaccia utente
5. L'interfaccia mostra un grafo interattivo delle dipendenze trovate
6. L'utente può interrompere l'analisi in qualsiasi momento

## Caratteristiche distintive

- **Analisi asincrona**: l'interfaccia rimane reattiva durante l'analisi di progetti grandi
- **Visualizzazione interattiva**: il grafo delle dipendenze supporta zoom, pan e selezione dei nodi
- **Differenziazione visiva**: nel grafo, le classi del progetto e le dipendenze esterne sono visivamente distinte
- **Aggiornamento in tempo reale**: le statistiche si aggiornano durante l'analisi

Questa applicazione combina l'efficienza di Node.js per l'analisi del codice con la flessibilità delle tecnologie web per l'interfaccia utente, il tutto integrato in un'applicazione desktop nativa grazie a Electron.



spiegazione: 
# Architettura e flusso dell'applicazione Electron Analyzer

## Struttura generale

L'applicazione Electron è organizzata secondo il pattern standard di Electron, con due processi principali:

1. **Main Process (Backend)**: Gestisce l'applicazione e l'accesso al filesystem
2. **Renderer Process (Frontend)**: Gestisce l'interfaccia utente con React

## Flusso dell'applicazione

### 1. Avvio applicazione
- `main.js` avvia l'applicazione Electron
- Crea una BrowserWindow con il preload script
- Carica index.html nel renderer process

### 2. Caricamento UI
- index.html carica React, D3 e i componenti JSX
- I componenti vengono renderizzati nell'elemento root
- `App.jsx` configura i listener per gli eventi IPC

### 3. Selezione progetto
- L'utente interagisce con `FileSelector.jsx`
- Quando clicca "Sfoglia":
  - `window.electron.openDirectoryDialog()` viene chiamato
  - Questo attiva un evento IPC (`open-directory-dialog`)
  - `main.js` riceve l'evento e apre una dialog nativa con `dialog.showOpenDialog()`
  - Il percorso selezionato ritorna al renderer

### 4. Analisi del progetto
- L'utente clicca "Avvia Analisi" in `App.jsx`
- `window.electron.analyzeProject(path)` viene chiamato
- **Main Process**:
  1. `main.js` riceve la richiesta IPC (`analyze-project`)
  2. Chiama `analyzeProject(directoryPath)` da `analyzer.js`
  3. `analyzer.js` scansiona ricorsivamente la directory cercando file `.java`
  4. Per ogni file Java trovato:
     - Legge il contenuto
     - Chiama `parseJavaFile(content)` da `parser-adapter.js`
     - `parser-adapter.js` usa `JavaParser.js` per estrarre le dipendenze
     - Restituisce un oggetto con il nome del file e le dipendenze
  5. I risultati vengono inviati al renderer tramite eventi `dependency-update`

### 5. Visualizzazione risultati
- Il preload script riceve gli eventi IPC e li espone al renderer tramite callbacks
- `App.jsx` riceve i dati tramite `window.electron.onDependencyUpdate(callback)`
- I dati vengono aggiunti allo stato React dell'App
- `DependencyGraph.jsx` riceve i dati e costruisce il grafo con D3.js

## Componenti chiave

### Nel Main Process:

1. **main.js**:
   - Crea la finestra dell'applicazione
   - Gestisce gli eventi IPC
   - Coordina l'analisi del progetto

2. **analyzer.js**:
   - Scansiona ricorsivamente la directory
   - Legge i file Java
   - Utilizza RxJS per creare uno stream di risultati

3. **parser-adapter.js**:
   - Interfaccia con JavaParser.js
   - Estrae le dipendenze da ogni file Java

### Nel Renderer Process:

1. **App.jsx**:
   - Componente principale React
   - Gestisce lo stato dell'applicazione
   - Coordina gli altri componenti

2. **FileSelector.jsx**:
   - Gestisce la selezione del percorso del progetto
   - Interagisce con le dialog native tramite IPC

3. **StatusPanel.jsx**:
   - Mostra lo stato dell'analisi e le statistiche

4. **DependencyGraph.jsx**:
   - Costruisce e visualizza il grafo delle dipendenze con D3.js
   - Gestisce interazioni come zoom e drag dei nodi

## Comunicazione tra processi

- **Preload script**:
  - Crea un ponte sicuro tra main e renderer process
  - Espone API limitate tramite `contextBridge.exposeInMainWorld()`
  - Gestisce canali IPC bidirezionali

- **Eventi IPC**:
  - `open-directory-dialog`: Apre il selettore di directory
  - `analyze-project`: Avvia l'analisi
  - `cancel-analysis`: Interrompe un'analisi in corso
  - `dependency-update`: Invia dati delle dipendenze trovate
  - `dependency-error`: Comunica errori nell'analisi
  - `dependency-complete`: Segnala il completamento dell'analisi

Questa architettura separata garantisce sicurezza (il renderer non ha accesso diretto al filesystem) e performance (l'analisi pesante avviene nel main process mentre l'UI rimane reattiva).