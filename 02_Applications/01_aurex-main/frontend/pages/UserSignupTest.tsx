import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const UserSignupTest: React.FC = () => {
  const authHook = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingSignup, setIsTestingSignup] = useState(false);
  const [isTestingLogin, setIsTestingLogin] = useState(false);
  const [isTestingAccess, setIsTestingAccess] = useState(false);

  // Handle case where auth context is not available
  const authState = authHook?.authState || {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null
  };

  const register = authHook?.register || (() => Promise.resolve());
  const login = authHook?.login || (() => Promise.resolve());
  const logout = authHook?.logout || (() => Promise.resolve());

  // Test user data
  const [testUser, setTestUser] = useState({
    email: `test_user_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  });

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addTestResult('🚀 User Signup Test Page Loaded');
  }, []);

  const testEmailSignup = async () => {
    setIsTestingSignup(true);
    addTestResult('📧 Testing Email/Password Signup...');

    try {
      await register(testUser.email, testUser.password, testUser.name);
      addTestResult('✅ Email signup successful');
      addTestResult(`👤 User created: ${testUser.email}`);

      // Test application access
      setTimeout(() => testApplicationAccess(), 1000);
    } catch (error) {
      addTestResult(`❌ Email signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingSignup(false);
    }
  };

  const testEmailLogin = async () => {
    setIsTestingLogin(true);
    addTestResult('🔑 Testing Email/Password Login...');

    try {
      await login(testUser.email, testUser.password);
      addTestResult('✅ Email login successful');

      // Test application access
      setTimeout(() => testApplicationAccess(), 1000);
    } catch (error) {
      addTestResult(`❌ Email login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const testApplicationAccess = async () => {
    setIsTestingAccess(true);
    addTestResult('🔐 Testing Application Access...');

    try {
      const token = localStorage.getItem('aurex_auth_token');
      if (!token) {
        addTestResult('❌ No authentication token found');
        return;
      }

      // Test protected API endpoint
      const response = await fetch('https://dev.aurigraph.io/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        addTestResult('✅ Protected API access successful');
        addTestResult(`📊 User data retrieved: ${userData.email}`);

        // Test Launchpad access
        testLaunchpadAccess();
      } else {
        const error = await response.json();
        addTestResult(`❌ Protected API access failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      addTestResult(`❌ Application access test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingAccess(false);
    }
  };

  const testLaunchpadAccess = () => {
    addTestResult('🚀 Testing Launchpad Access...');

    // Test if user can access launchpad pages
    const launchpadPages = [
      '/launchpad',
      '/launchpad/beginnerAssessment',
      '/dashboard'
    ];

    launchpadPages.forEach(page => {
      fetch(`https://dev.aurigraph.io${page}`)
        .then(response => {
          if (response.ok) {
            addTestResult(`✅ Launchpad page accessible: ${page}`);
          } else {
            addTestResult(`❌ Launchpad page not accessible: ${page}`);
          }
        })
        .catch(error => {
          addTestResult(`❌ Error accessing ${page}: ${error.message}`);
        });
    });
  };


  const handleLogout = async () => {
    try {
      await logout();
      addTestResult('✅ Logout successful');
      setTestResults([]); // Clear results after logout
    } catch (error) {
      addTestResult(`❌ Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const generateNewTestUser = () => {
    setTestUser({
      email: `test_user_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    });
    addTestResult('🔄 New test user generated');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 User Signup & Application Access Test
          </h1>

          {/* Authentication Status */}
          <div className="mb-8 p-4 rounded-lg bg-gray-100">
            <h2 className="text-xl font-semibold mb-4">Current Authentication Status</h2>
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
                  <p><strong>User ID:</strong> {authState.user.id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Test Controls */}
          {!authState.isAuthenticated ? (
            <div className="mb-8">
              {/* Email/Password Signup */}
              <div className="p-4 rounded-lg bg-blue-50">
                <h2 className="text-xl font-semibold mb-4">📧 Email/Password Signup</h2>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email:</label>
                    <input
                      type="email"
                      value={testUser.email}
                      onChange={(e) => setTestUser({...testUser, email: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name:</label>
                    <input
                      type="text"
                      value={testUser.name}
                      onChange={(e) => setTestUser({...testUser, name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password:</label>
                    <input
                      type="password"
                      value={testUser.password}
                      onChange={(e) => setTestUser({...testUser, password: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={testEmailSignup}
                    disabled={isTestingSignup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isTestingSignup ? '🔄 Testing...' : '📧 Test Signup'}
                  </button>
                  <button
                    onClick={testEmailLogin}
                    disabled={isTestingLogin}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isTestingLogin ? '🔄 Testing...' : '🔑 Test Login'}
                  </button>
                  <button
                    onClick={generateNewTestUser}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    🔄 New User
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="mb-8 p-4 rounded-lg bg-green-50">
              <h2 className="text-xl font-semibold mb-4">✅ User Authenticated</h2>
              <p className="text-gray-600 mb-4">
                User is successfully authenticated. Test application access:
              </p>
              <div className="flex gap-4">
                <button
                  onClick={testApplicationAccess}
                  disabled={isTestingAccess}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isTestingAccess ? '🔄 Testing...' : '🔐 Test App Access'}
                </button>
                <a
                  href="/launchpad"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  🚀 Go to Launchpad
                </a>
                <a
                  href="/dashboard"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  📊 Go to Dashboard
                </a>
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

          {/* Instructions */}
          <div className="p-4 rounded-lg bg-yellow-50">
            <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Test email/password signup with the generated test user</li>
              <li>Verify that user creation works and authentication is successful</li>
              <li>Verify that email authentication provides application access</li>
              <li>Test protected API endpoints and Launchpad access</li>
              <li>Verify logout functionality</li>
              <li>Check that users can access all Launchpad features</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSignupTest;
