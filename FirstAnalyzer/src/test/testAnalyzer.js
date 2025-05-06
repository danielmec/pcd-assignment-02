import { DependecyAnalyserLib } from '../lib/DependecyAnalyserLib.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTestStructure } from './testStructure.js';

// In ES Modules non abbiamo __dirname, quindi dobbiamo crearlo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                console.log(`File: ${cls.className}`);
                
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
 * Testa il rilevamento delle relazioni di ereditarietà
 */
async function testInheritanceDependencies(testRoot) {
    try {
        // Analizza file Employee.java
        const employeeAnalyzer = new DependecyAnalyserLib(); 
        const employeeReport = await employeeAnalyzer.getClassDependencies(path.join(testRoot, '/com/example/model/Employee.java'));
        console.log("Employee dipendenze:");
        console.log(`- Import: ${employeeReport.dependencies.filter(d => !d.includes('Person')).join(', ')}`);
        console.log(`- Extends: ${employeeReport.dependencies.filter(d => d.includes('Person')).join(', ')}`);

        // Analizza file User.java
        const userAnalyzer = new DependecyAnalyserLib(); 
        const userReport = await userAnalyzer.getClassDependencies(path.join(testRoot, '/com/example/model/User.java'));
        console.log("User dipendenze:");
        console.log(`- Import: ${userReport.dependencies.filter(d => !d.includes('BaseEntity') && !d.includes('Person')).join(', ')}`);
        console.log(`- Extends/Implements: ${userReport.dependencies.filter(d => d.includes('BaseEntity') || d.includes('Person')).join(', ')}`);
        
        return true;
    } catch (error) {
        console.error('Test fallito:', error.message);
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
    // const packageResult = await testPackageDependencies(testRoot);
    
    // Test progetto
    const projectResult = await testProjectDependencies(testRoot);
    
    // Test relazioni di ereditarietà
    //const inheritanceResult = await testInheritanceDependencies(testRoot);
    
    // Riepilogo dei risultati
    console.log('\n Riepilogo dei test:');
    console.log(`- Test Classe: ${classResult ? 'Passato' : 'Fallito'}`);
    //console.log(`- Test Package: ${packageResult ? ' Passato' : ' Fallito'}`);
    console.log(`- Test Progetto: ${projectResult ? ' Passato' : 'Fallito'}`);
    //console.log(`- Test Ereditarietà: ${inheritanceResult ? ' Passato' : ' Fallito'}`);
}

// Esegui tutti i test
runAllTests();