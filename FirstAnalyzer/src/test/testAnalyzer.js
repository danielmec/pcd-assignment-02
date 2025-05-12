import { DependecyAnalyserLib } from '../lib/DependecyAnalyserLib.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTestStructure } from './testStructure.js';
import readline from 'readline';

// In ES Modules non abbiamo __dirname, quindi dobbiamo crearlo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crea un'interfaccia readline per l'input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funzione per fare una domanda all'utente e ottenere una risposta
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

/**
 * Testa l'analisi delle dipendenze di una singola classe
 */
async function testClassDependencies() {
    try {
        const analyzer = new DependecyAnalyserLib();
        
        // Percorso al file di test
        const testFile = path.resolve(__dirname, '../../src/test-data/TestClass.java');
        
        console.log('\n=== Test Analisi Dipendenze Classe ===');
        console.log(`Analizzando il file: ${testFile}`);
        
        const report = await analyzer.getClassDependencies(testFile);
        
        console.log('\nReport delle dipendenze:');
        console.log('-------------------------');
        console.log(`Nome classe: ${report.className}`);
        console.log(`Tipo: ${report.fileType}`);
        if (report.isAbstract) {
            console.log('Classe astratta: Sì');
        }
        if (report.modifiers.length > 0) {
            console.log(`Modificatori: ${report.modifiers.join(', ')}`);
        }
        console.log('Dipendenze trovate:');
        report.dependencies.forEach(dep => console.log(`- ${dep}`));
        
        return true;
    } catch (error) {
        console.error('Test fallito:', error.message);
        return false;
    }
}

/**
 * Testa l'analisi delle dipendenze di un package
 */
async function testPackageDependencies(testRoot) {
    try {
        const analyzer = new DependecyAnalyserLib();
        
        // Percorso al package di test
        const packagePath = path.join(testRoot, 'com/example/service');
        
        console.log('\n=== Test Analisi Dipendenze Package ===');
        console.log(`Analizzando il package: ${packagePath}`);
        
        const report = await analyzer.getPackageDependencies(packagePath);
        
        console.log('\nReport delle dipendenze:');
        console.log('-------------------------');
        console.log(`Nome package: ${report.packageName}`);
        console.log(`Classi analizzate: ${report.classReports.length}`);
        console.log('Dipendenze trovate:');
        report.dependencies.forEach(dep => console.log(`- ${dep}`));
        
        return true;
    } catch (error) {
        console.error('Test fallito:', error.message);
        return false;
    }
}

/**
 * Testa l'analisi delle dipendenze di un progetto
 * con visualizzazione gerarchica di package, file e dipendenze
 */
async function testProjectDependencies(testRoot) {
    try {
        const analyzer = new DependecyAnalyserLib();
        
        console.log('\n=== Test Analisi Dipendenze Progetto ===');
        console.log(`Analizzando il progetto: ${testRoot}`);
        
        const report = await analyzer.getProjectDependencies(testRoot);
        
        console.log('\nReport delle dipendenze:');
        console.log('-------------------------');
        console.log(`Nome progetto: ${report.projectName}`);
        
        // Ordina i package per nome
        const sortedPackages = [...report.packageReports].sort((a, b) => 
            a.packageName.localeCompare(b.packageName)
        );
        
        console.log(`\nDettaglio package (${sortedPackages.length}):`);
        sortedPackages.forEach(pkg => {
            console.log(`\nPackage ${pkg.packageName}:`);
            
            // Ordina le classi per nome
            const sortedClasses = [...pkg.classReports].sort((a, b) => 
                a.className.localeCompare(b.className)
            );
            
            // Visualizza ogni classe e le sue dipendenze
            sortedClasses.forEach(cls => {
                console.log(`File: ${cls.className} (${cls.fileType}${cls.isAbstract ? ', abstract' : ''})`);
                
                // Mostra i modificatori se presenti
                if (cls.modifiers.length > 0) {
                    console.log(`    Modificatori: ${cls.modifiers.join(', ')}`);
                }
                
                // Se non ci sono dipendenze
                if (cls.dependencies.length === 0) {
                    console.log(`    └─ Nessuna dipendenza`);
                    return;
                }
                
                // Ordina le dipendenze alfabeticamente
                const sortedDeps = [...cls.dependencies].sort();
                sortedDeps.forEach((dep, index, array) => {
                    const isLast = index === array.length - 1;
                    // Usa simboli per creare un bell'albero
                    const prefix = isLast ? '    └─ ' : '    ├─ ';
                    console.log(`${prefix}${dep}`);
                });
            });
        });
        
        // Statistiche generali
        console.log('\n Statistiche generali:');
        console.log(`Package totali: ${sortedPackages.length}`);
        console.log(`Classi totali: ${report.packageReports.reduce((sum, pkg) => sum + pkg.classReports.length, 0)}`);
        console.log(`Dipendenze uniche: ${new Set(report.dependencies).size}`);
        const uniqueDependencies = new Set(report.dependencies);
        uniqueDependencies.forEach(dep => {
            console.log(`-> ${dep}`);
        });
        
        
        return true;
    } catch (error) {
        console.error('Test fallito:', error.message);
        return false;
    }
}

/**
 * Analizza un progetto specificato dall'utente
 */
async function analyzeCustomProject(projectPath) {
    try {
        const analyzer = new DependecyAnalyserLib();
        
        console.log('\n=== Analisi Progetto Personalizzato ===');
        console.log(`Analizzando il progetto: ${projectPath}`);
        
        const report = await analyzer.getProjectDependencies(projectPath);
        
        console.log('\nReport delle dipendenze:');
        console.log('-------------------------');
        console.log(`Nome progetto: ${report.projectName}`);
        
        // Ordina i package per nome
        const sortedPackages = [...report.packageReports].sort((a, b) => 
            a.packageName.localeCompare(b.packageName)
        );
        
        console.log(`\nDettaglio package (${sortedPackages.length}):`);
        sortedPackages.forEach(pkg => {
            console.log(`\nPackage ${pkg.packageName}:`);
            
            // Ordina le classi per nome
            const sortedClasses = [...pkg.classReports].sort((a, b) => 
                a.className.localeCompare(b.className)
            );
            
            // Visualizza ogni classe e le sue dipendenze
            sortedClasses.forEach(cls => {
                console.log(`File: ${cls.className} (${cls.fileType}${cls.isAbstract ? ', abstract' : ''})`);
                
                // Mostra i modificatori se presenti
                if (cls.modifiers.length > 0) {
                    console.log(`    Modificatori: ${cls.modifiers.join(', ')}`);
                }
                
                // Se non ci sono dipendenze
                if (cls.dependencies.length === 0) {
                    console.log(`    └─ Nessuna dipendenza`);
                    return;
                }
                
                // Ordina le dipendenze alfabeticamente
                const sortedDeps = [...cls.dependencies].sort();
                sortedDeps.forEach((dep, index, array) => {
                    const isLast = index === array.length - 1;
                    // Usa simboli per creare un bell'albero
                    const prefix = isLast ? '    └─ ' : '    ├─ ';
                    console.log(`${prefix}${dep}`);
                });
            });
        });
        
        // Statistiche generali
        console.log('\n Statistiche generali:');
        console.log(`Package totali: ${sortedPackages.length}`);
        console.log(`Classi totali: ${report.packageReports.reduce((sum, pkg) => sum + pkg.classReports.length, 0)}`);
        console.log(`Dipendenze uniche: ${new Set(report.dependencies).size}`);
        const uniqueDependencies = new Set(report.dependencies);
        uniqueDependencies.forEach(dep => {
            console.log(`-> ${dep}`);
        });
        
        return true;
    } catch (error) {
        console.error('Analisi fallita:', error.message);
        return false;
    }
}

/**
 * Esegue tutti i test in sequenza
 */
async function runAllTests() {
    console.log(' Inizio dei test della libreria DependecyAnalyserLib');
    
    // Test semplice di una classe
    const classResult = await testClassDependencies();
    
    // Crea struttura di test complessa
    const testRoot = await createTestStructure();
    
    // Test package
    const packageResult = await testPackageDependencies(testRoot);
    
    // Test progetto
    const projectResult = await testProjectDependencies(testRoot);
    
    // Riepilogo dei risultati
    console.log('\n Riepilogo dei test:');
    console.log(`- Test Classe: ${classResult ? 'Passato' : 'Fallito'}`);
    console.log(`- Test Package: ${packageResult ? ' Passato' : ' Fallito'}`);
    console.log(`- Test Progetto: ${projectResult ? ' Passato' : 'Fallito'}`);
    
    // Chiedi all'utente se vuole analizzare un altro progetto
    const answer = await askQuestion('\nVuoi analizzare un altro progetto? (s/n): ');
    
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'sì') {
        const projectPath = await askQuestion('Inserisci il percorso del progetto da analizzare: ');
        
        if (projectPath && projectPath.trim() !== '') {
            await analyzeCustomProject(projectPath.trim());
        } else {
            console.log('Percorso non valido. Operazione annullata.');
        }
    }
    
    // Chiude l'interfaccia readline
    rl.close();
}

// Esegui tutti i test
runAllTests();