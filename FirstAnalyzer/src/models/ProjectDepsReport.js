class ProjectDepsReport {
    constructor(projectName, packageReports = []) {
        this.projectName = projectName;
        this.packageReports = packageReports;
        this.dependencies = this._aggregateDependencies();
    }
    _aggregateDependencies() {  
        const allDependencies = [];
        this.packageReports.forEach(packageReport => {
            packageReport.classReports.forEach(classReport => {
                allDependencies.push(...classReport.dependencies);
            });
        });

        return [...new Set(allDependencies)];
    }
    toString() {
        let result = `Project: ${this.projectName}\n`;
        if (this.packageReports.length > 0) {
            result += `Packages:\n`;
            this.packageReports.forEach(packageReport => {
                result += `  - ${packageReport.packageName}\n`;
            });
            result += `Dependencies: ${this.dependencies.join(', ')}\n`;
        } else {
            result += 'No packages\n';
        }
        return result;
    }
}
module.exports = ProjectDepsReport;
// Example usage