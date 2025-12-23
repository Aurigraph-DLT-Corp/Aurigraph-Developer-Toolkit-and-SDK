import React from 'react';

const Sidebar = ({ activeModule, setActiveModule }) => {
    const modules = [
        { id: 'dashboard', name: '📊 Dashboard', description: 'Executive Overview' },
        { id: 'gnn', name: '🧠 GNN Platform', description: 'Neural Networks' },
        { id: 'sustainability', name: '🌿 Sustainability', description: 'LCA/PCF Analysis' },
        { id: 'agents', name: '🤖 AI Agents', description: 'Mission Control' },
        { id: 'supply', name: '🔗 Supply Chain', description: 'Network Analysis' },
        { id: 'water', name: '💧 Water Resources', description: 'Management' },
        { id: 'carbon', name: '🌍 Carbon Credits', description: 'Verification' },
        { id: 'forest', name: '🌲 Forest Monitor', description: 'Ecosystem Health' },
        { id: 'reports', name: '📈 Reports', description: 'Analytics' },
        { id: 'settings', name: '⚙️ Settings', description: 'Configuration' }
    ];

    return (
        <div className="w-64 bg-gray-800 text-white min-h-screen">
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-6">🏢 Enterprise Portal</h2>
                <nav>
                    {modules.map(module => (
                        <div
                            key={module.id}
                            onClick={() => setActiveModule(module.id)}
                            className={`cursor-pointer p-3 rounded-lg mb-2 transition-all ${
                                activeModule === module.id
                                    ? 'bg-blue-600'
                                    : 'hover:bg-gray-700'
                            }`}
                        >
                            <div className="font-medium">{module.name}</div>
                            <div className="text-xs text-gray-400">{module.description}</div>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;
