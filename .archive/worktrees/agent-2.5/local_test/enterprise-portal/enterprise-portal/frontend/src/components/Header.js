import React from 'react';

const Header = ({ user, notifications }) => {
    return (
        <header className="bg-white shadow-md">
            <div className="px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Aurex Trace Platform</h1>
                    <p className="text-sm text-gray-600">Enterprise Integration Portal v3.0</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <button className="relative">
                            <span className="text-2xl">🔔</span>
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    {notifications.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">👤</span>
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-600">{user.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
