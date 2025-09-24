import React from 'react';

const AurexHeader = ({ appName, appIcon, appColor = "blue" }) => {
  const colorVariants = {
    blue: "from-blue-500 to-cyan-600",
    green: "from-green-500 to-emerald-600", 
    purple: "from-purple-500 to-violet-600",
    orange: "from-orange-500 to-red-600"
  };

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className={`w-12 h-12 bg-gradient-to-r ${colorVariants[appColor]} rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all`}
            >
              <span className="text-2xl text-white">{appIcon}</span>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
              <p className="text-sm text-gray-600 font-medium">Aurex Platform™</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Main Platform
            </a>
            <a
              href="/launchpad"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Launchpad
            </a>
            <a
              href="/contact"
              className={`px-4 py-2 bg-gradient-to-r ${colorVariants[appColor]} text-white rounded-lg font-medium hover:shadow-lg transition-all`}
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AurexHeader;