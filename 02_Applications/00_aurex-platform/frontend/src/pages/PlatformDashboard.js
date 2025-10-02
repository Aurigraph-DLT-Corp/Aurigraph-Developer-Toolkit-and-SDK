import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { RocketLaunchIcon, BeakerIcon, EyeIcon, CurrencyDollarIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
const applications = [
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
const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
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
    return (_jsxs("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`, children: [_jsx("div", { className: `w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'active' ? 'bg-green-400' : status === 'maintenance' ? 'bg-yellow-400' : 'bg-gray-400'}` }), config.label] }));
};
const ApplicationCard = ({ app, index }) => {
    const handleLaunch = () => {
        if (app.status === 'active') {
            window.open(app.url, '_blank');
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, whileHover: { y: -5, scale: 1.02 }, className: `relative overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 ${app.status !== 'active' ? 'opacity-75' : ''}`, children: [_jsxs("div", { className: `h-32 bg-gradient-to-r ${app.gradient} relative`, children: [_jsx("div", { className: "absolute inset-0 bg-black/10" }), _jsx("div", { className: "absolute top-4 left-4", children: _jsx(app.icon, { className: "w-8 h-8 text-white" }) }), _jsx("div", { className: "absolute top-4 right-4", children: _jsx(StatusBadge, { status: app.status }) }), _jsxs("div", { className: "absolute bottom-4 left-4 text-white", children: [_jsx("h3", { className: "text-xl font-bold", children: app.name }), _jsxs("p", { className: "text-sm text-white/80", children: ["Port ", app.port] })] })] }), _jsxs("div", { className: "p-6", children: [_jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: app.title }), _jsx("p", { className: "text-gray-600 mb-4 text-sm leading-relaxed", children: app.description }), _jsxs("div", { className: "mb-6", children: [_jsx("h5", { className: "text-sm font-medium text-gray-900 mb-2", children: "Key Features" }), _jsx("ul", { className: "space-y-1", children: app.features.map((feature, idx) => (_jsxs("li", { className: "flex items-center text-xs text-gray-600", children: [_jsx(SparklesIcon, { className: "w-3 h-3 text-gray-400 mr-2 flex-shrink-0" }), feature] }, idx))) })] }), _jsx("button", { onClick: handleLaunch, disabled: app.status !== 'active', className: `w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${app.status === 'active'
                            ? 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`, children: app.status === 'active' ? (_jsxs(_Fragment, { children: ["Launch Application", _jsx(ArrowRightIcon, { className: "w-4 h-4" })] })) : (_jsx("span", { children: app.status === 'maintenance' ? 'Under Maintenance' : 'Coming Soon' })) })] })] }));
};
const PlatformDashboard = () => {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow-sm border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Aurex Platform" }), _jsx("p", { className: "text-gray-600 mt-1", children: "ESG Digital Measurement, Reporting & Verification Suite" })] }), _jsx("div", { className: "flex items-center gap-4", children: _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Welcome back!" }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: "Select an application to begin" })] }) })] }) }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Complete ESG Management Suite" }), _jsx("p", { className: "text-gray-700 mb-4", children: "Access all four specialized applications for comprehensive environmental, social, and governance monitoring. Each application is designed to work independently or as part of an integrated DMRV workflow." }), _jsxs("div", { className: "flex flex-wrap gap-4 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-green-400 rounded-full" }), _jsx("span", { className: "text-gray-600", children: "All systems operational" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-blue-400 rounded-full" }), _jsx("span", { className: "text-gray-600", children: "Real-time monitoring active" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-purple-400 rounded-full" }), _jsx("span", { className: "text-gray-600", children: "AI analytics enabled" })] })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6", children: applications.map((app, index) => (_jsx(ApplicationCard, { app: app, index: index }, app.id))) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.4 }, className: "mt-12 grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white p-4 rounded-lg border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-indigo-600", children: "4" }), _jsx("div", { className: "text-sm text-gray-600", children: "Applications" })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: "100%" }), _jsx("div", { className: "text-sm text-gray-600", children: "Uptime" })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: "24/7" }), _jsx("div", { className: "text-sm text-gray-600", children: "Monitoring" })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: "AI" }), _jsx("div", { className: "text-sm text-gray-600", children: "Powered" })] })] }), _jsx("footer", { className: "mt-12 text-center text-sm text-gray-500", children: _jsx("p", { children: "Aurex Platform v3.3 - Built with the VIBE Framework (Velocity, Intelligence, Balance, Excellence)" }) })] })] }));
};
export default PlatformDashboard;
