import React from 'react'
import {
  UsersIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Mock data for charts
const systemMetrics = [
  { time: '00:00', cpu: 45, memory: 62, requests: 1200 },
  { time: '04:00', cpu: 32, memory: 58, requests: 800 },
  { time: '08:00', cpu: 67, memory: 72, requests: 2400 },
  { time: '12:00', cpu: 78, memory: 85, requests: 3200 },
  { time: '16:00', cpu: 85, memory: 89, requests: 3800 },
  { time: '20:00', cpu: 52, memory: 68, requests: 2100 },
]

const applicationStatus = [
  { name: 'Aurex Platform', status: 'healthy', users: 1542 },
  { name: 'Launchpad', status: 'healthy', users: 892 },
  { name: 'HydroPulse', status: 'warning', users: 234 },
  { name: 'Sylvagraph', status: 'healthy', users: 156 },
  { name: 'CarbonTrace', status: 'healthy', users: 445 },
]

const userActivity = [
  { name: 'Active Users', value: 2845, color: '#0ea5e9' },
  { name: 'Inactive Users', value: 1234, color: '#94a3b8' },
  { name: 'New Signups', value: 156, color: '#10b981' },
]

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-aurex-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-admin-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-2xl font-bold text-admin-900">4,235</dd>
                  <dd className="text-sm text-green-600">+12% from last month</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-aurex-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-admin-500 truncate">
                    Organizations
                  </dt>
                  <dd className="text-2xl font-bold text-admin-900">89</dd>
                  <dd className="text-sm text-green-600">+3 new this week</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-admin-500 truncate">
                    System Health
                  </dt>
                  <dd className="text-2xl font-bold text-admin-900">98.9%</dd>
                  <dd className="text-sm text-admin-600">All systems operational</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-aurex-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-admin-500 truncate">
                    Active Sessions
                  </dt>
                  <dd className="text-2xl font-bold text-admin-900">1,832</dd>
                  <dd className="text-sm text-admin-600">Average session time: 24m</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Metrics Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-admin-900">System Metrics</h3>
            <p className="text-sm text-admin-600">CPU, Memory, and Request metrics over 24 hours</p>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stackId="1"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-admin-900">User Distribution</h3>
            <p className="text-sm text-admin-600">Current user status breakdown</p>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userActivity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userActivity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {userActivity.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-admin-700">
                    {item.name}: {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Application Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-admin-900">Application Status</h3>
          <p className="text-sm text-admin-600">Current status of all Aurex platform applications</p>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Application</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Active Users</th>
                  <th className="table-header-cell">Last Updated</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {applicationStatus.map((app, index) => (
                  <tr key={index}>
                    <td className="table-body-cell">
                      <div className="flex items-center">
                        <CpuChipIcon className="h-5 w-5 text-admin-400 mr-2" />
                        <span className="font-medium">{app.name}</span>
                      </div>
                    </td>
                    <td className="table-body-cell">
                      <span
                        className={`badge ${
                          app.status === 'healthy'
                            ? 'badge-success'
                            : app.status === 'warning'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="table-body-cell">
                      {app.users.toLocaleString()}
                    </td>
                    <td className="table-body-cell text-admin-500">
                      2 minutes ago
                    </td>
                    <td className="table-body-cell">
                      <button className="btn-ghost btn-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-admin-900">Recent System Activity</h3>
          <p className="text-sm text-admin-600">Latest system events and administrative actions</p>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-mb-8">
              {[
                {
                  event: 'New user registration',
                  details: 'user@example.com joined Organization ABC',
                  time: '5 minutes ago',
                  type: 'success',
                },
                {
                  event: 'System backup completed',
                  details: 'Database backup completed successfully',
                  time: '1 hour ago',
                  type: 'info',
                },
                {
                  event: 'High memory usage detected',
                  details: 'Launchpad application memory usage at 92%',
                  time: '2 hours ago',
                  type: 'warning',
                },
                {
                  event: 'Security audit completed',
                  details: 'Monthly security scan completed with no issues',
                  time: '4 hours ago',
                  type: 'success',
                },
              ].map((activity, activityIdx) => (
                <li key={activityIdx}>
                  <div className="relative pb-8">
                    {activityIdx !== 3 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-admin-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            activity.type === 'success'
                              ? 'bg-green-500'
                              : activity.type === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-aurex-500'
                          }`}
                        >
                          {activity.type === 'success' ? (
                            <CheckCircleIcon className="w-5 h-5 text-white" />
                          ) : activity.type === 'warning' ? (
                            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                          ) : (
                            <ChartBarIcon className="w-5 h-5 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm font-medium text-admin-900">
                            {activity.event}
                          </p>
                          <p className="text-sm text-admin-500">
                            {activity.details}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-admin-500">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard