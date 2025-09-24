import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const AppNavigation = ({ currentApp }) => {
    // Dynamic base URL detection
    const getBaseUrl = () => {
        if (typeof window === 'undefined')
            return 'https://dev.aurigraph.io'; // SSR fallback
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        // Production environment
        if (hostname === 'dev.aurigraph.io') {
            return 'https://dev.aurigraph.io';
        }
        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
        }
        // Default fallback
        return 'https://dev.aurigraph.io';
    };
    const baseUrl = getBaseUrl();
    const isLocalhost = baseUrl.includes('localhost');
    const apps = [
        {
            id: 'platform',
            name: 'Aurex Platform',
            description: 'ESG Management Platform',
            url: isLocalhost ? `${baseUrl}` : `${baseUrl}`,
            icon: '🌱',
            color: 'from-green-500 to-green-600'
        },
        {
            id: 'launchpad',
            name: 'Aurex Launchpad',
            description: 'ESG Assessment & Reporting',
            url: isLocalhost ? `${baseUrl.replace('3000', '3001')}` : `${baseUrl}/launchpad`,
            icon: '🚀',
            color: 'from-blue-500 to-blue-600'
        },
        {
            id: 'hydropulse',
            name: 'Aurex HydroPulse',
            description: 'AWD Water Management',
            url: isLocalhost ? `${baseUrl.replace('3000', '3002')}` : `${baseUrl}/hydropulse`,
            icon: '💧',
            color: 'from-cyan-500 to-cyan-600'
        },
        {
            id: 'carbontrace',
            name: 'Aurex CarbonTrace',
            description: 'Carbon Footprint Tracking',
            url: isLocalhost ? `${baseUrl.replace('3000', '3004')}` : `${baseUrl}/carbontrace`,
            icon: '🌿',
            color: 'from-emerald-500 to-emerald-600'
        },
        {
            id: 'sylvagraph',
            name: 'Aurex SylvaGraph',
            description: 'Forest Management',
            url: isLocalhost ? `${baseUrl.replace('3000', '3003')}` : `${baseUrl}/sylvagraph`,
            icon: '🌳',
            color: 'from-green-600 to-green-700'
        }
    ];
    return (_jsx("div", { className: "bg-white border-b shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-4", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-2xl font-bold text-gray-900", children: "Aurex" }), _jsx("span", { className: "text-sm text-gray-500", children: "Ecosystem" })] }), _jsx("nav", { className: "flex space-x-2", children: apps.map((app) => (_jsxs("a", { href: app.url, className: `
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${currentApp === app.id
                                ? `bg-gradient-to-r ${app.color} text-white shadow-md`
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `, children: [_jsx("span", { className: "text-lg", children: app.icon }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium text-sm", children: app.name }), _jsx("div", { className: "text-xs opacity-75", children: app.description })] })] }, app.id))) })] }) }) }));
};
