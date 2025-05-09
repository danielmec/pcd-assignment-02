export class ClassDepsReport {
    constructor(className, dependencies=[], fileType={}) {
        this.className = className;
        this.dependencies = dependencies;
        this.fileType = fileType.type || "UNKNOWN";
        this.isAbstract = fileType.isAbstract || false;
        this.modifiers = fileType.modifiers || [];
    }
    
    toString() {
        let result = `${this.fileType}: ${this.className}\n`;
        if (this.isAbstract) {
            result += `Abstract: Yes\n`;
        }
        if (this.modifiers.length > 0) {
            result += `Modifiers: ${this.modifiers.join(', ')}\n`;
        }
        if (this.dependencies.length > 0) {
            result += `Dependencies: ${this.dependencies.join(', ')}\n`;
        } else {
            result += 'No dependencies\n';
        }
        return result;
    }
}
// Example usage