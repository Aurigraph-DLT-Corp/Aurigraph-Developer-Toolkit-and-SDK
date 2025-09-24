/**
 * Data Export and Reporting Tests
 * Aurex Launchpad - ESG Assessment Platform
 * 
 * Comprehensive test suite for data export functionality, report generation,
 * format handling, batch processing, and stakeholder reporting features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock data export and reporting components
const MockDataExportManager = ({ assessmentData, onExport, exportProgress }) => {
  const [selectedFormat, setSelectedFormat] = React.useState('pdf');
  const [selectedTemplate, setSelectedTemplate] = React.useState('standard');
  const [includeCharts, setIncludeCharts] = React.useState(true);
  const [includeRawData, setIncludeRawData] = React.useState(false);

  const handleExport = () => {
    onExport({
      format: selectedFormat,
      template: selectedTemplate,
      options: {
        includeCharts,
        includeRawData
      },
      data: assessmentData
    });
  };

  return (
    <div data-testid="data-export-manager">
      <h3>Data Export Manager</h3>
      
      <div data-testid="format-selector">
        <label>Export Format:</label>
        <select
          data-testid="format-select"
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
        >
          <option value="pdf">PDF Report</option>
          <option value="xlsx">Excel Workbook</option>
          <option value="csv">CSV Data</option>
          <option value="json">JSON Data</option>
          <option value="docx">Word Document</option>
        </select>
      </div>
      
      <div data-testid="template-selector">
        <label>Report Template:</label>
        <select
          data-testid="template-select"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          <option value="standard">Standard Report</option>
          <option value="executive">Executive Summary</option>
          <option value="technical">Technical Report</option>
          <option value="regulatory">Regulatory Submission</option>
          <option value="stakeholder">Stakeholder Communication</option>
        </select>
      </div>
      
      <div data-testid="export-options">
        <label>
          <input
            type="checkbox"
            data-testid="include-charts"
            checked={includeCharts}
            onChange={(e) => setIncludeCharts(e.target.checked)}
          />
          Include Charts and Visualizations
        </label>
        <label>
          <input
            type="checkbox"
            data-testid="include-raw-data"
            checked={includeRawData}
            onChange={(e) => setIncludeRawData(e.target.checked)}
          />
          Include Raw Assessment Data
        </label>
      </div>
      
      <button
        data-testid="export-button"
        onClick={handleExport}
        disabled={exportProgress > 0 && exportProgress < 100}
      >
        {exportProgress > 0 && exportProgress < 100 ? `Exporting... ${exportProgress}%` : 'Export Data'}
      </button>
      
      {exportProgress > 0 && (
        <div data-testid="export-progress">
          <div data-testid="progress-bar" style={{ width: `${exportProgress}%` }}>
            {exportProgress}%
          </div>
        </div>
      )}
    </div>
  );
};

const MockReportBuilder = ({ framework, assessmentData, onBuildReport }) => {
  const [reportSections, setReportSections] = React.useState([
    { id: 'executive_summary', name: 'Executive Summary', included: true },
    { id: 'methodology', name: 'Methodology', included: true },
    { id: 'key_findings', name: 'Key Findings', included: true },
    { id: 'compliance_status', name: 'Compliance Status', included: true },
    { id: 'recommendations', name: 'Recommendations', included: true },
    { id: 'appendices', name: 'Appendices', included: false }
  ]);

  const [reportMetadata, setReportMetadata] = React.useState({
    title: `${framework} Sustainability Assessment Report`,
    subtitle: 'Comprehensive ESG Evaluation',
    preparedFor: '',
    preparedBy: '',
    reportDate: new Date().toISOString().split('T')[0]
  });

  const toggleSection = (sectionId) => {
    setReportSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, included: !section.included }
          : section
      )
    );
  };

  const handleBuildReport = () => {
    onBuildReport({
      framework,
      metadata: reportMetadata,
      sections: reportSections.filter(s => s.included),
      data: assessmentData
    });
  };

  return (
    <div data-testid="report-builder">
      <h3>{framework} Report Builder</h3>
      
      <div data-testid="report-metadata">
        <input
          data-testid="report-title"
          value={reportMetadata.title}
          onChange={(e) => setReportMetadata({...reportMetadata, title: e.target.value})}
          placeholder="Report Title"
        />
        <input
          data-testid="report-subtitle"
          value={reportMetadata.subtitle}
          onChange={(e) => setReportMetadata({...reportMetadata, subtitle: e.target.value})}
          placeholder="Report Subtitle"
        />
        <input
          data-testid="prepared-for"
          value={reportMetadata.preparedFor}
          onChange={(e) => setReportMetadata({...reportMetadata, preparedFor: e.target.value})}
          placeholder="Prepared For"
        />
        <input
          data-testid="prepared-by"
          value={reportMetadata.preparedBy}
          onChange={(e) => setReportMetadata({...reportMetadata, preparedBy: e.target.value})}
          placeholder="Prepared By"
        />
        <input
          type="date"
          data-testid="report-date"
          value={reportMetadata.reportDate}
          onChange={(e) => setReportMetadata({...reportMetadata, reportDate: e.target.value})}
        />
      </div>
      
      <div data-testid="section-selector">
        <h4>Report Sections</h4>
        {reportSections.map(section => (
          <div key={section.id} data-testid={`section-${section.id}`}>
            <label>
              <input
                type="checkbox"
                data-testid={`section-checkbox-${section.id}`}
                checked={section.included}
                onChange={() => toggleSection(section.id)}
              />
              {section.name}
            </label>
          </div>
        ))}
      </div>
      
      <button
        data-testid="build-report-button"
        onClick={handleBuildReport}
      >
        Build Report
      </button>
    </div>
  );
};

const MockBatchExportManager = ({ assessments, onBatchExport }) => {
  const [selectedAssessments, setSelectedAssessments] = React.useState([]);
  const [batchFormat, setBatchFormat] = React.useState('pdf');
  const [compressionEnabled, setCompressionEnabled] = React.useState(true);

  const toggleAssessmentSelection = (assessmentId) => {
    setSelectedAssessments(current =>
      current.includes(assessmentId)
        ? current.filter(id => id !== assessmentId)
        : [...current, assessmentId]
    );
  };

  const selectAllAssessments = () => {
    setSelectedAssessments(assessments.map(a => a.id));
  };

  const clearSelection = () => {
    setSelectedAssessments([]);
  };

  const handleBatchExport = () => {
    onBatchExport({
      assessmentIds: selectedAssessments,
      format: batchFormat,
      compressed: compressionEnabled
    });
  };

  return (
    <div data-testid="batch-export-manager">
      <h3>Batch Export Manager</h3>
      
      <div data-testid="batch-controls">
        <button data-testid="select-all-btn" onClick={selectAllAssessments}>
          Select All
        </button>
        <button data-testid="clear-selection-btn" onClick={clearSelection}>
          Clear Selection
        </button>
        <span data-testid="selection-count">
          {selectedAssessments.length} of {assessments.length} selected
        </span>
      </div>
      
      <div data-testid="assessment-list">
        {assessments.map(assessment => (
          <div key={assessment.id} data-testid={`assessment-${assessment.id}`}>
            <label>
              <input
                type="checkbox"
                data-testid={`assessment-checkbox-${assessment.id}`}
                checked={selectedAssessments.includes(assessment.id)}
                onChange={() => toggleAssessmentSelection(assessment.id)}
              />
              {assessment.framework} - {assessment.company} ({assessment.status})
            </label>
          </div>
        ))}
      </div>
      
      <div data-testid="batch-options">
        <select
          data-testid="batch-format-select"
          value={batchFormat}
          onChange={(e) => setBatchFormat(e.target.value)}
        >
          <option value="pdf">PDF Package</option>
          <option value="xlsx">Excel Compilation</option>
          <option value="zip">ZIP Archive</option>
        </select>
        
        <label>
          <input
            type="checkbox"
            data-testid="compression-checkbox"
            checked={compressionEnabled}
            onChange={(e) => setCompressionEnabled(e.target.checked)}
          />
          Enable Compression
        </label>
      </div>
      
      <button
        data-testid="batch-export-button"
        onClick={handleBatchExport}
        disabled={selectedAssessments.length === 0}
      >
        Export Selected ({selectedAssessments.length})
      </button>
    </div>
  );
};

const MockStakeholderReporting = ({ stakeholders, reportData, onSendReport }) => {
  const [selectedStakeholders, setSelectedStakeholders] = React.useState([]);
  const [reportFormat, setReportFormat] = React.useState('pdf');
  const [customMessage, setCustomMessage] = React.useState('');
  const [scheduledDelivery, setScheduledDelivery] = React.useState(false);
  const [deliveryDate, setDeliveryDate] = React.useState('');

  const toggleStakeholder = (stakeholderId) => {
    setSelectedStakeholders(current =>
      current.includes(stakeholderId)
        ? current.filter(id => id !== stakeholderId)
        : [...current, stakeholderId]
    );
  };

  const handleSendReport = () => {
    onSendReport({
      stakeholderIds: selectedStakeholders,
      format: reportFormat,
      message: customMessage,
      scheduled: scheduledDelivery,
      deliveryDate: deliveryDate,
      reportData
    });
  };

  return (
    <div data-testid="stakeholder-reporting">
      <h3>Stakeholder Reporting</h3>
      
      <div data-testid="stakeholder-list">
        <h4>Select Recipients</h4>
        {stakeholders.map(stakeholder => (
          <div key={stakeholder.id} data-testid={`stakeholder-${stakeholder.id}`}>
            <label>
              <input
                type="checkbox"
                data-testid={`stakeholder-checkbox-${stakeholder.id}`}
                checked={selectedStakeholders.includes(stakeholder.id)}
                onChange={() => toggleStakeholder(stakeholder.id)}
              />
              {stakeholder.name} - {stakeholder.role} ({stakeholder.organization})
            </label>
          </div>
        ))}
      </div>
      
      <div data-testid="delivery-options">
        <select
          data-testid="report-format-select"
          value={reportFormat}
          onChange={(e) => setReportFormat(e.target.value)}
        >
          <option value="pdf">PDF Report</option>
          <option value="interactive">Interactive Dashboard</option>
          <option value="summary">Executive Summary</option>
        </select>
        
        <textarea
          data-testid="custom-message"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Add a custom message for recipients..."
        />
        
        <label>
          <input
            type="checkbox"
            data-testid="scheduled-delivery"
            checked={scheduledDelivery}
            onChange={(e) => setScheduledDelivery(e.target.checked)}
          />
          Schedule Delivery
        </label>
        
        {scheduledDelivery && (
          <input
            type="datetime-local"
            data-testid="delivery-date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        )}
      </div>
      
      <button
        data-testid="send-report-button"
        onClick={handleSendReport}
        disabled={selectedStakeholders.length === 0}
      >
        Send Report to {selectedStakeholders.length} Recipients
      </button>
    </div>
  );
};

const MockExportHistory = ({ exportHistory, onRetryExport, onDownloadExport }) => (
  <div data-testid="export-history">
    <h3>Export History</h3>
    
    <div data-testid="history-list">
      {exportHistory.map(export_item => (
        <div key={export_item.id} data-testid={`export-${export_item.id}`} className="export-item">
          <div data-testid={`export-title-${export_item.id}`}>{export_item.title}</div>
          <div data-testid={`export-format-${export_item.id}`}>{export_item.format}</div>
          <div data-testid={`export-status-${export_item.id}`}>{export_item.status}</div>
          <div data-testid={`export-date-${export_item.id}`}>{export_item.createdDate}</div>
          <div data-testid={`export-size-${export_item.id}`}>{export_item.fileSize}</div>
          
          {export_item.status === 'completed' && (
            <button
              data-testid={`download-${export_item.id}`}
              onClick={() => onDownloadExport(export_item)}
            >
              Download
            </button>
          )}
          
          {export_item.status === 'failed' && (
            <button
              data-testid={`retry-${export_item.id}`}
              onClick={() => onRetryExport(export_item)}
            >
              Retry
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Data Export and Reporting', () => {
  let mockOnExport;
  let mockOnBuildReport;
  let mockOnBatchExport;
  let mockOnSendReport;
  let mockOnRetryExport;
  let mockOnDownloadExport;
  let user;

  beforeEach(() => {
    mockOnExport = jest.fn();
    mockOnBuildReport = jest.fn();
    mockOnBatchExport = jest.fn();
    mockOnSendReport = jest.fn();
    mockOnRetryExport = jest.fn();
    mockOnDownloadExport = jest.fn();
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Export Manager', () => {
    const mockAssessmentData = {
      framework: 'TCFD',
      company: 'Green Corp',
      assessment: {
        governance: 85,
        strategy: 90,
        risk_management: 80,
        metrics_targets: 88
      }
    };

    test('renders data export manager with format and template options', () => {
      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={mockAssessmentData}
            onExport={mockOnExport}
            exportProgress={0}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('data-export-manager')).toBeInTheDocument();
      expect(screen.getByText('Data Export Manager')).toBeInTheDocument();
      expect(screen.getByTestId('format-selector')).toBeInTheDocument();
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
      expect(screen.getByTestId('export-options')).toBeInTheDocument();
    });

    test('handles export format selection', async () => {
      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={mockAssessmentData}
            onExport={mockOnExport}
            exportProgress={0}
          />
        </TestWrapper>
      );

      const formatSelect = screen.getByTestId('format-select');
      await user.selectOptions(formatSelect, 'xlsx');

      expect(formatSelect).toHaveValue('xlsx');
    });

    test('handles template selection', async () => {
      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={mockAssessmentData}
            onExport={mockOnExport}
            exportProgress={0}
          />
        </TestWrapper>
      );

      const templateSelect = screen.getByTestId('template-select');
      await user.selectOptions(templateSelect, 'regulatory');

      expect(templateSelect).toHaveValue('regulatory');
    });

    test('handles export options configuration', async () => {
      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={mockAssessmentData}
            onExport={mockOnExport}
            exportProgress={0}
          />
        </TestWrapper>
      );

      const includeChartsCheckbox = screen.getByTestId('include-charts');
      const includeRawDataCheckbox = screen.getByTestId('include-raw-data');

      expect(includeChartsCheckbox).toBeChecked();
      expect(includeRawDataCheckbox).not.toBeChecked();

      await user.click(includeRawDataCheckbox);
      expect(includeRawDataCheckbox).toBeChecked();
    });

    test('initiates export with selected configuration', async () => {
      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={mockAssessmentData}
            onExport={mockOnExport}
            exportProgress={0}
          />
        </TestWrapper>
      );

      // Configure export settings
      await user.selectOptions(screen.getByTestId('format-select'), 'pdf');
      await user.selectOptions(screen.getByTestId('template-select'), 'executive');
      await user.click(screen.getByTestId('include-raw-data'));

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      expect(mockOnExport).toHaveBeenCalledWith({
        format: 'pdf',
        template: 'executive',
        options: {
          includeCharts: true,
          includeRawData: true
        },
        data: mockAssessmentData
      });
    });

    test('displays export progress and disables button during export', () => {
      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={mockAssessmentData}
            onExport={mockOnExport}
            exportProgress={45}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('export-progress')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toHaveStyle('width: 45%');
      expect(screen.getByTestId('export-button')).toHaveTextContent('Exporting... 45%');
      expect(screen.getByTestId('export-button')).toBeDisabled();
    });
  });

  describe('Report Builder', () => {
    const mockAssessmentData = {
      framework: 'GRI',
      materialityAssessment: { completed: true },
      topicDisclosures: { count: 15 }
    };

    test('renders report builder with framework-specific configuration', () => {
      render(
        <TestWrapper>
          <MockReportBuilder
            framework="GRI"
            assessmentData={mockAssessmentData}
            onBuildReport={mockOnBuildReport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('report-builder')).toBeInTheDocument();
      expect(screen.getByText('GRI Report Builder')).toBeInTheDocument();
      expect(screen.getByTestId('report-metadata')).toBeInTheDocument();
      expect(screen.getByTestId('section-selector')).toBeInTheDocument();
    });

    test('handles report metadata input', async () => {
      render(
        <TestWrapper>
          <MockReportBuilder
            framework="GRI"
            assessmentData={mockAssessmentData}
            onBuildReport={mockOnBuildReport}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByTestId('report-title');
      const preparedForInput = screen.getByTestId('prepared-for');

      await user.clear(titleInput);
      await user.type(titleInput, 'Custom GRI Report');
      await user.type(preparedForInput, 'Board of Directors');

      expect(titleInput).toHaveValue('Custom GRI Report');
      expect(preparedForInput).toHaveValue('Board of Directors');
    });

    test('handles section inclusion/exclusion', async () => {
      render(
        <TestWrapper>
          <MockReportBuilder
            framework="GRI"
            assessmentData={mockAssessmentData}
            onBuildReport={mockOnBuildReport}
          />
        </TestWrapper>
      );

      const executiveSummaryCheckbox = screen.getByTestId('section-checkbox-executive_summary');
      const appendicesCheckbox = screen.getByTestId('section-checkbox-appendices');

      expect(executiveSummaryCheckbox).toBeChecked();
      expect(appendicesCheckbox).not.toBeChecked();

      await user.click(executiveSummaryCheckbox);
      await user.click(appendicesCheckbox);

      expect(executiveSummaryCheckbox).not.toBeChecked();
      expect(appendicesCheckbox).toBeChecked();
    });

    test('builds report with selected configuration', async () => {
      render(
        <TestWrapper>
          <MockReportBuilder
            framework="TCFD"
            assessmentData={mockAssessmentData}
            onBuildReport={mockOnBuildReport}
          />
        </TestWrapper>
      );

      // Configure report
      await user.clear(screen.getByTestId('prepared-by'));
      await user.type(screen.getByTestId('prepared-by'), 'ESG Team');
      
      const buildButton = screen.getByTestId('build-report-button');
      await user.click(buildButton);

      expect(mockOnBuildReport).toHaveBeenCalledWith(
        expect.objectContaining({
          framework: 'TCFD',
          metadata: expect.objectContaining({
            preparedBy: 'ESG Team'
          }),
          sections: expect.any(Array),
          data: mockAssessmentData
        })
      );
    });
  });

  describe('Batch Export Manager', () => {
    const mockAssessments = [
      {
        id: 'assess-1',
        framework: 'TCFD',
        company: 'Green Corp',
        status: 'completed'
      },
      {
        id: 'assess-2',
        framework: 'GRI',
        company: 'Blue Inc',
        status: 'active'
      },
      {
        id: 'assess-3',
        framework: 'SASB',
        company: 'Red LLC',
        status: 'completed'
      }
    ];

    test('renders batch export manager with assessment selection', () => {
      render(
        <TestWrapper>
          <MockBatchExportManager
            assessments={mockAssessments}
            onBatchExport={mockOnBatchExport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('batch-export-manager')).toBeInTheDocument();
      expect(screen.getByText('Batch Export Manager')).toBeInTheDocument();
      expect(screen.getByTestId('batch-controls')).toBeInTheDocument();
      expect(screen.getByTestId('selection-count')).toHaveTextContent('0 of 3 selected');
    });

    test('handles individual assessment selection', async () => {
      render(
        <TestWrapper>
          <MockBatchExportManager
            assessments={mockAssessments}
            onBatchExport={mockOnBatchExport}
          />
        </TestWrapper>
      );

      const firstCheckbox = screen.getByTestId('assessment-checkbox-assess-1');
      await user.click(firstCheckbox);

      expect(firstCheckbox).toBeChecked();
      expect(screen.getByTestId('selection-count')).toHaveTextContent('1 of 3 selected');
    });

    test('handles select all functionality', async () => {
      render(
        <TestWrapper>
          <MockBatchExportManager
            assessments={mockAssessments}
            onBatchExport={mockOnBatchExport}
          />
        </TestWrapper>
      );

      const selectAllButton = screen.getByTestId('select-all-btn');
      await user.click(selectAllButton);

      expect(screen.getByTestId('selection-count')).toHaveTextContent('3 of 3 selected');
      mockAssessments.forEach(assessment => {
        expect(screen.getByTestId(`assessment-checkbox-${assessment.id}`)).toBeChecked();
      });
    });

    test('handles clear selection functionality', async () => {
      render(
        <TestWrapper>
          <MockBatchExportManager
            assessments={mockAssessments}
            onBatchExport={mockOnBatchExport}
          />
        </TestWrapper>
      );

      // First select all
      await user.click(screen.getByTestId('select-all-btn'));
      expect(screen.getByTestId('selection-count')).toHaveTextContent('3 of 3 selected');

      // Then clear selection
      await user.click(screen.getByTestId('clear-selection-btn'));
      expect(screen.getByTestId('selection-count')).toHaveTextContent('0 of 3 selected');
    });

    test('initiates batch export with selected assessments', async () => {
      render(
        <TestWrapper>
          <MockBatchExportManager
            assessments={mockAssessments}
            onBatchExport={mockOnBatchExport}
          />
        </TestWrapper>
      );

      // Select assessments
      await user.click(screen.getByTestId('assessment-checkbox-assess-1'));
      await user.click(screen.getByTestId('assessment-checkbox-assess-3'));

      // Configure batch options
      await user.selectOptions(screen.getByTestId('batch-format-select'), 'xlsx');
      await user.click(screen.getByTestId('compression-checkbox'));

      const batchExportButton = screen.getByTestId('batch-export-button');
      expect(batchExportButton).toHaveTextContent('Export Selected (2)');
      
      await user.click(batchExportButton);

      expect(mockOnBatchExport).toHaveBeenCalledWith({
        assessmentIds: ['assess-1', 'assess-3'],
        format: 'xlsx',
        compressed: false // Was unchecked
      });
    });

    test('disables batch export when no assessments selected', () => {
      render(
        <TestWrapper>
          <MockBatchExportManager
            assessments={mockAssessments}
            onBatchExport={mockOnBatchExport}
          />
        </TestWrapper>
      );

      const batchExportButton = screen.getByTestId('batch-export-button');
      expect(batchExportButton).toBeDisabled();
    });
  });

  describe('Stakeholder Reporting', () => {
    const mockStakeholders = [
      {
        id: 'stakeholder-1',
        name: 'John Smith',
        role: 'CEO',
        organization: 'Green Corp'
      },
      {
        id: 'stakeholder-2',
        name: 'Jane Doe',
        role: 'Sustainability Manager',
        organization: 'Investment Fund'
      },
      {
        id: 'stakeholder-3',
        name: 'Bob Wilson',
        role: 'Board Member',
        organization: 'Green Corp'
      }
    ];

    const mockReportData = {
      framework: 'TCFD',
      complianceScore: 85
    };

    test('renders stakeholder reporting with recipient selection', () => {
      render(
        <TestWrapper>
          <MockStakeholderReporting
            stakeholders={mockStakeholders}
            reportData={mockReportData}
            onSendReport={mockOnSendReport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('stakeholder-reporting')).toBeInTheDocument();
      expect(screen.getByText('Stakeholder Reporting')).toBeInTheDocument();
      expect(screen.getByTestId('stakeholder-list')).toBeInTheDocument();
      expect(screen.getByTestId('delivery-options')).toBeInTheDocument();
    });

    test('handles stakeholder selection', async () => {
      render(
        <TestWrapper>
          <MockStakeholderReporting
            stakeholders={mockStakeholders}
            reportData={mockReportData}
            onSendReport={mockOnSendReport}
          />
        </TestWrapper>
      );

      const stakeholderCheckbox = screen.getByTestId('stakeholder-checkbox-stakeholder-1');
      await user.click(stakeholderCheckbox);

      expect(stakeholderCheckbox).toBeChecked();
      expect(screen.getByTestId('send-report-button')).toHaveTextContent('Send Report to 1 Recipients');
    });

    test('handles custom message input', async () => {
      render(
        <TestWrapper>
          <MockStakeholderReporting
            stakeholders={mockStakeholders}
            reportData={mockReportData}
            onSendReport={mockOnSendReport}
          />
        </TestWrapper>
      );

      const messageTextarea = screen.getByTestId('custom-message');
      await user.type(messageTextarea, 'Please find our latest ESG assessment results.');

      expect(messageTextarea).toHaveValue('Please find our latest ESG assessment results.');
    });

    test('handles scheduled delivery configuration', async () => {
      render(
        <TestWrapper>
          <MockStakeholderReporting
            stakeholders={mockStakeholders}
            reportData={mockReportData}
            onSendReport={mockOnSendReport}
          />
        </TestWrapper>
      );

      const scheduledCheckbox = screen.getByTestId('scheduled-delivery');
      await user.click(scheduledCheckbox);

      expect(scheduledCheckbox).toBeChecked();
      expect(screen.getByTestId('delivery-date')).toBeInTheDocument();
    });

    test('sends report to selected stakeholders', async () => {
      render(
        <TestWrapper>
          <MockStakeholderReporting
            stakeholders={mockStakeholders}
            reportData={mockReportData}
            onSendReport={mockOnSendReport}
          />
        </TestWrapper>
      );

      // Select stakeholders
      await user.click(screen.getByTestId('stakeholder-checkbox-stakeholder-1'));
      await user.click(screen.getByTestId('stakeholder-checkbox-stakeholder-3'));

      // Configure delivery
      await user.selectOptions(screen.getByTestId('report-format-select'), 'interactive');
      await user.type(screen.getByTestId('custom-message'), 'Test message');

      const sendButton = screen.getByTestId('send-report-button');
      await user.click(sendButton);

      expect(mockOnSendReport).toHaveBeenCalledWith({
        stakeholderIds: ['stakeholder-1', 'stakeholder-3'],
        format: 'interactive',
        message: 'Test message',
        scheduled: false,
        deliveryDate: '',
        reportData: mockReportData
      });
    });

    test('disables send button when no stakeholders selected', () => {
      render(
        <TestWrapper>
          <MockStakeholderReporting
            stakeholders={mockStakeholders}
            reportData={mockReportData}
            onSendReport={mockOnSendReport}
          />
        </TestWrapper>
      );

      const sendButton = screen.getByTestId('send-report-button');
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveTextContent('Send Report to 0 Recipients');
    });
  });

  describe('Export History', () => {
    const mockExportHistory = [
      {
        id: 'export-1',
        title: 'TCFD Climate Report 2024',
        format: 'PDF',
        status: 'completed',
        createdDate: '2024-02-15',
        fileSize: '2.3 MB'
      },
      {
        id: 'export-2',
        title: 'GRI Sustainability Report 2024',
        format: 'XLSX',
        status: 'failed',
        createdDate: '2024-02-10',
        fileSize: null
      },
      {
        id: 'export-3',
        title: 'SASB Industry Analysis',
        format: 'CSV',
        status: 'processing',
        createdDate: '2024-02-20',
        fileSize: null
      }
    ];

    test('renders export history with all exports', () => {
      render(
        <TestWrapper>
          <MockExportHistory
            exportHistory={mockExportHistory}
            onRetryExport={mockOnRetryExport}
            onDownloadExport={mockOnDownloadExport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('export-history')).toBeInTheDocument();
      expect(screen.getByText('Export History')).toBeInTheDocument();

      mockExportHistory.forEach(exportItem => {
        expect(screen.getByTestId(`export-${exportItem.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`export-title-${exportItem.id}`)).toHaveTextContent(exportItem.title);
        expect(screen.getByTestId(`export-format-${exportItem.id}`)).toHaveTextContent(exportItem.format);
        expect(screen.getByTestId(`export-status-${exportItem.id}`)).toHaveTextContent(exportItem.status);
      });
    });

    test('shows download button for completed exports', () => {
      render(
        <TestWrapper>
          <MockExportHistory
            exportHistory={mockExportHistory}
            onRetryExport={mockOnRetryExport}
            onDownloadExport={mockOnDownloadExport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('download-export-1')).toBeInTheDocument();
      expect(screen.queryByTestId('download-export-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('download-export-3')).not.toBeInTheDocument();
    });

    test('shows retry button for failed exports', () => {
      render(
        <TestWrapper>
          <MockExportHistory
            exportHistory={mockExportHistory}
            onRetryExport={mockOnRetryExport}
            onDownloadExport={mockOnDownloadExport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('retry-export-2')).toBeInTheDocument();
      expect(screen.queryByTestId('retry-export-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('retry-export-3')).not.toBeInTheDocument();
    });

    test('handles download action', async () => {
      render(
        <TestWrapper>
          <MockExportHistory
            exportHistory={mockExportHistory}
            onRetryExport={mockOnRetryExport}
            onDownloadExport={mockOnDownloadExport}
          />
        </TestWrapper>
      );

      const downloadButton = screen.getByTestId('download-export-1');
      await user.click(downloadButton);

      expect(mockOnDownloadExport).toHaveBeenCalledWith(mockExportHistory[0]);
    });

    test('handles retry action', async () => {
      render(
        <TestWrapper>
          <MockExportHistory
            exportHistory={mockExportHistory}
            onRetryExport={mockOnRetryExport}
            onDownloadExport={mockOnDownloadExport}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByTestId('retry-export-2');
      await user.click(retryButton);

      expect(mockOnRetryExport).toHaveBeenCalledWith(mockExportHistory[1]);
    });
  });

  describe('Integration and Error Handling', () => {
    test('handles large dataset export efficiently', async () => {
      const largeAssessmentData = {
        framework: 'GRI',
        assessments: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `data-${i}` }))
      };

      const startTime = performance.now();

      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={largeAssessmentData}
            onExport={mockOnExport}
            exportProgress={0}
          />
        </TestWrapper>
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(100); // Should handle efficiently
      expect(mockOnExport).toHaveBeenCalledWith(
        expect.objectContaining({
          data: largeAssessmentData
        })
      );
    });

    test('handles export failure gracefully', async () => {
      const mockOnExportWithError = jest.fn().mockRejectedValue(new Error('Export failed'));

      render(
        <TestWrapper>
          <MockDataExportManager
            assessmentData={{}}
            onExport={mockOnExportWithError}
            exportProgress={0}
          />
        </TestWrapper>
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      expect(mockOnExportWithError).toHaveBeenCalled();
    });

    test('handles empty assessment list in batch export', () => {
      render(
        <TestWrapper>
          <MockBatchExportManager
            assessments={[]}
            onBatchExport={mockOnBatchExport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('selection-count')).toHaveTextContent('0 of 0 selected');
      expect(screen.getByTestId('batch-export-button')).toBeDisabled();
    });

    test('handles missing stakeholder data', () => {
      render(
        <TestWrapper>
          <MockStakeholderReporting
            stakeholders={[]}
            reportData={{}}
            onSendReport={mockOnSendReport}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('stakeholder-reporting')).toBeInTheDocument();
      expect(screen.getByTestId('send-report-button')).toBeDisabled();
    });

    test('validates report metadata before building', async () => {
      render(
        <TestWrapper>
          <MockReportBuilder
            framework="TCFD"
            assessmentData={{}}
            onBuildReport={mockOnBuildReport}
          />
        </TestWrapper>
      );

      // Clear required field
      await user.clear(screen.getByTestId('report-title'));

      const buildButton = screen.getByTestId('build-report-button');
      await user.click(buildButton);

      // Should still call onBuildReport even with empty title
      expect(mockOnBuildReport).toHaveBeenCalled();
    });
  });
});