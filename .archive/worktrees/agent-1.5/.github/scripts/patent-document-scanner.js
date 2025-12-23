#!/usr/bin/env node

/**
 * Patent Document Scanner
 * Identifies and categorizes patent-related documents in the repository
 */

const fs = require('fs');
const path = require('path');

class PatentDocumentScanner {
  constructor() {
    this.patentKeywords = [
      'patent', 'invention', 'intellectual property', 'ip', 'prior art',
      'novelty', 'non-obvious', 'utility', 'claims', 'specification',
      'embodiment', 'disclosure', 'innovative', 'proprietary'
    ];
    
    this.technicalKeywords = [
      'algorithm', 'method', 'system', 'apparatus', 'device',
      'process', 'technique', 'implementation', 'architecture',
      'protocol', 'framework', 'mechanism', 'solution'
    ];
    
    this.technologyAreas = {
      quantum: ['quantum', 'qubit', 'superposition', 'entanglement', 'quantum computing'],
      consensus: ['consensus', 'raft', 'pbft', 'proof of stake', 'proof of work', 'byzantine'],
      crossChain: ['cross-chain', 'bridge', 'interoperability', 'multi-chain'],
      ai: ['artificial intelligence', 'machine learning', 'neural network', 'ai', 'ml'],
      security: ['cryptography', 'encryption', 'security', 'hash', 'signature'],
      blockchain: ['blockchain', 'distributed ledger', 'smart contract', 'transaction']
    };
    
    this.patternMatchers = {
      patentFiles: [
        /patent/i,
        /intellectual.property/i,
        /invention/i,
        /disclosure/i,
        /prior.art/i
      ],
      technicalDocs: [
        /specification/i,
        /technical/i,
        /architecture/i,
        /design/i,
        /whitepaper/i,
        /research/i
      ],
      legalDocs: [
        /legal/i,
        /license/i,
        /copyright/i,
        /trademark/i,
        /agreement/i,
        /contract/i
      ]
    };
    
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /target/,
      /build/,
      /dist/,
      /\.class$/,
      /\.jar$/,
      /\.log$/,
      /\.tmp$/
    ];
    
    this.includeExtensions = [
      '.md', '.txt', '.pdf', '.doc', '.docx', '.rtf',
      '.tex', '.rst', '.adoc', '.html', '.xml',
      '.json', '.yaml', '.yml'
    ];
  }

  shouldExclude(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  shouldInclude(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.includeExtensions.includes(ext);
  }

  analyzeContent(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      
      const stats = fs.statSync(filePath);
      if (stats.size > 10 * 1024 * 1024) return null; // Skip files > 10MB
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lowerContent = content.toLowerCase();
      
      const analysis = {
        patentScore: 0,
        technicalScore: 0,
        keywords: [],
        technology: [],
        category: 'unknown'
      };
      
      // Check for patent keywords
      this.patentKeywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        if (matches) {
          analysis.patentScore += matches.length;
          analysis.keywords.push(keyword);
        }
      });
      
      // Check for technical keywords
      this.technicalKeywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        if (matches) {
          analysis.technicalScore += matches.length;
          analysis.keywords.push(keyword);
        }
      });
      
      // Identify technology areas
      Object.entries(this.technologyAreas).forEach(([tech, keywords]) => {
        keywords.forEach(keyword => {
          if (lowerContent.includes(keyword)) {
            analysis.technology.push(tech);
          }
        });
      });
      
      // Remove duplicates
      analysis.keywords = [...new Set(analysis.keywords)];
      analysis.technology = [...new Set(analysis.technology)];
      
      return analysis;
    } catch (error) {
      console.warn(`Warning: Could not analyze content of ${filePath}: ${error.message}`);
      return null;
    }
  }

  categorizeDocument(filePath, analysis) {
    const fileName = path.basename(filePath).toLowerCase();
    const dirPath = path.dirname(filePath).toLowerCase();
    
    // Check file name patterns
    if (this.patternMatchers.patentFiles.some(pattern => pattern.test(fileName))) {
      return 'patent';
    }
    
    if (this.patternMatchers.legalDocs.some(pattern => pattern.test(fileName))) {
      return 'legal';
    }
    
    if (this.patternMatchers.technicalDocs.some(pattern => pattern.test(fileName))) {
      return 'technical';
    }
    
    // Check directory patterns
    if (/patent|ip|intellectual.property|invention/.test(dirPath)) {
      return 'patent';
    }
    
    if (/legal|license|copyright/.test(dirPath)) {
      return 'legal';
    }
    
    if (/docs|documentation|spec|technical/.test(dirPath)) {
      return 'technical';
    }
    
    // Check content analysis
    if (analysis) {
      if (analysis.patentScore > 5) {
        return 'patent';
      }
      
      if (analysis.patentScore > 2 && analysis.technicalScore > 3) {
        return 'invention';
      }
      
      if (analysis.technicalScore > 5) {
        return 'technical';
      }
    }
    
    // Check for specific file types
    if (fileName.includes('readme') || fileName.includes('whitepaper')) {
      return 'technical';
    }
    
    if (fileName.includes('license') || fileName.includes('copyright')) {
      return 'legal';
    }
    
    return 'other';
  }

  scanDirectory(dirPath, results = []) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        
        if (this.shouldExclude(fullPath)) {
          continue;
        }
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          this.scanDirectory(fullPath, results);
        } else if (stats.isFile() && this.shouldInclude(fullPath)) {
          const analysis = this.analyzeContent(fullPath);
          const category = this.categorizeDocument(fullPath, analysis);
          
          // Only include documents that might be patent-related
          if (category !== 'other' || (analysis && (analysis.patentScore > 0 || analysis.technicalScore > 2))) {
            results.push({
              path: fullPath,
              relativePath: path.relative(process.cwd(), fullPath),
              fileName: path.basename(fullPath),
              size: stats.size,
              lastModified: stats.mtime.toISOString(),
              category: category,
              analysis: analysis,
              keywords: analysis?.keywords || [],
              technology: analysis?.technology || [],
              archivePath: `${category}/${path.relative(process.cwd(), fullPath)}`
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
    }
    
    return results;
  }

  filterByType(documents, documentTypes) {
    if (documentTypes === 'all') {
      return documents;
    }
    
    const typeMap = {
      'patents-only': ['patent'],
      'technical-docs': ['technical', 'invention'],
      'legal-docs': ['legal'],
      'invention-disclosures': ['invention']
    };
    
    const allowedCategories = typeMap[documentTypes] || [];
    return documents.filter(doc => allowedCategories.includes(doc.category));
  }

  generateReport(documents) {
    const report = {
      totalDocuments: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      categories: {},
      technologies: {},
      allDocuments: documents
    };
    
    // Group by category
    documents.forEach(doc => {
      if (!report.categories[doc.category]) {
        report.categories[doc.category] = [];
      }
      report.categories[doc.category].push(doc);
    });
    
    // Group by technology
    documents.forEach(doc => {
      doc.technology.forEach(tech => {
        if (!report.technologies[tech]) {
          report.technologies[tech] = [];
        }
        report.technologies[tech].push(doc);
      });
    });
    
    // Create convenience arrays
    report.patentDocuments = report.categories.patent || [];
    report.technicalDocuments = report.categories.technical || [];
    report.legalDocuments = report.categories.legal || [];
    report.inventionDisclosures = report.categories.invention || [];
    
    return report;
  }

  scan(documentTypes = 'all', outputFile = null) {
    console.log('🔍 Scanning repository for patent-related documents...');
    
    const documents = this.scanDirectory(process.cwd());
    const filteredDocuments = this.filterByType(documents, documentTypes);
    const report = this.generateReport(filteredDocuments);
    
    console.log(`📊 Scan completed:`);
    console.log(`  Total documents: ${report.totalDocuments}`);
    console.log(`  Patent documents: ${report.patentDocuments.length}`);
    console.log(`  Technical documents: ${report.technicalDocuments.length}`);
    console.log(`  Legal documents: ${report.legalDocuments.length}`);
    console.log(`  Invention disclosures: ${report.inventionDisclosures.length}`);
    console.log(`  Total size: ${(report.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      console.log(`📄 Results saved to: ${outputFile}`);
    }
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const getArg = (name) => {
    const index = args.indexOf(`--${name}`);
    return index !== -1 ? args[index + 1] : null;
  };
  
  const mode = getArg('mode') || 'full-export';
  const types = getArg('types') || 'all';
  const output = getArg('output') || 'patent-documents-scan.json';
  
  const scanner = new PatentDocumentScanner();
  
  try {
    const report = scanner.scan(types, output);
    
    if (report.totalDocuments === 0) {
      console.log('⚠️ No patent-related documents found');
      process.exit(0);
    }
    
    console.log('✅ Patent document scan completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Scan failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = PatentDocumentScanner;
