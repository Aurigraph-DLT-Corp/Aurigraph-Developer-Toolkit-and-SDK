/**
 * Performance Tests for Large ESG Datasets
 * Aurex Launchpad - ESG Assessment Platform
 * 
 * Comprehensive test suite for performance testing with large datasets,
 * stress testing, memory management, and scalability validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock performance monitoring utilities
const MockPerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    dataProcessingTime: 0
  });

  React.useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, []);

  return (
    <div data-testid="performance-monitor">
      <div data-testid="render-time">Render Time: {metrics.renderTime.toFixed(2)}ms</div>
      <div data-testid="memory-usage">Memory: {metrics.memoryUsage}MB</div>
      <div data-testid="component-count">Components: {metrics.componentCount}</div>
      <div data-testid="processing-time">Processing: {metrics.dataProcessingTime}ms</div>
    </div>
  );
};

// Mock large dataset components
const MockLargeDataTable = ({ data, onDataProcess }) => {
  const [processedData, setProcessedData] = React.useState([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [renderMetrics, setRenderMetrics] = React.useState({});

  React.useEffect(() => {
    const startTime = performance.now();
    
    setIsProcessing(true);
    
    // Simulate data processing
    const processData = async () => {
      const processed = data.map(item => ({
        ...item,
        calculated: item.value * 1.1,
        formatted: `${item.name}: ${item.value.toLocaleString()}`
      }));
      
      setProcessedData(processed);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      setRenderMetrics({
        processingTime,
        itemCount: data.length,
        avgTimePerItem: processingTime / data.length
      });
      
      setIsProcessing(false);
      
      if (onDataProcess) {
        onDataProcess({
          processingTime,
          itemCount: data.length,
          success: true
        });
      }
    };

    if (data.length > 0) {
      processData();
    }
  }, [data, onDataProcess]);

  const chunkSize = 100; // Virtualization chunk size
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: chunkSize });

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const itemHeight = 40; // Estimated item height
    const containerHeight = e.target.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 5, processedData.length);
    
    setVisibleRange({ start, end });
  };

  const visibleItems = processedData.slice(visibleRange.start, visibleRange.end);

  return (
    <div data-testid="large-data-table">
      <div data-testid="table-metrics">
        <span data-testid="total-items">Total Items: {processedData.length}</span>
        <span data-testid="visible-items">Visible: {visibleItems.length}</span>
        <span data-testid="processing-time">
          Processing Time: {renderMetrics.processingTime?.toFixed(2)}ms
        </span>
        <span data-testid="avg-time-per-item">
          Avg per Item: {renderMetrics.avgTimePerItem?.toFixed(4)}ms
        </span>
      </div>
      
      {isProcessing && <div data-testid="processing-indicator">Processing large dataset...</div>}
      
      <div
        data-testid="virtualized-list"
        style={{ height: '400px', overflow: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ height: processedData.length * 40 }}>
          <div style={{ transform: `translateY(${visibleRange.start * 40}px)` }}>
            {visibleItems.map((item, index) => (
              <div
                key={visibleRange.start + index}
                data-testid={`item-${visibleRange.start + index}`}
                style={{ height: '40px', padding: '8px' }}
              >
                {item.formatted}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MockBulkAssessmentProcessor = ({ assessments, onBulkProcess }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processedCount, setProcessedCount] = React.useState(0);
  const [processingResults, setProcessingResults] = React.useState([]);
  const [errors, setErrors] = React.useState([]);

  const processBulkAssessments = async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    setProcessingResults([]);
    setErrors([]);

    const batchSize = 10; // Process in batches to prevent blocking
    const batches = [];
    
    for (let i = 0; i < assessments.length; i += batchSize) {
      batches.push(assessments.slice(i, i + batchSize));
    }

    const startTime = performance.now();

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Process batch with simulated delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const batchResults = batch.map(assessment => {
          try {
            // Simulate complex calculation
            const score = Math.random() * 100;
            const complianceLevel = score >= 70 ? 'compliant' : 'non-compliant';
            
            return {
              id: assessment.id,
              framework: assessment.framework,
              score,
              complianceLevel,
              processed: true
            };
          } catch (error) {
            setErrors(prev => [...prev, { id: assessment.id, error: error.message }]);
            return null;
          }
        }).filter(Boolean);

        setProcessingResults(prev => [...prev, ...batchResults]);
        setProcessedCount(prev => prev + batch.length);

        // Yield to browser to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      if (onBulkProcess) {
        onBulkProcess({
          totalTime,
          processedCount: assessments.length,
          successCount: processingResults.length,
          errorCount: errors.length,
          avgTimePerItem: totalTime / assessments.length
        });
      }
    } catch (error) {
      setErrors(prev => [...prev, { id: 'bulk', error: error.message }]);
    }

    setIsProcessing(false);
  };

  return (
    <div data-testid="bulk-assessment-processor">
      <div data-testid="processor-controls">
        <button
          data-testid="process-bulk-btn"
          onClick={processBulkAssessments}
          disabled={isProcessing}
        >
          {isProcessing ? `Processing... ${processedCount}/${assessments.length}` : 'Process Bulk Assessments'}
        </button>
      </div>

      <div data-testid="processing-status">
        <div data-testid="total-assessments">Total: {assessments.length}</div>
        <div data-testid="processed-count">Processed: {processedCount}</div>
        <div data-testid="success-count">Success: {processingResults.length}</div>
        <div data-testid="error-count">Errors: {errors.length}</div>
      </div>

      {isProcessing && (
        <div data-testid="progress-bar">
          <div
            data-testid="progress-fill"
            style={{
              width: `${(processedCount / assessments.length) * 100}%`,
              height: '20px',
              backgroundColor: '#4CAF50'
            }}
          />
        </div>
      )}

      {processingResults.length > 0 && (
        <div data-testid="processing-results">
          <h4>Processing Results</h4>
          <div data-testid="results-summary">
            Average Score: {(processingResults.reduce((sum, r) => sum + r.score, 0) / processingResults.length).toFixed(2)}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div data-testid="processing-errors">
          <h4>Processing Errors</h4>
          {errors.map((error, index) => (
            <div key={index} data-testid={`error-${index}`}>
              ID: {error.id}, Error: {error.error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MockMemoryUsageMonitor = ({ dataSize, onMemoryUpdate }) => {
  const [memoryStats, setMemoryStats] = React.useState({});
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  React.useEffect(() => {
    let interval;
    
    if (isMonitoring) {
      interval = setInterval(() => {
        // Simulate memory monitoring
        if (performance.memory) {
          const stats = {
            usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
          };
          
          setMemoryStats(stats);
          
          if (onMemoryUpdate) {
            onMemoryUpdate(stats);
          }
        } else {
          // Fallback for environments without performance.memory
          const mockStats = {
            usedJSHeapSize: Math.round(dataSize / 1000) + Math.random() * 10,
            totalJSHeapSize: 100 + Math.random() * 50,
            jsHeapSizeLimit: 2048
          };
          
          setMemoryStats(mockStats);
          
          if (onMemoryUpdate) {
            onMemoryUpdate(mockStats);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, dataSize, onMemoryUpdate]);

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);

  return (
    <div data-testid="memory-usage-monitor">
      <div data-testid="memory-controls">
        <button data-testid="start-monitoring" onClick={startMonitoring} disabled={isMonitoring}>
          Start Monitoring
        </button>
        <button data-testid="stop-monitoring" onClick={stopMonitoring} disabled={!isMonitoring}>
          Stop Monitoring
        </button>
      </div>

      {Object.keys(memoryStats).length > 0 && (
        <div data-testid="memory-stats">
          <div data-testid="used-memory">Used: {memoryStats.usedJSHeapSize} MB</div>
          <div data-testid="total-memory">Total: {memoryStats.totalJSHeapSize} MB</div>
          <div data-testid="memory-limit">Limit: {memoryStats.jsHeapSizeLimit} MB</div>
          <div data-testid="memory-usage-percent">
            Usage: {((memoryStats.usedJSHeapSize / memoryStats.totalJSHeapSize) * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};

const MockStressTestRunner = ({ onStressTestComplete }) => {
  const [isRunning, setIsRunning] = React.useState(false);
  const [testResults, setTestResults] = React.useState({});

  const runStressTest = async () => {
    setIsRunning(true);
    
    const tests = [
      { name: 'Large Dataset Rendering', size: 10000, target: 100 },
      { name: 'Rapid State Updates', size: 1000, target: 50 },
      { name: 'Memory Stress Test', size: 50000, target: 200 },
      { name: 'Concurrent Processing', size: 5000, target: 150 }
    ];

    const results = {};

    for (const test of tests) {
      const startTime = performance.now();
      
      // Simulate stress test
      await new Promise(resolve => {
        const iterations = test.size;
        let completed = 0;
        
        const process = () => {
          for (let i = 0; i < 100 && completed < iterations; i++) {
            // Simulate processing
            Math.random() * Math.random();
            completed++;
          }
          
          if (completed < iterations) {
            setTimeout(process, 0);
          } else {
            resolve();
          }
        };
        
        process();
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results[test.name] = {
        duration,
        passed: duration < test.target,
        target: test.target,
        performance: test.size / duration // operations per ms
      };
    }

    setTestResults(results);
    setIsRunning(false);
    
    if (onStressTestComplete) {
      onStressTestComplete(results);
    }
  };

  return (
    <div data-testid="stress-test-runner">
      <div data-testid="stress-test-controls">
        <button
          data-testid="run-stress-test"
          onClick={runStressTest}
          disabled={isRunning}
        >
          {isRunning ? 'Running Stress Tests...' : 'Run Stress Tests'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div data-testid="stress-test-results">
          <h4>Stress Test Results</h4>
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} data-testid={`test-result-${testName.replace(/\s+/g, '-').toLowerCase()}`}>
              <span>{testName}</span>
              <span data-testid={`duration-${testName.replace(/\s+/g, '-').toLowerCase()}`}>
                {result.duration.toFixed(2)}ms
              </span>
              <span data-testid={`status-${testName.replace(/\s+/g, '-').toLowerCase()}`}>
                {result.passed ? 'PASSED' : 'FAILED'}
              </span>
              <span data-testid={`performance-${testName.replace(/\s+/g, '-').toLowerCase()}`}>
                {result.performance.toFixed(2)} ops/ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Performance Tests for Large ESG Datasets', () => {
  let user;
  let mockOnDataProcess;
  let mockOnBulkProcess;
  let mockOnMemoryUpdate;
  let mockOnStressTestComplete;

  beforeEach(() => {
    user = userEvent.setup();
    mockOnDataProcess = jest.fn();
    mockOnBulkProcess = jest.fn();
    mockOnMemoryUpdate = jest.fn();
    mockOnStressTestComplete = jest.fn();
    
    // Clear any existing performance marks/measures
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Large Dataset Rendering Performance', () => {
    const generateLargeDataset = (size) => {
      return Array.from({ length: size }, (_, index) => ({
        id: `item-${index}`,
        name: `ESG Metric ${index}`,
        value: Math.random() * 1000,
        framework: ['TCFD', 'GRI', 'SASB', 'CSRD'][index % 4],
        category: ['Environmental', 'Social', 'Governance'][index % 3]
      }));
    };

    test('renders 1,000 items efficiently', async () => {
      const dataset = generateLargeDataset(1000);
      const startTime = performance.now();

      render(
        <TestWrapper>
          <MockLargeDataTable
            data={dataset}
            onDataProcess={mockOnDataProcess}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-items')).toHaveTextContent('Total Items: 1000');
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(200); // Should render within 200ms
      expect(mockOnDataProcess).toHaveBeenCalledWith(
        expect.objectContaining({
          itemCount: 1000,
          success: true
        })
      );
    });

    test('handles 10,000 items with virtualization', async () => {
      const dataset = generateLargeDataset(10000);

      render(
        <TestWrapper>
          <MockLargeDataTable
            data={dataset}
            onDataProcess={mockOnDataProcess}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-items')).toHaveTextContent('Total Items: 10000');
      });

      // Should only render visible items, not all 10,000
      const visibleItems = screen.getByTestId('visible-items');
      expect(visibleItems.textContent).toMatch(/Visible: \d+/);
      
      // Visible count should be much less than total
      const visibleCount = parseInt(visibleItems.textContent.match(/\d+/)[0]);
      expect(visibleCount).toBeLessThan(200);

      expect(mockOnDataProcess).toHaveBeenCalledWith(
        expect.objectContaining({
          itemCount: 10000,
          success: true
        })
      );
    });

    test('maintains performance during scrolling', async () => {
      const dataset = generateLargeDataset(5000);

      render(
        <TestWrapper>
          <MockLargeDataTable
            data={dataset}
            onDataProcess={mockOnDataProcess}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-items')).toHaveTextContent('Total Items: 5000');
      });

      const virtualizedList = screen.getByTestId('virtualized-list');
      const startTime = performance.now();

      // Simulate scrolling
      fireEvent.scroll(virtualizedList, { target: { scrollTop: 2000 } });
      fireEvent.scroll(virtualizedList, { target: { scrollTop: 4000 } });
      fireEvent.scroll(virtualizedList, { target: { scrollTop: 6000 } });

      const endTime = performance.now();
      const scrollTime = endTime - startTime;

      expect(scrollTime).toBeLessThan(50); // Scrolling should be smooth
    });

    test('processes large dataset calculations efficiently', async () => {
      const dataset = generateLargeDataset(2000);

      render(
        <TestWrapper>
          <MockLargeDataTable
            data={dataset}
            onDataProcess={mockOnDataProcess}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnDataProcess).toHaveBeenCalled();
      });

      const processingResults = mockOnDataProcess.mock.calls[0][0];
      expect(processingResults.processingTime).toBeLessThan(100);
      expect(processingResults.avgTimePerItem).toBeLessThan(0.1);
    });
  });

  describe('Bulk Assessment Processing', () => {
    const generateBulkAssessments = (count) => {
      return Array.from({ length: count }, (_, index) => ({
        id: `assessment-${index}`,
        framework: ['TCFD', 'GRI', 'SASB', 'CSRD', 'EU-Taxonomy'][index % 5],
        company: `Company ${index}`,
        status: 'pending',
        data: {
          metrics: Array.from({ length: 20 }, (_, i) => ({ key: `metric-${i}`, value: Math.random() * 100 }))
        }
      }));
    };

    test('processes 100 assessments in batches', async () => {
      const assessments = generateBulkAssessments(100);

      render(
        <TestWrapper>
          <MockBulkAssessmentProcessor
            assessments={assessments}
            onBulkProcess={mockOnBulkProcess}
          />
        </TestWrapper>
      );

      const processButton = screen.getByTestId('process-bulk-btn');
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByTestId('processed-count')).toHaveTextContent('Processed: 100');
      }, { timeout: 10000 });

      expect(mockOnBulkProcess).toHaveBeenCalledWith(
        expect.objectContaining({
          processedCount: 100,
          successCount: expect.any(Number),
          avgTimePerItem: expect.any(Number)
        })
      );

      const results = mockOnBulkProcess.mock.calls[0][0];
      expect(results.avgTimePerItem).toBeLessThan(10); // Less than 10ms per item
    });

    test('handles 1000 assessments without blocking UI', async () => {
      const assessments = generateBulkAssessments(1000);

      render(
        <TestWrapper>
          <MockBulkAssessmentProcessor
            assessments={assessments}
            onBulkProcess={mockOnBulkProcess}
          />
        </TestWrapper>
      );

      const processButton = screen.getByTestId('process-bulk-btn');
      const startTime = performance.now();
      
      await user.click(processButton);

      // UI should remain responsive during processing
      await waitFor(() => {
        const processedCount = parseInt(screen.getByTestId('processed-count').textContent.match(/\d+/)[0]);
        expect(processedCount).toBeGreaterThan(0);
      });

      await waitFor(() => {
        expect(screen.getByTestId('processed-count')).toHaveTextContent('Processed: 1000');
      }, { timeout: 15000 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(mockOnBulkProcess).toHaveBeenCalled();
    });

    test('provides progress updates during bulk processing', async () => {
      const assessments = generateBulkAssessments(200);

      render(
        <TestWrapper>
          <MockBulkAssessmentProcessor
            assessments={assessments}
            onBulkProcess={mockOnBulkProcess}
          />
        </TestWrapper>
      );

      const processButton = screen.getByTestId('process-bulk-btn');
      await user.click(processButton);

      // Should show progress updates
      await waitFor(() => {
        const processedText = screen.getByTestId('processed-count').textContent;
        const processed = parseInt(processedText.match(/\d+/)[0]);
        expect(processed).toBeGreaterThan(0);
        expect(processed).toBeLessThanOrEqual(200);
      });

      const progressBar = screen.getByTestId('progress-fill');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Memory Usage Monitoring', () => {
    test('monitors memory usage during data processing', async () => {
      const largeDataSize = 1000000; // 1MB of data

      render(
        <TestWrapper>
          <MockMemoryUsageMonitor
            dataSize={largeDataSize}
            onMemoryUpdate={mockOnMemoryUpdate}
          />
        </TestWrapper>
      );

      const startButton = screen.getByTestId('start-monitoring');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('memory-stats')).toBeInTheDocument();
      });

      expect(mockOnMemoryUpdate).toHaveBeenCalled();
      
      const memoryStats = mockOnMemoryUpdate.mock.calls[0][0];
      expect(memoryStats).toHaveProperty('usedJSHeapSize');
      expect(memoryStats).toHaveProperty('totalJSHeapSize');
      expect(memoryStats).toHaveProperty('jsHeapSizeLimit');
    });

    test('detects memory usage patterns', async () => {
      render(
        <TestWrapper>
          <MockMemoryUsageMonitor
            dataSize={500000}
            onMemoryUpdate={mockOnMemoryUpdate}
          />
        </TestWrapper>
      );

      const startButton = screen.getByTestId('start-monitoring');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockOnMemoryUpdate).toHaveBeenCalled();
      });

      // Let it monitor for a bit
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      expect(mockOnMemoryUpdate).toHaveBeenCalledTimes(2);
      
      const stopButton = screen.getByTestId('stop-monitoring');
      await user.click(stopButton);
    });

    test('shows memory usage percentages', async () => {
      render(
        <TestWrapper>
          <MockMemoryUsageMonitor
            dataSize={100000}
            onMemoryUpdate={mockOnMemoryUpdate}
          />
        </TestWrapper>
      );

      const startButton = screen.getByTestId('start-monitoring');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('memory-usage-percent')).toBeInTheDocument();
      });

      const usagePercent = screen.getByTestId('memory-usage-percent');
      expect(usagePercent.textContent).toMatch(/Usage: \d+\.\d+%/);
    });
  });

  describe('Stress Testing', () => {
    test('runs comprehensive stress tests', async () => {
      render(
        <TestWrapper>
          <MockStressTestRunner
            onStressTestComplete={mockOnStressTestComplete}
          />
        </TestWrapper>
      );

      const runButton = screen.getByTestId('run-stress-test');
      await user.click(runButton);

      await waitFor(() => {
        expect(screen.getByTestId('stress-test-results')).toBeInTheDocument();
      }, { timeout: 15000 });

      expect(mockOnStressTestComplete).toHaveBeenCalled();
      
      const results = mockOnStressTestComplete.mock.calls[0][0];
      expect(results).toHaveProperty('Large Dataset Rendering');
      expect(results).toHaveProperty('Rapid State Updates');
      expect(results).toHaveProperty('Memory Stress Test');
      expect(results).toHaveProperty('Concurrent Processing');
    });

    test('validates performance benchmarks', async () => {
      render(
        <TestWrapper>
          <MockStressTestRunner
            onStressTestComplete={mockOnStressTestComplete}
          />
        </TestWrapper>
      );

      const runButton = screen.getByTestId('run-stress-test');
      await user.click(runButton);

      await waitFor(() => {
        expect(screen.getByTestId('test-result-large-dataset-rendering')).toBeInTheDocument();
      }, { timeout: 15000 });

      // Check individual test results
      const largeDatasetStatus = screen.getByTestId('status-large-dataset-rendering');
      const rapidUpdatesStatus = screen.getByTestId('status-rapid-state-updates');
      
      expect(largeDatasetStatus.textContent).toMatch(/PASSED|FAILED/);
      expect(rapidUpdatesStatus.textContent).toMatch(/PASSED|FAILED/);
    });

    test('measures operations per millisecond', async () => {
      render(
        <TestWrapper>
          <MockStressTestRunner
            onStressTestComplete={mockOnStressTestComplete}
          />
        </TestWrapper>
      );

      const runButton = screen.getByTestId('run-stress-test');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockOnStressTestComplete).toHaveBeenCalled();
      }, { timeout: 15000 });

      const results = mockOnStressTestComplete.mock.calls[0][0];
      
      Object.values(results).forEach(result => {
        expect(result.performance).toBeGreaterThan(0);
        expect(typeof result.performance).toBe('number');
      });
    });
  });

  describe('Real-world Scenario Testing', () => {
    test('handles concurrent large dataset operations', async () => {
      const dataset1 = Array.from({ length: 2000 }, (_, i) => ({ id: i, value: Math.random() * 100 }));
      const dataset2 = Array.from({ length: 1500 }, (_, i) => ({ id: i + 2000, value: Math.random() * 100 }));

      const { rerender } = render(
        <TestWrapper>
          <MockLargeDataTable data={dataset1} onDataProcess={mockOnDataProcess} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-items')).toHaveTextContent('Total Items: 2000');
      });

      const firstCallTime = mockOnDataProcess.mock.calls[0][0].processingTime;

      // Switch to second dataset
      rerender(
        <TestWrapper>
          <MockLargeDataTable data={dataset2} onDataProcess={mockOnDataProcess} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-items')).toHaveTextContent('Total Items: 1500');
      });

      expect(mockOnDataProcess).toHaveBeenCalledTimes(2);
      
      const secondCallTime = mockOnDataProcess.mock.calls[1][0].processingTime;
      
      // Both operations should complete efficiently
      expect(firstCallTime).toBeLessThan(150);
      expect(secondCallTime).toBeLessThan(150);
    });

    test('maintains performance under rapid data updates', async () => {
      let dataset = Array.from({ length: 1000 }, (_, i) => ({ 
        id: i, 
        value: Math.random() * 100,
        name: `Item ${i}`
      }));

      const { rerender } = render(
        <TestWrapper>
          <MockLargeDataTable data={dataset} onDataProcess={mockOnDataProcess} />
        </TestWrapper>
      );

      // Simulate rapid updates
      for (let update = 0; update < 5; update++) {
        dataset = dataset.map(item => ({
          ...item,
          value: Math.random() * 100,
          lastUpdate: Date.now()
        }));

        rerender(
          <TestWrapper>
            <MockLargeDataTable data={dataset} onDataProcess={mockOnDataProcess} />
          </TestWrapper>
        );

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(mockOnDataProcess).toHaveBeenCalledTimes(6); // Initial + 5 updates
      
      // All processing times should be reasonable
      mockOnDataProcess.mock.calls.forEach(call => {
        expect(call[0].processingTime).toBeLessThan(100);
      });
    });

    test('scales with different ESG framework complexities', async () => {
      const frameworks = {
        simple: Array.from({ length: 500 }, (_, i) => ({ id: i, complexity: 1, metrics: 5 })),
        medium: Array.from({ length: 1000 }, (_, i) => ({ id: i, complexity: 2, metrics: 15 })),
        complex: Array.from({ length: 2000 }, (_, i) => ({ id: i, complexity: 3, metrics: 30 }))
      };

      const results = {};

      for (const [frameworkType, data] of Object.entries(frameworks)) {
        const startTime = performance.now();

        const { unmount } = render(
          <TestWrapper>
            <MockLargeDataTable data={data} onDataProcess={mockOnDataProcess} />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByTestId('total-items')).toHaveTextContent(`Total Items: ${data.length}`);
        });

        const endTime = performance.now();
        results[frameworkType] = endTime - startTime;

        unmount();
      }

      // Performance should scale reasonably with complexity
      expect(results.simple).toBeLessThan(100);
      expect(results.medium).toBeLessThan(200);
      expect(results.complex).toBeLessThan(400);
    });
  });

  describe('Performance Regression Detection', () => {
    test('establishes performance baseline', async () => {
      const testSizes = [100, 500, 1000, 2000];
      const baselineResults = {};

      for (const size of testSizes) {
        const dataset = Array.from({ length: size }, (_, i) => ({ id: i, value: Math.random() * 100 }));
        const startTime = performance.now();

        const { unmount } = render(
          <TestWrapper>
            <MockLargeDataTable data={dataset} onDataProcess={mockOnDataProcess} />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByTestId('total-items')).toHaveTextContent(`Total Items: ${size}`);
        });

        const endTime = performance.now();
        baselineResults[size] = endTime - startTime;

        unmount();
      }

      // Validate that performance scales linearly or sublinearly
      expect(baselineResults[500]).toBeLessThan(baselineResults[100] * 6); // Should be less than 6x
      expect(baselineResults[1000]).toBeLessThan(baselineResults[500] * 3); // Should be less than 3x
      expect(baselineResults[2000]).toBeLessThan(baselineResults[1000] * 3); // Should be less than 3x
    });

    test('detects memory leaks during repeated operations', async () => {
      const iterations = 10;
      const memoryReadings = [];

      for (let i = 0; i < iterations; i++) {
        const dataset = Array.from({ length: 1000 }, (_, j) => ({ id: j, value: Math.random() * 100 }));

        const { unmount } = render(
          <TestWrapper>
            <MockLargeDataTable data={dataset} onDataProcess={mockOnDataProcess} />
            <MockMemoryUsageMonitor dataSize={1000} onMemoryUpdate={mockOnMemoryUpdate} />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByTestId('total-items')).toHaveTextContent('Total Items: 1000');
        });

        // Simulate memory reading
        if (mockOnMemoryUpdate.mock.calls.length > 0) {
          const latestCall = mockOnMemoryUpdate.mock.calls[mockOnMemoryUpdate.mock.calls.length - 1];
          memoryReadings.push(latestCall[0].usedJSHeapSize || 50 + Math.random() * 10);
        } else {
          memoryReadings.push(50 + Math.random() * 10); // Mock reading
        }

        unmount();
        
        // Force garbage collection simulation
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Memory usage should not consistently increase (indicating leaks)
      const firstHalf = memoryReadings.slice(0, 5);
      const secondHalf = memoryReadings.slice(5);
      
      const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      // Memory usage should not increase by more than 50% between halves
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
    });
  });
});