import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Utils
import { trackCTAClick } from '../utils/analytics';
const Header = () => {
    const currentApp = 'platform';
    const apps = [
        {
            id: 'platform',
            name: 'Aurex Platform',
            description: 'ESG Management Platform',
            url: 'http://localhost:3000',
            icon: '🌱',
            color: 'from-green-500 to-green-600'
        },
        {
            id: 'launchpad',
            name: 'Aurex Launchpad',
            description: 'ESG Assessment & Reporting',
            url: 'http://localhost:3001',
            icon: '🚀',
            color: 'from-blue-500 to-blue-600'
        },
        {
            id: 'hydropulse',
            name: 'Aurex HydroPulse',
            description: 'Water Management System',
            url: 'http://localhost:3002',
            icon: '💧',
            color: 'from-cyan-500 to-cyan-600'
        },
        {
            id: 'carbontrace',
            name: 'Aurex CarbonTrace',
            description: 'Carbon Trading Platform',
            url: 'http://localhost:3004',
            icon: '🌿',
            color: 'from-emerald-500 to-emerald-600'
        }
    ];
    const handleCTAClick = (ctaName) => {
        trackCTAClick(ctaName, 'header');
    };
    return (_jsx("div", { className: "bg-white border-b shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-4", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-2xl font-bold text-gray-900", children: "Aurigraph" }), _jsx("span", { className: "text-sm text-gray-500", children: "Aurex" })] }), _jsx("nav", { className: "flex space-x-2", children: apps.map((app) => (_jsxs("a", { href: app.url, className: `
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${currentApp === app.id
                                ? `bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md`
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `, onClick: () => handleCTAClick(`ecosystem_nav_${app.id}`), children: [_jsx("span", { className: "text-lg", children: app.icon }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium text-sm", children: app.name }), _jsx("div", { className: "text-xs opacity-75", children: app.description })] })] }, app.id))) })] }) }) }));
};
export default Header;
