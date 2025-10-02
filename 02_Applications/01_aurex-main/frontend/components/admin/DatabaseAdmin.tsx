import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Users,
  Activity,
  BarChart3,
  Shield,
  Search,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { databaseService, DatabaseStatus, TableInfo, UserSession } from '../../services/databaseService';

// Database connection status interface
interface DatabaseStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tables: number;
  records: number;
  size: string;
  lastBackup: string;
}

// Table information interface
interface TableInfo {
  name: string;
  schema: string;
  records: number;
  size: string;
  lastModified: string;
}

// User session interface
interface UserSession {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastActivity: string;
  ipAddress: string;
}

const DatabaseAdmin: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseStatus[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [users, setUsers] = useState<UserSession[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('aurex_platform');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Mock data - Replace with actual API calls
  useEffect(() => {
    loadDatabaseStatus();
    loadTableInfo();
    loadUserSessions();
  }, [selectedDatabase]);

  const loadDatabaseStatus = async () => {
    setLoading(true);
    try {
      const databases = await databaseService.getDatabaseStatus();
      setDatabases(databases);
    } catch (err) {
      setError('Failed to load database status');
      console.error('Database status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async () => {
    try {
      const tables = await databaseService.getTableInfo(selectedDatabase);
      setTables(tables);
    } catch (err) {
      setError('Failed to load table information');
      console.error('Table info error:', err);
    }
  };

  const loadUserSessions = async () => {
    try {
      const users = await databaseService.getUserSessions();
      setUsers(users);
    } catch (err) {
      setError('Failed to load user sessions');
      console.error('User sessions error:', err);
    }
  };

  const handleRefresh = () => {
    loadDatabaseStatus();
    loadTableInfo();
    loadUserSessions();
  };

  const handleBackupDatabase = async (dbName: string) => {
    setLoading(true);
    try {
      const result = await databaseService.backupDatabase(dbName);
      if (result.success) {
        alert(`Database ${dbName} backup initiated successfully`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to backup database: ${dbName}`);
      console.error('Backup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-red-100 text-red-800',
      error: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Administration</h1>
          <p className="text-muted-foreground">
            Monitor and manage Aurex platform databases, users, and system health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Database Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {databases.map((db) => (
          <Card key={db.name} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedDatabase(db.name)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Database className="h-5 w-5 text-blue-600" />
                <Badge className={getStatusBadge(db.status)}>
                  {db.status}
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium">{db.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Tables: {db.tables}</div>
                <div>Records: {db.records.toLocaleString()}</div>
                <div>Size: {db.size}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">
            <Database className="h-4 w-4 mr-2" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users & Sessions
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Query
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Database: {selectedDatabase}</CardTitle>
              <CardDescription>
                Tables and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredTables.map((table) => (
                    <div key={table.name}
                         className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{table.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {table.records.toLocaleString()} records • {table.size} •
                          Modified: {table.lastModified}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Current user sessions and authentication status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div key={user.id}
                         className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Role: {user.role} • IP: {user.ipAddress} •
                          Last Activity: {user.lastActivity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs content would go here */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>Real-time database performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Monitoring dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Database Analytics</CardTitle>
              <CardDescription>Usage patterns and performance insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Access Control</CardTitle>
              <CardDescription>User permissions and security audit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Security dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseAdmin;
