# Java Dependency Analyzer

## Overview

The Java Dependency Analyzer is a tool that examines Java source code to identify and report dependencies between classes and packages. The tool scans Java files to extract import statements and other dependency indicators, building a comprehensive view of how components in your Java project are interconnected.

## Features

- Analyzes individual Java class files to identify their dependencies
- Examines entire Java packages to create package-level dependency reports
- Builds project-wide dependency maps showing relationships between all components
- Recursively processes nested directories and package structures
- Generates structured reports for classes, packages, and entire projects

## Usage


It needs Node.js to execute

The analyzer can be executed with:

npm install

node src/test/testAnalyzer.js

