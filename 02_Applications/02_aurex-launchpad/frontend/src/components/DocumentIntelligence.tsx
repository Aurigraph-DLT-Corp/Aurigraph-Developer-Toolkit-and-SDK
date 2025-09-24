import React, { useState, useRef, useCallback } from 'react';

interface DocumentData {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: Date;
  processed: boolean;
  extractedData?: any;
  analysis?: DocumentAnalysis;
}

interface DocumentAnalysis {
  documentType: string;
  confidence: number;
  extractedFields: ExtractedField[];
  complianceCheck: ComplianceResult;
  insights: string[];
  warnings: string[];
}

interface ExtractedField {
  label: string;
  value: string | number;
  confidence: number;
  location?: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ComplianceResult {
  framework: string;
  score: number;
  requiredFields: string[];
  missingFields: string[];
  recommendations: string[];
}

const DocumentIntelligence: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated AI document processing
  const processDocument = async (file: File): Promise<DocumentAnalysis> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate AI extraction based on document type
    const analysis: DocumentAnalysis = {
      documentType: file.name.toLowerCase().includes('sustainability') ? 'Sustainability Report' : 
                   file.name.toLowerCase().includes('ghg') ? 'GHG Report' :
                   file.name.toLowerCase().includes('annual') ? 'Annual Report' : 'ESG Document',
      confidence: 0.85 + Math.random() * 0.1,
      extractedFields: generateExtractedFields(file.name),
      complianceCheck: generateComplianceResult(),
      insights: generateInsights(),
      warnings: generateWarnings()
    };

    return analysis;
  };

  const generateExtractedFields = (filename: string): ExtractedField[] => {
    const baseFields = [
      { label: 'Company Name', value: 'Sample Corporation', confidence: 0.95 },
      { label: 'Reporting Period', value: '2023', confidence: 0.90 },
      { label: 'Total GHG Emissions', value: 125000, confidence: 0.88 },
      { label: 'Scope 1 Emissions', value: 45000, confidence: 0.87 },
      { label: 'Scope 2 Emissions', value: 35000, confidence: 0.85 },
      { label: 'Scope 3 Emissions', value: 45000, confidence: 0.82 },
      { label: 'Energy Consumption', value: 500000, confidence: 0.89 },
      { label: 'Water Usage', value: 12000, confidence: 0.86 },
      { label: 'Waste Generated', value: 800, confidence: 0.84 }
    ];

    if (filename.toLowerCase().includes('sustainability')) {
      baseFields.push(
        { label: 'Employee Count', value: 5000, confidence: 0.91 },
        { label: 'Safety Incidents', value: 12, confidence: 0.88 },
        { label: 'Community Investment', value: 250000, confidence: 0.85 }
      );
    }

    return baseFields.map(field => ({
      ...field,
      location: {
        page: Math.floor(Math.random() * 5) + 1,
        x: Math.random() * 500,
        y: Math.random() * 700,
        width: 200,
        height: 20
      }
    }));
  };

  const generateComplianceResult = (): ComplianceResult => {
    const frameworks = ['GRI', 'SASB', 'TCFD', 'CDP'];
    const selectedFramework = frameworks[Math.floor(Math.random() * frameworks.length)];
    
    return {
      framework: selectedFramework,
      score: 75 + Math.random() * 20,
      requiredFields: ['GHG Emissions', 'Energy Consumption', 'Water Usage', 'Waste Data'],
      missingFields: ['Employee Diversity', 'Board Composition'],
      recommendations: [
        'Include Scope 3 emissions breakdown by category',
        'Add verification statement for GHG data',
        'Provide more detailed water usage by source',
        'Include forward-looking targets and commitments'
      ]
    };
  };

  const generateInsights = (): string[] => {
    return [
      'GHG emissions intensity has improved by 12% compared to industry average',
      'Scope 3 emissions represent 36% of total carbon footprint',
      'Energy consumption shows 8% reduction year-over-year',
      'Water usage efficiency is above sector benchmark',
      'Report completeness score: 85% for SASB framework'
    ];
  };

  const generateWarnings = (): string[] => {
    const warnings = [
      'Missing third-party verification for GHG data',
      'Scope 3 emissions calculation methodology not clearly specified',
      'Some data points lack sufficient granularity for benchmarking'
    ];
    
    return warnings.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setIsProcessing(true);
    
    for (const file of files) {
      const documentData: DocumentData = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        processed: false
      };
      
      // Add document to list
      setDocuments(prev => [...prev, documentData]);
      
      try {
        // Process document with AI
        const analysis = await processDocument(file);
        
        // Update document with analysis
        setDocuments(prev => prev.map(doc => 
          doc.id === documentData.id 
            ? { ...doc, processed: true, analysis }
            : doc
        ));
      } catch (error) {
        console.error('Error processing document:', error);
        // Handle error state
        setDocuments(prev => prev.map(doc => 
          doc.id === documentData.id 
            ? { ...doc, processed: true, analysis: undefined }
            : doc
        ));
      }
    }
    
    setIsProcessing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadAnalysisReport = (document: DocumentData) => {
    if (!document.analysis) return;
    
    const report = {
      documentName: document.filename,
      processedAt: new Date().toISOString(),
      documentType: document.analysis.documentType,
      confidence: document.analysis.confidence,
      extractedData: document.analysis.extractedFields,
      compliance: document.analysis.complianceCheck,
      insights: document.analysis.insights,
      warnings: document.analysis.warnings
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.filename}-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🤖 AI Document Intelligence
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Advanced AI-powered document processing for ESG reports, sustainability documents, 
          and compliance filings with automated data extraction and analysis.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="font-semibold text-blue-900 mb-1">Smart Extraction</h3>
          <p className="text-sm text-blue-700">AI extracts key data points with confidence scoring</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-green-900 mb-1">Compliance Check</h3>
          <p className="text-sm text-green-700">Automated compliance scoring against frameworks</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-purple-900 mb-1">Smart Insights</h3>
          <p className="text-sm text-purple-700">AI-generated insights and benchmarking</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-semibold text-orange-900 mb-1">Instant Reports</h3>
          <p className="text-sm text-orange-700">Professional analysis reports in seconds</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Upload Your ESG Documents
          </h3>
          <p className="text-gray-500 mb-6">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Supports: PDF, DOCX, DOC, TXT, CSV, XLSX • Max size: 50MB per file
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.csv,.xlsx"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isProcessing ? 'Processing...' : 'Choose Files'}
          </button>
        </div>
      </div>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Processed Documents</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documents.map((document) => (
              <div key={document.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Document Header */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {document.type.includes('pdf') ? '📄' : 
                         document.type.includes('doc') ? '📝' : 
                         document.type.includes('sheet') ? '📊' : '📋'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate max-w-xs">
                          {document.filename}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(document.size)} • {document.uploadedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {document.processed ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                          ✅ Processed
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                          ⏳ Processing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Analysis Results */}
                {document.analysis && (
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Document Analysis</h4>
                        <span className="text-sm text-gray-600">
                          Confidence: {(document.analysis.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 font-medium">
                        {document.analysis.documentType}
                      </p>
                    </div>

                    {/* Key Extracted Fields */}
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Key Extracted Data</h5>
                      <div className="grid grid-cols-2 gap-3">
                        {document.analysis.extractedFields.slice(0, 4).map((field, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded">
                            <div className="text-xs font-medium text-gray-600">{field.label}</div>
                            <div className="font-semibold text-gray-900">{field.value}</div>
                            <div className="text-xs text-gray-500">
                              {(field.confidence * 100).toFixed(0)}% confidence
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Compliance Score */}
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Compliance Assessment</h5>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-blue-900">
                            {document.analysis.complianceCheck.framework} Framework
                          </span>
                          <span className="font-bold text-blue-600">
                            {document.analysis.complianceCheck.score.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${document.analysis.complianceCheck.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Insights */}
                    {document.analysis.insights.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">AI Insights</h5>
                        <div className="space-y-1">
                          {document.analysis.insights.slice(0, 2).map((insight, index) => (
                            <div key={index} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                              💡 {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedDocument(document)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => downloadAnalysisReport(document)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        📋 Download Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis Modal */}
      {selectedDocument && selectedDocument.analysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDocument.filename}</h2>
                  <p className="text-gray-600">{selectedDocument.analysis.documentType}</p>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Detailed Analysis Content */}
              <div className="space-y-6">
                {/* All Extracted Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Data Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDocument.analysis.extractedFields.map((field, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="text-lg font-bold text-blue-600 my-1">{field.value}</div>
                        <div className="text-sm text-gray-500">
                          Confidence: {(field.confidence * 100).toFixed(1)}%
                          {field.location && ` • Page ${field.location.page}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Compliance Assessment</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">Required Fields Present</h4>
                        <ul className="space-y-1">
                          {selectedDocument.analysis.complianceCheck.requiredFields.map((field, index) => (
                            <li key={index} className="text-sm text-green-700">✅ {field}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">Missing Fields</h4>
                        <ul className="space-y-1">
                          {selectedDocument.analysis.complianceCheck.missingFields.map((field, index) => (
                            <li key={index} className="text-sm text-red-700">❌ {field}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {selectedDocument.analysis.complianceCheck.recommendations.map((rec, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-sm text-yellow-800">💡 {rec}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings */}
                {selectedDocument.analysis.warnings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Warnings</h3>
                    <div className="space-y-2">
                      {selectedDocument.analysis.warnings.map((warning, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-sm text-red-800">⚠️ {warning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentIntelligence;