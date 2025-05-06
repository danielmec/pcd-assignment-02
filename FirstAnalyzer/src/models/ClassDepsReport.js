export class ClassDepsReport {
    constructor(className, dependencies=[]) {
        this.className = className;
        this.dependencies = dependencies;
    }
    
    toString() {
        let result = `Class: ${this.className}\n`;
        if (this.dependencies.length > 0) {
            result += `Dependencies: ${this.dependencies.join(', ')}\n`;
        } else {
            result += 'No dependencies\n';
        }
        return result;
    }
}
// Example usage