import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Users,
  Shield,
  Activity,
  Settings,
  BarChart3,
  FileText,
  Key,
  Server,
  Monitor
} from 'lucide-react';

interface AdminNavItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  status?: 'available' | 'coming-soon' | 'beta';
}

const AdminNavigation: React.FC = () => {
  const location = useLocation();

  const adminItems: AdminNavItem[] = [
    {
      title: 'Database Administration',
      description: 'Monitor and manage PostgreSQL databases, tables, and data',
      href: '/admin/database',
      icon: <Database className="h-6 w-6" />,
      status: 'available'
    },
    {
      title: 'Subdomain Deployment',
      description: 'Monitor clean subdomain architecture implementation progress',
      href: '/admin/subdomains',
      icon: <Monitor className="h-6 w-6" />,
      status: 'available',
      badge: 'Live'
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions across all applications',
      href: '/admin/users',
      icon: <Users className="h-6 w-6" />,
      status: 'coming-soon'
    },
    {
      title: 'Security & Access Control',
      description: 'Configure security policies, audit logs, and access controls',
      href: '/admin/security',
      icon: <Shield className="h-6 w-6" />,
      status: 'coming-soon'
    },
    {
      title: 'System Monitoring',
      description: 'Real-time monitoring of system health and performance',
      href: '/admin/monitoring',
      icon: <Activity className="h-6 w-6" />,
      status: 'beta'
    },
    {
      title: 'Analytics & Reports',
      description: 'Generate reports and analyze platform usage patterns',
      href: '/admin/analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      status: 'coming-soon'
    },
    {
      title: 'Audit Logs',
      description: 'View and search comprehensive audit trails',
      href: '/admin/audit',
      icon: <FileText className="h-6 w-6" />,
      status: 'beta'
    },
    {
      title: 'Keycloak Management',
      description: 'Manage authentication realms, clients, and SSO configuration',
      href: '/admin/keycloak',
      icon: <Key className="h-6 w-6" />,
      status: 'coming-soon'
    },
    {
      title: 'Infrastructure',
      description: 'Manage containers, deployments, and infrastructure settings',
      href: '/admin/infrastructure',
      icon: <Server className="h-6 w-6" />,
      status: 'coming-soon'
    },
    {
      title: 'System Settings',
      description: 'Configure global platform settings and preferences',
      href: '/admin/settings',
      icon: <Settings className="h-6 w-6" />,
      status: 'coming-soon'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800">Beta</Badge>;
      case 'coming-soon':
        return <Badge className="bg-gray-100 text-gray-800">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Administration Panel</h1>
        <p className="text-muted-foreground">
          Manage and monitor the Aurex platform infrastructure, users, and data
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Database className="h-5 w-5 text-blue-600" />
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Databases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-green-600" />
              <Badge className="bg-blue-100 text-blue-800">Active</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Monitor className="h-5 w-5 text-purple-600" />
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-orange-600" />
              <Badge className="bg-yellow-100 text-yellow-800">Monitoring</Badge>
            </div>
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2K</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminItems.map((item) => (
          <Card
            key={item.href}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              isActive(item.href) ? 'ring-2 ring-blue-500 shadow-md' : ''
            } ${
              item.status === 'coming-soon' ? 'opacity-60' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </div>
                {getStatusBadge(item.status || 'available')}
              </div>
              <CardDescription className="text-sm">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {item.status === 'available' ? (
                <Link to={item.href}>
                  <Button className="w-full">
                    Access Tool
                  </Button>
                </Link>
              ) : (
                <Button className="w-full" disabled>
                  {item.status === 'beta' ? 'Beta Access' : 'Coming Soon'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/database">
              <Button variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                View Databases
              </Button>
            </Link>
            <Link to="/admin/subdomains">
              <Button variant="outline" size="sm">
                <Monitor className="h-4 w-4 mr-2" />
                Subdomain Monitor
              </Button>
            </Link>
            <Button variant="outline" size="sm" disabled>
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Activity className="h-4 w-4 mr-2" />
              System Health
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Platform Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* External Tools */}
      <Card>
        <CardHeader>
          <CardTitle>External Administration Tools</CardTitle>
          <CardDescription>
            Direct access to external admin interfaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">PgAdmin</div>
                <div className="text-sm text-muted-foreground">PostgreSQL Administration</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('http://localhost:5050', '_blank')}
              >
                Open
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Keycloak Admin</div>
                <div className="text-sm text-muted-foreground">Identity Management</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('http://localhost:8080/admin', '_blank')}
              >
                Open
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Grafana</div>
                <div className="text-sm text-muted-foreground">Monitoring Dashboard</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('http://localhost:3000', '_blank')}
                disabled
              >
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNavigation;
