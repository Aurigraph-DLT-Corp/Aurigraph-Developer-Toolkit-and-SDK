import React from 'react';
import { motion } from 'framer-motion';
import { 
  RocketLaunchIcon,
  BeakerIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Application {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  url: string;
  port: number;
  features: string[];
  status: 'active' | 'maintenance' | 'coming-soon';
  gradient: string;
}

const applications: Application[] = [
  {
    id: 'launchpad',
    name: 'Aurex Launchpad',
    title: 'ESG Assessment & Reporting',
    description: 'Complete comprehensive ESG assessments with AI-powered insights and automated compliance reporting.',
    icon: RocketLaunchIcon,
    url: 'http://localhost:3001',
    port: 3001,
    features: ['AI-powered ESG Assessment', 'Regulatory Compliance', 'Automated Reporting', 'Risk Analysis'],
    status: 'active',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'hydropulse',
    name: 'HydroPulse',
    title: 'Water Management & Optimization',
    description: 'Intelligent water management system with IoT sensors and predictive analytics for sustainable agriculture.',
    icon: BeakerIcon,
    url: 'http://localhost:3002',
    port: 3002,
    features: ['IoT Sensor Integration', 'Water Usage Optimization', 'Crop Monitoring', 'Predictive Analytics'],
    status: 'active',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'sylvagraph',
    name: 'Sylvagraph',
    title: 'Forest Monitoring & Analysis',
    description: 'AI-powered forest monitoring using satellite imagery and computer vision for deforestation prevention.',
    icon: EyeIcon,
    url: 'http://localhost:3003',
    port: 3003,
    features: ['Satellite Imagery Analysis', 'Deforestation Alerts', 'Biodiversity Monitoring', 'Carbon Sequestration'],
    status: 'active',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    id: 'carbontrace',
    name: 'CarbonTrace',
    title: 'Carbon Credit Management',
    description: 'Blockchain-verified carbon credit trading platform with automated MRV processes and marketplace integration.',
    icon: CurrencyDollarIcon,
    url: 'http://localhost:3004',
    port: 3004,
    features: ['Blockchain Verification', 'Carbon Credit Trading', 'Revenue Generation', 'Marketplace Access'],
    status: 'active',
    gradient: 'from-amber-500 to-orange-600'
  }
];

const StatusBadge: React.FC<{ status: Application['status'] }> = ({ status }) => {
  const getStatusConfig = (status: Application['status']) => {
    switch (status) {
      case 'active':
        return { label: 'Active', className: 'bg-green-100 text-green-800' };
      case 'maintenance':
        return { label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800' };
      case 'coming-soon':
        return { label: 'Coming Soon', className: 'bg-gray-100 text-gray-800' };
      default:
        return { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'active' ? 'bg-green-400' : status === 'maintenance' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
      {config.label}
    </span>
  );
};

const ApplicationCard: React.FC<{ app: Application; index: number }> = ({ app, index }) => {
  const handleLaunch = () => {
    if (app.status === 'active') {
      window.open(app.url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 ${
        app.status !== 'active' ? 'opacity-75' : ''
      }`}
    >
      {/* Gradient Header */}
      <div className={`h-32 bg-gradient-to-r ${app.gradient} relative`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-4 left-4">
          <app.icon className="w-8 h-8 text-white" />
        </div>
        <div className="absolute top-4 right-4">
          <StatusBadge status={app.status} />
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold">{app.name}</h3>
          <p className="text-sm text-white/80">Port {app.port}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{app.title}</h4>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">{app.description}</p>
        
        {/* Features */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Key Features</h5>
          <ul className="space-y-1">
            {app.features.map((feature, idx) => (
              <li key={idx} className="flex items-center text-xs text-gray-600">
                <SparklesIcon className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Launch Button */}
        <button
          onClick={handleLaunch}
          disabled={app.status !== 'active'}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            app.status === 'active'
              ? 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {app.status === 'active' ? (
            <>
              Launch Application
              <ArrowRightIcon className="w-4 h-4" />
            </>
          ) : (
            <span>
              {app.status === 'maintenance' ? 'Under Maintenance' : 'Coming Soon'}
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const PlatformDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Aurex Platform</h1>
              <p className="text-gray-600 mt-1">ESG Digital Measurement, Reporting & Verification Suite</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back!</p>
                <p className="text-sm font-medium text-gray-900">Select an application to begin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete ESG Management Suite</h2>
          <p className="text-gray-700 mb-4">
            Access all four specialized applications for comprehensive environmental, social, and governance monitoring. 
            Each application is designed to work independently or as part of an integrated DMRV workflow.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span className="text-gray-600">All systems operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span className="text-gray-600">Real-time monitoring active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full" />
              <span className="text-gray-600">AI analytics enabled</span>
            </div>
          </div>
        </motion.div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {applications.map((app, index) => (
            <ApplicationCard key={app.id} app={app} index={index} />
          ))}
        </div>

        {/* Platform Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-indigo-600">4</div>
            <div className="text-sm text-gray-600">Applications</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">24/7</div>
            <div className="text-sm text-gray-600">Monitoring</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">AI</div>
            <div className="text-sm text-gray-600">Powered</div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Aurex Platform v3.3 - Built with the VIBE Framework (Velocity, Intelligence, Balance, Excellence)</p>
        </footer>
      </main>
    </div>
  );
};

export default PlatformDashboard;