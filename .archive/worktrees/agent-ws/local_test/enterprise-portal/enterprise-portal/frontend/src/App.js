import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function App() {
    const [activeModule, setActiveModule] = useState('dashboard');
    const [user, setUser] = useState({ name: 'Admin User', role: 'Administrator' });
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Fetch initial data
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:8001/api/notifications');
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.log('Using mock notifications');
            setNotifications([
                { id: 1, message: 'GNN Platform deployed successfully', type: 'success' },
                { id: 2, message: '15 agents active', type: 'info' },
                { id: 3, message: 'New LCA report available', type: 'warning' }
            ]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header user={user} notifications={notifications} />
            <div className="flex">
                <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
                <main className="flex-1 p-6">
                    <Dashboard module={activeModule} />
                </main>
            </div>
        </div>
    );
}

export default App;
