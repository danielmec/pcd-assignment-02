class PackageDepsReport {
    constructor(packageName, classReports = []) {
        this.packageName = packageName;
        this.classReports = classReports;
        this.dependencies = this._aggregateDependencies();
    }

    _aggregateDependencies() {  
        const allDependencies = [];
        this.classReports.forEach(classReport => {
        allDependencies.push(...classReport.dependencies);
        });

        return [...new Set(allDependencies)];
    }

    toString() {
        let result = `Package: ${this.packageName}\n`;
        if (this.classReports.length > 0) {
            result += `Classes:\n`;
            this.classReports.forEach(classReport => {
                result += `  - ${classReport.className}\n`;
            });
            result += `Dependencies: ${this.dependencies.join(', ')}\n`;
        } else {
            result += 'No classes\n';
        }
        return result;
    }
    
}
module.exports = PackageDepsReport;