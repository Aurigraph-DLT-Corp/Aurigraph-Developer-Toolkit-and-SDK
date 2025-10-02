import React from 'react';

interface NavigationProps {
  currentApp: 'platform' | 'launchpad' | 'hydropulse' | 'carbontrace' | 'sylvagraph';
}

const apps = [
  {
    id: 'platform',
    name: 'Aurex Platform',
    description: 'ESG Management Platform',
    url: 'https://platform.dev.aurigraph.io',
    icon: '🌱',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'launchpad',
    name: 'Aurex Launchpad',
    description: 'ESG Assessment & Reporting',
    url: 'https://launchpad.dev.aurigraph.io',
    icon: '🚀',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'hydropulse',
    name: 'Aurex HydroPulse',
    description: 'AWD Water Management',
    url: 'https://hydropulse.dev.aurigraph.io',
    icon: '💧',
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'carbontrace',
    name: 'Aurex CarbonTrace',
    description: 'Carbon Footprint Tracking',
    url: 'https://carbontrace.dev.aurigraph.io',
    icon: '🌿',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'sylvagraph',
    name: 'Aurex SylvaGraph',
    description: 'Forest Management',
    url: 'https://sylvagraph.dev.aurigraph.io',
    icon: '🌳',
    color: 'from-green-600 to-green-700'
  }
];

export const AppNavigation: React.FC<NavigationProps> = ({ currentApp }) => {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-1">
            <span className="text-2xl font-bold text-gray-900">Aurex</span>
            <span className="text-sm text-gray-500">Ecosystem</span>
          </div>
          
          <nav className="flex space-x-2">
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.url}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${currentApp === app.id 
                    ? `bg-gradient-to-r ${app.color} text-white shadow-md` 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-lg">{app.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{app.name}</div>
                  <div className="text-xs opacity-75">{app.description}</div>
                </div>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};
