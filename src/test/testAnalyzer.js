const DependecyAnalyserLib = require('../lib/DependecyAnalyserLib');
const path = require('path');
const { createTestStructure } = require('./testStructure');

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
        console.error('❌❌❌❌❌  Test fallito:', error.message);
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
        console.error('❌ Test fallito:', error.message);
        return false;
    }
}

/**
 * Testa l'analisi delle dipendenze di un progetto
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
        
        // Ordina e visualizza i package
        const sortedPackages = [...report.packageReports].sort((a, b) => 
            a.packageName.localeCompare(b.packageName)
        );
        
        console.log(`Package analizzati (${sortedPackages.length}):`);
        sortedPackages.forEach(pkg => {
            console.log(`- ${pkg.packageName}: ${pkg.dependencies.length} dipendenze`);
        });
        
        // Ordina e visualizza le dipendenze
        const uniqueDeps = [...new Set(report.dependencies)].sort();
        
        console.log(`\nDipendenze trovate (${uniqueDeps.length}):`);
        uniqueDeps.forEach(dep => console.log(`- ${dep}`));
        
        return true;
    } catch (error) {
        console.error('❌ Test fallito:', error.message);
        return false;
    }
}

/**
 * Testa il rilevamento delle relazioni di ereditarietà
 */
async function testInheritanceDependencies(testRoot) {
    try {
        const analyzer = new DependecyAnalyserLib();
        
        console.log('\n=== Test Analisi Relazioni di Ereditarietà ===');
        
        // Test Employee.java (interfaccia che estende Person)
        const employeeFile = path.join(testRoot, 'com/example/model/Employee.java');
        console.log(`\nAnalizzando ${employeeFile}`);
        const employeeReport = await analyzer.getClassDependencies(employeeFile);
        
        console.log('Employee dipendenze:');
        console.log(`- Import: ${employeeReport.dependencies.filter(d => !d.includes('Person')).join(', ')}`);
        console.log(`- Extends: ${employeeReport.dependencies.filter(d => d.includes('Person')).join(', ')}`);
        
        // Test User.java (classe che estende BaseEntity e implementa Person)
        const userFile = path.join(testRoot, 'com/example/model/User.java');
        console.log(`\nAnalizzando ${userFile}`);
        const userReport = await analyzer.getClassDependencies(userFile);
        
        console.log('User dipendenze:');
        console.log(`- Import: ${userReport.dependencies.filter(d => !d.includes('BaseEntity') && !d.includes('Person')).join(', ')}`);
        console.log(`- Extends/Implements: ${userReport.dependencies.filter(d => d.includes('BaseEntity') || d.includes('Person')).join(', ')}`);
        
        return true;
    } catch (error) {
        console.error('❌ Test fallito:', error.message);
        return false;
    }
}

/**
 * Esegue tutti i test in sequenza
 */
async function runAllTests() {
    console.log('🚀 Inizio dei test della libreria DependecyAnalyserLib');
    
    // Test semplice di una classe
    const classResult = await testClassDependencies();
    
    // Crea struttura di test complessa
    const testRoot = await createTestStructure();
    
    // Test package
    const packageResult = await testPackageDependencies(testRoot);
    
    // Test progetto
    const projectResult = await testProjectDependencies(testRoot);
    
    // Test relazioni di ereditarietà
    const inheritanceResult = await testInheritanceDependencies(testRoot);
    
    // Riepilogo dei risultati
    console.log('\n📝 Riepilogo dei test:');
    console.log(`- Test Classe: ${classResult ? '✅ Passato' : '❌ Fallito'}`);
    console.log(`- Test Package: ${packageResult ? '✅ Passato' : '❌ Fallito'}`);
    console.log(`- Test Progetto: ${projectResult ? '✅ Passato' : '❌ Fallito'}`);
    console.log(`- Test Ereditarietà: ${inheritanceResult ? '✅ Passato' : '❌ Fallito'}`);
}

// Esegui tutti i test
runAllTests();