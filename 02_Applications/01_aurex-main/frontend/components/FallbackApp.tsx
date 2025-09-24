import React from 'react';

const FallbackApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌱 Aurex Platform
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Sustainable Technology Solutions
          </p>
          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full">
            ✅ Application is running successfully!
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🔐 Authentication Status
            </h3>
            <p className="text-blue-700 mb-4">
              Keycloak integration is being initialized...
            </p>
            <button
              onClick={() => window.location.href = 'http://localhost:8080/admin'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Open Keycloak Admin
            </button>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              🌐 Platform Applications
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Aurex Main</span>
                <span className="text-green-600">Port 3000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">HydroPulse</span>
                <span className="text-green-600">Port 3001</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">SylvaGraph</span>
                <span className="text-green-600">Port 3002</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">CarbonTrace</span>
                <span className="text-green-600">Port 3003</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Launchpad</span>
                <span className="text-green-600">Port 3004</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            ⚠️ Troubleshooting
          </h3>
          <p className="text-yellow-800 mb-4">
            If you're seeing this page, it means the React application is working but Keycloak authentication may not be fully configured.
          </p>
          <div className="space-y-2 text-sm text-yellow-700">
            <div>• Check if Keycloak is running: <code className="bg-yellow-200 px-2 py-1 rounded">curl http://localhost:8080/health</code></div>
            <div>• Verify realm exists: <code className="bg-yellow-200 px-2 py-1 rounded">curl http://localhost:8080/realms/aurex-platform</code></div>
            <div>• Check browser console (F12) for JavaScript errors</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh Page
          </button>
          
          <button
            onClick={() => window.open('http://localhost:8080/realms/aurex-platform/account', '_blank')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            👤 User Account
          </button>
          
          <button
            onClick={() => window.open('http://localhost:9090', '_blank')}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
          >
            📊 Monitoring
          </button>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Current time: {new Date().toLocaleString()}</p>
          <p>Environment: {import.meta.env.MODE}</p>
          <p>Keycloak URL: {import.meta.env.VITE_KEYCLOAK_URL}</p>
          <p>Realm: {import.meta.env.VITE_KEYCLOAK_REALM}</p>
        </div>
      </div>
    </div>
  );
};

export default FallbackApp;
