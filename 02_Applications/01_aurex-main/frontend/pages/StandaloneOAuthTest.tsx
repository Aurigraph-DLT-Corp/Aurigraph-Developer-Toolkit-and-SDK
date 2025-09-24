import React, { useState, useEffect } from 'react';
import SimpleGoogleAuth from '../components/auth/SimpleGoogleAuth';

const StandaloneOAuthTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  // Test user data for email signup
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
    addTestResult('🚀 Standalone OAuth Test Page Loaded');
    checkCurrentAuth();
  }, []);

  const checkCurrentAuth = async () => {
    const token = localStorage.getItem('aurex_auth_token');
    if (token) {
      try {
        const response = await fetch('https://dev.aurigraph.io/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
          addTestResult(`✅ Already authenticated: ${userData.email}`);
        } else {
          localStorage.removeItem('aurex_auth_token');
          addTestResult('🔄 Invalid token removed');
        }
      } catch (error) {
        addTestResult('❌ Error checking authentication');
      }
    }
  };

  const testEmailSignup = async () => {
    addTestResult('📧 Testing Email/Password Signup...');

    try {
      const response = await fetch('https://dev.aurigraph.io/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('aurex_auth_token', data.access_token);
        setCurrentUser(data.user);
        addTestResult('✅ Email signup successful');
        addTestResult(`👤 User created: ${data.user.email}`);
        
        // Test application access
        setTimeout(() => testApplicationAccess(), 1000);
      } else {
        const errorData = await response.json();
        addTestResult(`❌ Email signup failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      addTestResult(`❌ Email signup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testEmailLogin = async () => {
    addTestResult('🔑 Testing Email/Password Login...');

    try {
      const response = await fetch('https://dev.aurigraph.io/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('aurex_auth_token', data.access_token);
        setCurrentUser(data.user);
        addTestResult('✅ Email login successful');
        
        // Test application access
        setTimeout(() => testApplicationAccess(), 1000);
      } else {
        const errorData = await response.json();
        addTestResult(`❌ Email login failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      addTestResult(`❌ Email login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testApplicationAccess = async () => {
    setIsTestingAPI(true);
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
      setIsTestingAPI(false);
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

  const handleGoogleSuccess = (user: any) => {
    setCurrentUser(user);
    addTestResult(`✅ Google OAuth Success: ${user.email}`);
    addTestResult(`👤 Google user logged in: ${user.name}`);
    addTestResult(`🔑 Provider: ${user.provider}`);
    
    // Test application access after Google OAuth
    setTimeout(() => testApplicationAccess(), 1000);
  };

  const handleGoogleError = (error: string) => {
    addTestResult(`❌ Google OAuth Error: ${error}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('aurex_auth_token');
    setCurrentUser(null);
    addTestResult('✅ Logout successful');
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
            🧪 Standalone OAuth & User Signup Test
          </h1>

          {/* Current Status */}
          <div className="mb-8 p-4 rounded-lg bg-gray-100">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Authenticated:</strong> {currentUser ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Token:</strong> {localStorage.getItem('aurex_auth_token') ? '✅ Present' : '❌ None'}</p>
              </div>
              {currentUser && (
                <div>
                  <p><strong>Name:</strong> {currentUser.name}</p>
                  <p><strong>Email:</strong> {currentUser.email}</p>
                  <p><strong>Provider:</strong> {currentUser.provider}</p>
                  <p><strong>User ID:</strong> {currentUser.id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Test Controls */}
          {!currentUser ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Email/Password Signup */}
              <div className="p-4 rounded-lg bg-blue-50">
                <h2 className="text-xl font-semibold mb-4">📧 Email/Password Test</h2>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📧 Test Signup
                  </button>
                  <button
                    onClick={testEmailLogin}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    🔑 Test Login
                  </button>
                  <button
                    onClick={generateNewTestUser}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    🔄 New
                  </button>
                </div>
              </div>

              {/* Google OAuth */}
              <div className="p-4 rounded-lg bg-green-50">
                <h2 className="text-xl font-semibold mb-4">🔐 Google OAuth Test</h2>
                <p className="text-gray-600 mb-4">
                  Test Google OAuth authentication:
                </p>
                <SimpleGoogleAuth
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
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
                  disabled={isTestingAPI}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isTestingAPI ? '🔄 Testing...' : '🔐 Test App Access'}
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
              <li>This page works independently of the auth context</li>
              <li>Test email/password signup and login</li>
              <li>Test Google OAuth authentication</li>
              <li>Verify application access after authentication</li>
              <li>Test Launchpad and Dashboard access</li>
              <li>Verify logout functionality</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneOAuthTest;
