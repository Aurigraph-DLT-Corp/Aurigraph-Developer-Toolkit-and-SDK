/**
 * AV10-26 Predictive Analytics Integration Test
 * Comprehensive testing of the analytics dashboard and metrics system
 */

import { Logger } from './src/core/Logger';
import { PredictiveAnalyticsEngine } from './src/ai/PredictiveAnalyticsEngine';
import { AdvancedNeuralNetworkEngine } from './src/ai/AdvancedNeuralNetworkEngine';
import { PredictiveAnalyticsDashboard } from './src/monitoring/PredictiveAnalyticsDashboard';
import { MetricsCollector } from './src/monitoring/MetricsCollector';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class AV10AnalyticsTest {
  private logger: Logger;
  private neuralEngine: AdvancedNeuralNetworkEngine;
  private analyticsEngine: PredictiveAnalyticsEngine;
  private metricsCollector: MetricsCollector;
  private dashboard: PredictiveAnalyticsDashboard;
  
  private testResults: TestResult[] = [];

  constructor() {
    this.logger = new Logger('AV10-26-Analytics-Test');
  }

  async runAllTests(): Promise<void> {
    this.logger.info('🧪 Starting AV10-26 Predictive Analytics Integration Tests...');

    const tests = [
      { name: 'Component Initialization', test: () => this.testComponentInitialization() },
      { name: 'Analytics Engine', test: () => this.testAnalyticsEngine() },
      { name: 'Metrics Collector', test: () => this.testMetricsCollector() },
      { name: 'Drift Detection', test: () => this.testDriftDetection() },
      { name: 'Dashboard Integration', test: () => this.testDashboardIntegration() },
      { name: 'Real-time Monitoring', test: () => this.testRealTimeMonitoring() },
      { name: 'Alert System', test: () => this.testAlertSystem() },
      { name: 'Performance Metrics', test: () => this.testPerformanceMetrics() },
      { name: 'Feature Monitoring', test: () => this.testFeatureMonitoring() },
      { name: 'Health Score Calculation', test: () => this.testHealthScoreCalculation() }
    ];

    for (const { name, test } of tests) {
      await this.runTest(name, test);
    }

    await this.printResults();
    await this.cleanup();
  }

  private async runTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`🔬 Running test: ${testName}`);
      await testFunction();
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: true,
        duration
      });
      
      this.logger.info(`✅ Test passed: ${testName} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: error.message
      });
      
      this.logger.error(`❌ Test failed: ${testName} (${duration}ms):`, error);
    }
  }

  private async testComponentInitialization(): Promise<void> {
    // Initialize Neural Network Engine
    this.neuralEngine = new AdvancedNeuralNetworkEngine();
    await this.neuralEngine.initialize();
    
    if (!this.neuralEngine) {
      throw new Error('Neural network engine failed to initialize');
    }

    // Initialize Predictive Analytics Engine
    this.analyticsEngine = new PredictiveAnalyticsEngine(this.neuralEngine);
    await this.analyticsEngine.initialize();
    
    const performance = await this.analyticsEngine.getModelPerformance();
    if (!performance || typeof performance.totalModels !== 'number') {
      throw new Error('Analytics engine failed to initialize properly');
    }

    // Initialize Metrics Collector
    this.metricsCollector = new MetricsCollector();
    await this.metricsCollector.start();
    
    const stats = this.metricsCollector.getCollectionStats();
    if (!stats || typeof stats.totalMetricsCollected !== 'number') {
      throw new Error('Metrics collector failed to initialize properly');
    }

    // Initialize Dashboard
    this.dashboard = new PredictiveAnalyticsDashboard(
      this.analyticsEngine,
      this.metricsCollector
    );
    
    await this.dashboard.start(3041);
  }

  private async testAnalyticsEngine(): Promise<void> {
    // Test Asset Valuation
    const assetPrediction = await this.analyticsEngine.predictAssetValuation(
      'TEST-ASSET-001',
      'real_estate',
      {
        currentValue: 1000000,
        location_score: 0.8,
        property_age: 10,
        rental_yield: 0.05,
        cap_rate: 0.06,
        market_cap: 50000000,
        volatility: 0.15
      },
      24
    );

    if (!assetPrediction || typeof assetPrediction.predictedValue !== 'number') {
      throw new Error('Asset valuation prediction failed');
    }

    if (assetPrediction.confidence < 0 || assetPrediction.confidence > 1) {
      throw new Error('Invalid confidence score in asset prediction');
    }

    // Test Market Trend Analysis
    const marketData = Array.from({ length: 50 }, (_, i) => [
      1000 + Math.sin(i * 0.1) * 100 + Math.random() * 50,
      Math.random() * 1000000 + 100000
    ]);

    const trendAnalysis = await this.analyticsEngine.analyzeMarketTrends(
      'TEST-MARKET-001',
      '1h',
      marketData
    );

    if (!trendAnalysis || !['up', 'down', 'sideways'].includes(trendAnalysis.prediction)) {
      throw new Error('Market trend analysis failed');
    }

    // Test Risk Assessment
    const assets = [
      { id: 'ASSET-1', weight: 0.5, returns: Array.from({ length: 100 }, () => Math.random() * 0.1 - 0.05), value: 500000 },
      { id: 'ASSET-2', weight: 0.5, returns: Array.from({ length: 100 }, () => Math.random() * 0.15 - 0.075), value: 500000 }
    ];

    const riskAssessment = await this.analyticsEngine.assessRisk('TEST-PORTFOLIO-001', assets);

    if (!riskAssessment || typeof riskAssessment.overallRisk !== 'number') {
      throw new Error('Risk assessment failed');
    }

    // Test Anomaly Detection
    const anomalyData = Array.from({ length: 10 }, () => ({
      transaction_amount: Math.random() * 10000,
      frequency: Math.random() * 5,
      time_of_day: Math.random() * 24,
      location: Math.random(),
      user_behavior: Math.random(),
      system_load: Math.random() * 100,
      error_rate: Math.random() * 0.05,
      response_time: Math.random() * 1000
    }));

    const anomalies = await this.analyticsEngine.detectAnomalies(anomalyData, 0.9);

    if (!Array.isArray(anomalies)) {
      throw new Error('Anomaly detection failed');
    }

    // Test Performance Forecasting
    const historicalData = Array.from({ length: 48 }, (_, i) => 
      100 + Math.sin(i * 0.2) * 20 + Math.random() * 10
    );

    const forecast = await this.analyticsEngine.forecastPerformance(
      'TEST-SYSTEM-001',
      'throughput',
      historicalData,
      12
    );

    if (!forecast || typeof forecast.predicted !== 'number') {
      throw new Error('Performance forecasting failed');
    }
  }

  private async testMetricsCollector(): Promise<void> {
    // Test metric collection
    await this.metricsCollector.collectMetric('test_accuracy', 0.85, 'test-model-001');
    await this.metricsCollector.collectMetric('test_latency', 45.5, 'test-model-001');
    await this.metricsCollector.collectMetric('test_throughput', 1250, 'test-model-001');

    const accuracyMetric = this.metricsCollector.getMetric('test_accuracy', 'test-model-001');
    if (!accuracyMetric || accuracyMetric.dataPoints.length === 0) {
      throw new Error('Metric collection failed');
    }

    // Test performance metrics collection
    await this.metricsCollector.collectPerformanceMetrics('test-model-001', {
      predictions: {
        total: 1000,
        successful: 950,
        failed: 50,
        avgLatency: 45,
        throughput: 1200
      },
      accuracy: {
        overall: 0.87,
        byClass: { 'class_a': 0.85, 'class_b': 0.89 },
        confusionMatrix: [[450, 50], [40, 460]]
      },
      resources: {
        cpuUsage: 65,
        memoryUsage: 70,
        diskIO: 15,
        networkIO: 10
      },
      errors: {
        rate: 0.02,
        types: { 'timeout': 5, 'validation': 3 },
        criticalErrors: 1
      }
    });

    // Test health score calculation
    const healthScore = await this.metricsCollector.calculateModelHealthScore('test-model-001');
    if (!healthScore || typeof healthScore.overallScore !== 'number') {
      throw new Error('Health score calculation failed');
    }

    if (healthScore.overallScore < 0 || healthScore.overallScore > 100) {
      throw new Error('Invalid health score range');
    }

    // Test collection statistics
    const stats = this.metricsCollector.getCollectionStats();
    if (!stats || stats.totalMetricsCollected === 0) {
      throw new Error('Collection statistics retrieval failed');
    }
  }

  private async testDriftDetection(): Promise<void> {
    // Generate baseline data (normal distribution)
    const baselineData = Array.from({ length: 1000 }, () => 
      0.8 + (Math.random() - 0.5) * 0.1 // Mean 0.8, std dev ~0.03
    );

    // Generate current data with drift
    const currentDataNoDrift = Array.from({ length: 1000 }, () => 
      0.8 + (Math.random() - 0.5) * 0.1 // Same distribution
    );

    const currentDataWithDrift = Array.from({ length: 1000 }, () => 
      0.6 + (Math.random() - 0.5) * 0.15 // Different mean and variance
    );

    // Test no drift scenario
    const noDriftAnalysis = await this.metricsCollector.analyzeDrift(
      'test-model-no-drift',
      currentDataNoDrift,
      baselineData
    );

    if (noDriftAnalysis.hasDrift && noDriftAnalysis.driftScore > 0.3) {
      throw new Error('False positive drift detection');
    }

    // Test drift scenario
    const driftAnalysis = await this.metricsCollector.analyzeDrift(
      'test-model-with-drift',
      currentDataWithDrift,
      baselineData
    );

    if (!driftAnalysis.hasDrift || driftAnalysis.driftScore < 0.5) {
      throw new Error('Failed to detect significant drift');
    }

    if (!driftAnalysis.statisticalTests || typeof driftAnalysis.statisticalTests.ks_test.statistic !== 'number') {
      throw new Error('Statistical tests not performed properly');
    }

    // Test feature monitoring
    const featureValues = Array.from({ length: 100 }, () => Math.random() * 100);
    const baselineValues = Array.from({ length: 100 }, () => Math.random() * 80 + 10);

    await this.metricsCollector.monitorFeature('test-feature', 'test-model-001', featureValues, baselineValues);

    const featureMonitoring = this.metricsCollector.getFeatureMonitoring('test-feature', 'test-model-001');
    if (!featureMonitoring || !featureMonitoring.statistics) {
      throw new Error('Feature monitoring failed');
    }
  }

  private async testDashboardIntegration(): Promise<void> {
    // Test that dashboard is running and responsive
    const response = await this.makeRequest('http://localhost:3041/api/analytics/overview');
    if (!response || typeof response.activeModels !== 'number') {
      throw new Error('Dashboard API not responding correctly');
    }

    // Test models endpoint
    const modelsResponse = await this.makeRequest('http://localhost:3041/api/analytics/models');
    if (!Array.isArray(modelsResponse)) {
      throw new Error('Models API endpoint failed');
    }

    // Test predictions endpoint
    const predictionsResponse = await this.makeRequest('http://localhost:3041/api/analytics/predictions');
    if (!predictionsResponse || typeof predictionsResponse.totalPredictions !== 'number') {
      throw new Error('Predictions API endpoint failed');
    }

    // Test alerts endpoint
    const alertsResponse = await this.makeRequest('http://localhost:3041/api/analytics/alerts');
    if (!Array.isArray(alertsResponse)) {
      throw new Error('Alerts API endpoint failed');
    }

    // Test features endpoint
    const featuresResponse = await this.makeRequest('http://localhost:3041/api/analytics/features');
    if (!Array.isArray(featuresResponse)) {
      throw new Error('Features API endpoint failed');
    }
  }

  private async testRealTimeMonitoring(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Real-time monitoring test timed out'));
      }, 10000);

      // Test WebSocket connection
      const WebSocket = require('ws');
      const ws = new WebSocket('ws://localhost:3042');

      let receivedData = false;

      ws.on('open', () => {
        // Connection successful
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'analytics_update' && message.data) {
            receivedData = true;
            ws.close();
            clearTimeout(timeout);
            resolve();
          }
        } catch (error) {
          ws.close();
          clearTimeout(timeout);
          reject(new Error('Invalid WebSocket message format'));
        }
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket connection failed: ${error.message}`));
      });

      // Send a test message after connection
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'test_message' }));
        }
      }, 1000);

      // If no data received within reasonable time, fail
      setTimeout(() => {
        if (!receivedData) {
          ws.close();
          clearTimeout(timeout);
          reject(new Error('No real-time data received'));
        }
      }, 5000);
    });
  }

  private async testAlertSystem(): Promise<void> {
    // Add a test alert rule
    const testRule = {
      id: 'test-accuracy-alert',
      name: 'Test Accuracy Alert',
      metric: 'test_accuracy',
      condition: 'lt' as const,
      threshold: 0.5,
      severity: 'high' as const,
      enabled: true,
      cooldownPeriod: 1000,
      actions: [{ type: 'log' as const, config: {} }]
    };

    this.metricsCollector.addAlertRule(testRule);

    // Generate metric that should trigger alert
    await this.metricsCollector.collectMetric('test_accuracy', 0.3, 'test-model-alert');

    // Wait for alert processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up
    this.metricsCollector.removeAlertRule('test-accuracy-alert');
  }

  private async testPerformanceMetrics(): Promise<void> {
    const modelIds = ['perf-test-1', 'perf-test-2', 'perf-test-3'];

    for (const modelId of modelIds) {
      await this.metricsCollector.collectPerformanceMetrics(modelId, {
        predictions: {
          total: Math.floor(Math.random() * 1000) + 100,
          successful: Math.floor(Math.random() * 900) + 90,
          failed: Math.floor(Math.random() * 10),
          avgLatency: Math.random() * 100 + 20,
          throughput: Math.random() * 500 + 100
        },
        accuracy: {
          overall: Math.random() * 0.2 + 0.8,
          byClass: { 'high': 0.85, 'medium': 0.82, 'low': 0.88 },
          confusionMatrix: [[85, 10, 5], [8, 82, 10], [5, 8, 87]]
        },
        resources: {
          cpuUsage: Math.random() * 30 + 40,
          memoryUsage: Math.random() * 40 + 30,
          diskIO: Math.random() * 20 + 5,
          networkIO: Math.random() * 15 + 5
        },
        errors: {
          rate: Math.random() * 0.05,
          types: { 'timeout': Math.floor(Math.random() * 5), 'validation': Math.floor(Math.random() * 3) },
          criticalErrors: Math.floor(Math.random() * 2)
        }
      });

      const healthScore = await this.metricsCollector.calculateModelHealthScore(modelId);
      if (!healthScore) {
        throw new Error(`Health score calculation failed for ${modelId}`);
      }
    }
  }

  private async testFeatureMonitoring(): Promise<void> {
    const features = ['feature_a', 'feature_b', 'feature_c'];
    const modelId = 'feature-test-model';

    for (const feature of features) {
      const values = Array.from({ length: 200 }, () => Math.random() * 100);
      const baseline = Array.from({ length: 200 }, () => Math.random() * 90 + 5);

      await this.metricsCollector.monitorFeature(feature, modelId, values, baseline);

      const monitoring = this.metricsCollector.getFeatureMonitoring(feature, modelId);
      if (!monitoring) {
        throw new Error(`Feature monitoring failed for ${feature}`);
      }

      // Verify statistics
      if (!monitoring.statistics.current || typeof monitoring.statistics.current.mean !== 'number') {
        throw new Error(`Invalid feature statistics for ${feature}`);
      }

      // Verify quality metrics
      if (!monitoring.qualityMetrics || typeof monitoring.qualityMetrics.completeness !== 'number') {
        throw new Error(`Invalid quality metrics for ${feature}`);
      }
    }
  }

  private async testHealthScoreCalculation(): Promise<void> {
    const modelId = 'health-test-model';

    // Generate multiple performance data points
    const dataPoints = 5;
    for (let i = 0; i < dataPoints; i++) {
      await this.metricsCollector.collectPerformanceMetrics(modelId, {
        predictions: {
          total: 1000 + i * 100,
          successful: 950 + i * 95,
          failed: 50 - i * 5,
          avgLatency: 50 + Math.sin(i) * 10,
          throughput: 1000 + i * 50
        },
        accuracy: {
          overall: 0.85 + Math.sin(i * 0.5) * 0.1,
          byClass: { 'class_1': 0.83, 'class_2': 0.87 },
          confusionMatrix: [[420, 80], [70, 430]]
        },
        resources: {
          cpuUsage: 60 + Math.sin(i * 0.3) * 15,
          memoryUsage: 65 + Math.cos(i * 0.4) * 10,
          diskIO: 10 + Math.random() * 5,
          networkIO: 8 + Math.random() * 4
        },
        errors: {
          rate: 0.02 + Math.random() * 0.01,
          types: { 'timeout': Math.floor(Math.random() * 5), 'validation': Math.floor(Math.random() * 3) },
          criticalErrors: Math.floor(Math.random() * 2)
        }
      });
    }

    const healthScore = await this.metricsCollector.calculateModelHealthScore(modelId);

    if (!healthScore) {
      throw new Error('Health score calculation returned null');
    }

    // Verify all components
    const components = ['accuracy', 'latency', 'throughput', 'stability', 'drift', 'resourceEfficiency'];
    for (const component of components) {
      if (!(component in healthScore.components)) {
        throw new Error(`Missing health score component: ${component}`);
      }

      const comp = healthScore.components[component];
      if (typeof comp.score !== 'number' || comp.score < 0 || comp.score > 100) {
        throw new Error(`Invalid ${component} score: ${comp.score}`);
      }

      if (typeof comp.weight !== 'number' || comp.weight <= 0 || comp.weight > 1) {
        throw new Error(`Invalid ${component} weight: ${comp.weight}`);
      }
    }

    // Verify overall score is reasonable
    if (healthScore.overallScore < 0 || healthScore.overallScore > 100) {
      throw new Error(`Invalid overall health score: ${healthScore.overallScore}`);
    }

    // Verify trend
    if (!['improving', 'stable', 'degrading'].includes(healthScore.trend)) {
      throw new Error(`Invalid health trend: ${healthScore.trend}`);
    }

    // Verify alert level
    if (!['none', 'info', 'warning', 'critical'].includes(healthScore.alertLevel)) {
      throw new Error(`Invalid alert level: ${healthScore.alertLevel}`);
    }

    // Verify recommendations array
    if (!Array.isArray(healthScore.recommendations)) {
      throw new Error('Health score recommendations should be an array');
    }
  }

  private async makeRequest(url: string): Promise<any> {
    const https = require('https');
    const http = require('http');
    const urlModule = require('url');
    
    return new Promise((resolve, reject) => {
      const parsedUrl = urlModule.parse(url);
      const module = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = module.get(url, (res: any) => {
        let data = '';
        
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error: Error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  private async printResults(): Promise<void> {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / totalTests;

    this.logger.info('\n📊 AV10-26 Analytics Test Results:');
    this.logger.info('═'.repeat(50));
    this.logger.info(`Total Tests: ${totalTests}`);
    this.logger.info(`✅ Passed: ${passedTests}`);
    this.logger.info(`❌ Failed: ${failedTests}`);
    this.logger.info(`⏱️ Total Duration: ${totalDuration}ms`);
    this.logger.info(`📈 Average Duration: ${avgDuration.toFixed(2)}ms`);
    this.logger.info(`🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    this.logger.info('\nDetailed Results:');
    this.logger.info('-'.repeat(50));
    
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`.padEnd(8);
      this.logger.info(`${status} ${result.testName.padEnd(25)} ${duration}`);
      
      if (!result.success && result.error) {
        this.logger.info(`   Error: ${result.error}`);
      }
    });
    
    this.logger.info('═'.repeat(50));
    
    if (failedTests === 0) {
      this.logger.info('🎉 All tests passed! AV10-26 Analytics system is fully operational.');
    } else {
      this.logger.warn(`⚠️ ${failedTests} test(s) failed. Please review the errors above.`);
    }
  }

  private async cleanup(): Promise<void> {
    this.logger.info('🧹 Cleaning up test resources...');
    
    try {
      if (this.dashboard) {
        await this.dashboard.stop();
      }
      
      if (this.metricsCollector) {
        await this.metricsCollector.stop();
      }
      
      this.logger.info('✅ Cleanup completed');
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AV10AnalyticsTest();
  
  tester.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { AV10AnalyticsTest };