import React, { useState, useEffect } from 'react';

const Dashboard = ({ module }) => {
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, [module]);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8001/api/metrics/${module}`);
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            // Use mock data
            setMetrics(getMockMetrics(module));
        }
        setLoading(false);
    };

    const getMockMetrics = (module) => {
        const mockData = {
            dashboard: {
                title: 'Executive Dashboard',
                cards: [
                    { title: 'Active Projects', value: '24', trend: '+12%', color: 'blue' },
                    { title: 'GNN Models', value: '4', trend: 'Active', color: 'green' },
                    { title: 'Carbon Footprint', value: '125 tCO2', trend: '-8%', color: 'yellow' },
                    { title: 'System Health', value: '98%', trend: 'Stable', color: 'green' }
                ]
            },
            gnn: {
                title: 'GNN Analytics',
                cards: [
                    { title: 'Supply Chain', value: '96%', trend: 'Accuracy', color: 'blue' },
                    { title: 'Water Management', value: '4.2%', trend: 'MAPE', color: 'cyan' },
                    { title: 'Carbon Credits', value: '98%', trend: 'Verified', color: 'green' },
                    { title: 'Forest Health', value: '0.87', trend: 'Index', color: 'green' }
                ]
            },
            sustainability: {
                title: 'Sustainability Metrics',
                cards: [
                    { title: 'Carbon Saved', value: '450 tCO2', trend: '+15%', color: 'green' },
                    { title: 'Water Conserved', value: '2.5M L', trend: '+22%', color: 'blue' },
                    { title: 'Energy Reduced', value: '35%', trend: '+5%', color: 'yellow' },
                    { title: 'Compliance Score', value: '95%', trend: 'Compliant', color: 'green' }
                ]
            },
            agents: {
                title: 'AI Agent Control',
                cards: [
                    { title: 'Active Agents', value: '15', trend: 'Running', color: 'green' },
                    { title: 'Missions Complete', value: '24', trend: '+3 today', color: 'blue' },
                    { title: 'Success Rate', value: '96%', trend: 'High', color: 'green' },
                    { title: 'Avg Response', value: '95ms', trend: 'Fast', color: 'yellow' }
                ]
            }
        };
        return mockData[module] || mockData.dashboard;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">{metrics.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.cards?.map((card, index) => (
                    <div key={index} className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${card.color}-500`}>
                        <h3 className="text-gray-600 text-sm font-medium">{card.title}</h3>
                        <p className="text-3xl font-bold mt-2">{card.value}</p>
                        <p className={`text-sm mt-2 text-${card.color}-600`}>{card.trend}</p>
                    </div>
                ))}
            </div>
            <ModuleContent module={module} />
        </div>
    );
};

const ModuleContent = ({ module }) => {
    const renderContent = () => {
        switch(module) {
            case 'gnn':
                return <GNNModule />;
            case 'sustainability':
                return <SustainabilityModule />;
            case 'agents':
                return <AgentModule />;
            default:
                return <DashboardCharts />;
        }
    };

    return <div className="mt-8">{renderContent()}</div>;
};

const DashboardCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Performance Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50">
                <canvas id="performanceChart"></canvas>
            </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Resource Utilization</h3>
            <div className="space-y-4">
                <ResourceBar label="CPU" value={45} color="blue" />
                <ResourceBar label="Memory" value={62} color="green" />
                <ResourceBar label="Storage" value={78} color="yellow" />
                <ResourceBar label="Network" value={35} color="purple" />
            </div>
        </div>
    </div>
);

const ResourceBar = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`bg-${color}-500 h-2 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const GNNModule = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">GNN Model Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={() => testPrediction('supply_chain')}>
                Test Supply Chain Prediction
            </button>
            <button className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600"
                    onClick={() => testPrediction('water_management')}>
                Test Water Management
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    onClick={() => testPrediction('carbon_credit')}>
                Test Carbon Credits
            </button>
            <button className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
                    onClick={() => testPrediction('forest_ecosystem')}>
                Test Forest Ecosystem
            </button>
        </div>
        <div id="predictionResult" className="mt-4 p-4 bg-gray-50 rounded"></div>
    </div>
);

const SustainabilityModule = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">LCA/PCF Calculator</h3>
        <div className="space-y-4">
            <input type="text" placeholder="Product ID" className="w-full p-2 border rounded" />
            <input type="number" placeholder="Weight (kg)" className="w-full p-2 border rounded" />
            <select className="w-full p-2 border rounded">
                <option>Select Material</option>
                <option>Steel</option>
                <option>Aluminum</option>
                <option>Plastic</option>
                <option>Wood</option>
            </select>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
                Calculate Carbon Footprint
            </button>
        </div>
    </div>
);

const AgentModule = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Active AI Agents</h3>
        <div className="space-y-2">
            {[
                { name: 'Senior Architect', status: 'Active', tasks: 156 },
                { name: 'Security Ops', status: 'Active', tasks: 234 },
                { name: 'Neural Network', status: 'Busy', tasks: 45 },
                { name: 'DevOps', status: 'Active', tasks: 267 },
                { name: 'Data Engineering', status: 'Idle', tasks: 189 }
            ].map((agent, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{agent.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                        agent.status === 'Active' ? 'bg-green-100 text-green-800' :
                        agent.status === 'Busy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>{agent.status}</span>
                    <span className="text-sm text-gray-600">{agent.tasks} tasks</span>
                </div>
            ))}
        </div>
    </div>
);

const testPrediction = async (modelType) => {
    try {
        const response = await fetch('http://localhost:8000/api/gnn/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_type: modelType, data: { test: true } })
        });
        const result = await response.json();
        document.getElementById('predictionResult').innerHTML =
            `<strong>Result:</strong> ${JSON.stringify(result.prediction, null, 2)}`;
    } catch (error) {
        console.error('Prediction failed:', error);
    }
};

export default Dashboard;
