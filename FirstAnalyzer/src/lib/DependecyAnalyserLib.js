const fs = require('fs').promises;
const path = require('path');
const JavaParser = require('../parser/JavaParser');
const ClassDepsReport = require('../models/ClassDepsReport');
const PackageDepsReport = require('../models/PackageDepsReport');
const ProjectDepsReport = require('../models/ProjectDepsReport');

class DependecyAnalyserLib {
  constructor() {
    this.parser = new JavaParser();
  }

  /**
   * Analizza un file Java per trovare le dipendenze
   * @param {string} classSrcFile - Percorso del file Java
   * @returns {Promise<ClassDepsReport>} - Report con le dipendenze trovate
   */
  async getClassDependencies(classSrcFile) {
    try {
      console.log(`Analizzando il file: ${classSrcFile}`);
      
      // Verifica che il file esista
      await fs.access(classSrcFile);
      console.log("File trovato, lettura in corso...");
      
      // Legge il contenuto del file
      const content = await fs.readFile(classSrcFile, 'utf8');
      console.log(`File letto con successo (${content.length} caratteri)`);
      
      // Estrae le dipendenze usando il parser
      console.log("Estrazione delle dipendenze...");
      const dependencies = this.parser.extractDependencies(content);
      console.log(`Estratte ${dependencies.length} dipendenze`);
      
      // Crea e restituisce il report
      const className = path.basename(classSrcFile, '.java');
      return new ClassDepsReport(className, dependencies);
    } catch (error) {
      console.error(`Errore nell'analisi del file ${classSrcFile}:`, error);
      throw new Error(`Impossibile analizzare il file ${classSrcFile}: ${error.message}`);
    }
  }

  /**
   * Analizza un package Java per trovare le dipendenze
   * @param {string} packageSrcFolder - Percorso della cartella del package
   * @returns {Promise<PackageDepsReport>} - Report con le dipendenze trovate
   */
  async getPackageDependencies(packageSrcFolder) {
    try {
      console.log(`Analizzando il package: ${packageSrcFolder}`);
      
      // Trova tutti i file Java nella cartella
      const javaFiles = await this.findJavaFiles(packageSrcFolder);
      console.log(`Trovati ${javaFiles.length} file Java nel package`);
      
      // Analizza ogni file Java
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

  /**
   * Implementazione base per trovare tutti i file Java in una directory
   */
  async findJavaFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile() && entry.name.endsWith('.java')) {
          files.push(fullPath);
        } else if (entry.isDirectory()) {
          // Recursively search in subdirectories
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

  /**
   * Trova tutti i package in un progetto
   */
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

  /**
   * Analizza un intero progetto Java per trovare le dipendenze
   * @param {string} projectSrcFolder - Percorso della cartella root del progetto
   * @returns {Promise<ProjectDepsReport>} - Report con le dipendenze trovate
   */
  async getProjectDependencies(projectSrcFolder) {
    try {
      console.log(`Analizzando il progetto: ${projectSrcFolder}`);
      
      // Trova tutti i package nel progetto
      let packages = await this.findJavaPackages(projectSrcFolder);
      
      // Ordina i package alfabeticamente
      packages = packages.sort();
      console.log(`Trovati ${packages.length} package nel progetto`);
      
      // Analizza ogni package
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

  // Altri metodi verranno implementati successivamente
}

module.exports = DependecyAnalyserLib;