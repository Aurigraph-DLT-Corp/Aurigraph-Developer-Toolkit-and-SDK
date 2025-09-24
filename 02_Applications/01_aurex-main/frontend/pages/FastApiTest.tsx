import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, AlertCircle, Server, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fastApiService } from '../services/fastApiService';

const FastApiTest = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const health = await fastApiService.healthCheck();
      setHealthStatus(health);
      addTestResult('Health Check', 'success', health);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMsg);
      addTestResult('Health Check', 'error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const addTestResult = (test: string, status: 'success' | 'error', data: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  const testRegistration = async () => {
    setIsLoading(true);
    const testEmail = `test-${Date.now()}@example.com`;
    
    try {
      const response = await fastApiService.register(
        'Test User',
        testEmail,
        'testpassword123'
      );
      addTestResult('User Registration', 'success', response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      addTestResult('User Registration', 'error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    
    try {
      // First register a user
      const testEmail = `login-test-${Date.now()}@example.com`;
      await fastApiService.register('Login Test User', testEmail, 'testpassword123');
      
      // Then try to login
      const response = await fastApiService.login(testEmail, 'testpassword123');
      addTestResult('User Login', 'success', response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      addTestResult('User Login', 'error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const testCurrentUser = async () => {
    setIsLoading(true);
    
    try {
      const user = await fastApiService.getCurrentUser();
      addTestResult('Get Current User', 'success', user);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Get current user failed';
      addTestResult('Get Current User', 'error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link to="/signup">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign Up
              </Link>
            </Button>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Server className="h-5 w-5" />
              FastAPI Backend Test
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                FastAPI Backend Status
              </CardTitle>
              <CardDescription>
                Real-time status of the FastAPI backend server
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !healthStatus ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Checking backend status...</span>
                </div>
              ) : healthStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Backend is healthy</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Message: {healthStatus.message}</div>
                    <div>Status: {healthStatus.status}</div>
                    <div>Timestamp: {new Date(healthStatus.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>Backend connection failed: {error}</span>
                </div>
              ) : null}
              
              <div className="mt-4">
                <Button onClick={checkHealth} disabled={isLoading} variant="outline">
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>API Test Actions</CardTitle>
              <CardDescription>
                Test various FastAPI endpoints and functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={testRegistration} 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Test Registration
                </Button>
                <Button 
                  onClick={testLogin} 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Test Login
                </Button>
                <Button 
                  onClick={testCurrentUser} 
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Test Current User
                </Button>
                <Button 
                  onClick={clearResults} 
                  variant="outline"
                >
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from API endpoint tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No test results yet. Run some tests to see results here.
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{result.test}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <pre className="whitespace-pre-wrap">
                          {typeof result.data === 'string' 
                            ? result.data 
                            : JSON.stringify(result.data, null, 2)
                          }
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FastApiTest;
