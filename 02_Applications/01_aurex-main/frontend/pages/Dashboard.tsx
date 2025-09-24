/**
 * User Dashboard Page for Aurex Platform
 *
 * Protected page that demonstrates Keycloak authentication
 * and role-based access control.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Shield,
  BarChart3,
  Leaf,
  Droplets,
  Trees,
  TrendingUp,
  Settings,
  Bell,
  Calendar,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/" className="text-green-600 hover:text-green-700">
                  <Leaf className="h-8 w-8" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Aurex Dashboard</h1>
                  <p className="text-gray-600">Sustainability Management Platform</p>
                </div>
              </div>
              <LoginButton showUserInfo={true} />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.username
                      }
                    </h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>

                {/* User Roles */}
                {user?.roles && user.roles.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Your Roles</h4>
                    <div className="space-y-1">
                      {user.roles.map((role) => (
                        <div
                          key={role}
                          className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-md"
                        >
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <nav className="space-y-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </Link>
                  <Link
                    to="/dashboard/projects"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <FileText className="h-4 w-4" />
                    Projects
                  </Link>
                  <Link
                    to="/dashboard/analytics"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <Activity className="h-4 w-4" />
                    Analytics
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Welcome Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.firstName || user?.username}!
                </h2>
                <p className="text-gray-600 mb-4">
                  Here's your sustainability dashboard overview.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Leaf className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-900">12</div>
                        <div className="text-sm text-green-700">Active Projects</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-900">85%</div>
                        <div className="text-sm text-blue-700">ESG Score</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Trees className="h-8 w-8 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-purple-900">2.4k</div>
                        <div className="text-sm text-purple-700">CO₂ Offset (tons)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Access */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    to="/launchpad"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <BarChart3 className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Aurex Launchpad</div>
                      <div className="text-sm text-gray-600">ESG Assessment & Net-Zero Planning</div>
                    </div>
                  </Link>

                  <Link
                    to="/hydropulse"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <Droplets className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Aurex HydroPulse</div>
                      <div className="text-sm text-gray-600">Water Management & IoT Solutions</div>
                    </div>
                  </Link>

                  <Link
                    to="/sylvagraph"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <Trees className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Aurex SylvaGraph</div>
                      <div className="text-sm text-gray-600">Forest Monitoring & Carbon Sequestration</div>
                    </div>
                  </Link>

                  <Link
                    to="/carbon-trace"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Aurex CarbonTrace</div>
                      <div className="text-sm text-gray-600">Carbon Credit Trading & DMRV</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">ESG Assessment Completed</div>
                      <div className="text-sm text-gray-600">2 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">New Carbon Credits Available</div>
                      <div className="text-sm text-gray-600">1 day ago</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Water Usage Report Generated</div>
                      <div className="text-sm text-gray-600">3 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
