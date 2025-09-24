import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import GoogleOAuthButton from '../components/auth/GoogleOAuthButton';

const GoogleOAuthTest: React.FC = () => {
  const authHook = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  // Handle case where auth context is not available
  const authState = authHook?.authState || {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null
  };

  const logout = authHook?.logout || (() => Promise.resolve());

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleGoogleSuccess = (user: any) => {
    addTestResult(`✅ Google OAuth Success: ${user.email}`);
    addTestResult(`👤 User created/logged in: ${user.name}`);
    addTestResult(`🔑 Provider: ${user.provider}`);
    addTestResult(`📅 Last login: ${user.lastLogin}`);
  };

  const handleGoogleError = (error: string) => {
    addTestResult(`❌ Google OAuth Error: ${error}`);
  };

  const testAPIAccess = async () => {
    if (!authState.isAuthenticated) {
      addTestResult('❌ Cannot test API - user not authenticated');
      return;
    }

    setIsTestingAPI(true);
    addTestResult('🧪 Testing API access with Google OAuth token...');

    try {
      const token = localStorage.getItem('aurex_auth_token');

      // Test protected endpoint
      const response = await fetch('https://dev.aurigraph.io/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        addTestResult('✅ API access successful');
        addTestResult(`📊 User data retrieved: ${userData.email}`);
      } else {
        const error = await response.json();
        addTestResult(`❌ API access failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      addTestResult(`❌ API test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingAPI(false);
    }
  };

  const testSMSEndpoint = async () => {
    if (!authState.isAuthenticated) {
      addTestResult('❌ Cannot test SMS - user not authenticated');
      return;
    }

    addTestResult('📱 Testing SMS endpoint access...');

    try {
      const token = localStorage.getItem('aurex_auth_token');

      const response = await fetch('https://dev.aurigraph.io/api/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: '+919876543210',
          message: `Test SMS from Google OAuth user: ${authState.user?.email} at ${new Date().toLocaleString()}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        addTestResult('✅ SMS endpoint accessible');
        addTestResult(`📨 SMS result: ${result.message}`);
      } else {
        const error = await response.json();
        addTestResult(`❌ SMS endpoint failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      addTestResult(`❌ SMS test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const handleLogout = async () => {
    try {
      await logout();
      addTestResult('✅ Logout successful');
    } catch (error) {
      addTestResult(`❌ Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Google OAuth Integration Test
          </h1>

          {/* Authentication Status */}
          <div className="mb-8 p-4 rounded-lg bg-gray-100">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Authenticated:</strong> {authState.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Loading:</strong> {authState.isLoading ? '🔄 Yes' : '✅ No'}</p>
                <p><strong>Error:</strong> {authState.error || '✅ None'}</p>
              </div>
              {authState.user && (
                <div>
                  <p><strong>Name:</strong> {authState.user.name}</p>
                  <p><strong>Email:</strong> {authState.user.email}</p>
                  <p><strong>Provider:</strong> {authState.user.provider}</p>
                  <p><strong>Last Login:</strong> {new Date(authState.user.lastLogin).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Google OAuth Button */}
          {!authState.isAuthenticated ? (
            <div className="mb-8 p-4 rounded-lg bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">Google OAuth Login</h2>
              <p className="text-gray-600 mb-4">
                Click the button below to test Google OAuth authentication:
              </p>
              <GoogleOAuthButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                theme="outline"
                size="large"
                width={300}
              />
            </div>
          ) : (
            <div className="mb-8 p-4 rounded-lg bg-green-50">
              <h2 className="text-xl font-semibold mb-4">✅ Authenticated</h2>
              <p className="text-gray-600 mb-4">
                You are successfully logged in with Google OAuth!
              </p>
              <div className="flex gap-4">
                <button
                  onClick={testAPIAccess}
                  disabled={isTestingAPI}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isTestingAPI ? '🔄 Testing...' : '🧪 Test API Access'}
                </button>
                <button
                  onClick={testSMSEndpoint}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  📱 Test SMS Access
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Test Results</h2>
              <button
                onClick={clearResults}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet...</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Configuration Info */}
          <div className="p-4 rounded-lg bg-yellow-50">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Google Client ID:</strong></p>
                <p className="font-mono text-xs break-all">296656940244-t5i1tcs8dd5iabrr0v7epvmvk6rpet9f.apps.googleusercontent.com</p>
              </div>
              <div>
                <p><strong>API Base URL:</strong></p>
                <p className="font-mono text-xs">https://dev.aurigraph.io/api</p>
              </div>
              <div>
                <p><strong>Backend OAuth Endpoint:</strong></p>
                <p className="font-mono text-xs">/api/auth/google</p>
              </div>
              <div>
                <p><strong>Test Environment:</strong></p>
                <p className="font-mono text-xs">Production (dev.aurigraph.io)</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 rounded-lg bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click the "Continue with Google" button above</li>
              <li>Complete the Google OAuth flow in the popup/redirect</li>
              <li>Verify that user creation/login works correctly</li>
              <li>Test API access with the authenticated token</li>
              <li>Test SMS functionality (if needed)</li>
              <li>Verify logout functionality</li>
              <li>Check the test results console for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthTest;
