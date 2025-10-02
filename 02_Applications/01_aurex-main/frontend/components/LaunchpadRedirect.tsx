import { useEffect } from 'react';

const LaunchpadRedirect = () => {
  useEffect(() => {
    // Redirect to the standalone Launchpad app on port 3000
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;

    // Check if we're on dev.aurigraph.io (production) or localhost (development)
    if (currentHost === 'dev.aurigraph.io') {
      // Production: redirect to port 3000
      window.location.href = `${protocol}//${currentHost}:3000/`;
    } else {
      // Development: redirect to localhost:3000
      window.location.href = `${protocol}//localhost:3000/`;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Aurex Launchpad...</p>
      </div>
    </div>
  );
};

export default LaunchpadRedirect;