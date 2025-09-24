/**
 * Database Service for Admin Interface
 * Provides API calls for database administration functionality
 */

// Types for database operations
export interface DatabaseStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tables: number;
  records: number;
  size: string;
  lastBackup: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  records: number;
  size: string;
  lastModified: string;
}

export interface UserSession {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastActivity: string;
  ipAddress: string;
  userAgent?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userEmail: string;
  userRole: string;
  timestamp: string;
  ipAddress: string;
  details?: any;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

class DatabaseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003';
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('keycloak_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Handle API responses
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    return response.json();
  }

  // Get all database status
  async getDatabaseStatus(): Promise<DatabaseStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/databases/status`, {
        headers: this.getHeaders()
      });
      return this.handleResponse<DatabaseStatus[]>(response);
    } catch (error) {
      console.error('Error fetching database status:', error);
      // Return mock data for development
      return this.getMockDatabaseStatus();
    }
  }

  // Get table information for a specific database
  async getTableInfo(databaseName: string): Promise<TableInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/databases/${databaseName}/tables`, {
        headers: this.getHeaders()
      });
      return this.handleResponse<TableInfo[]>(response);
    } catch (error) {
      console.error('Error fetching table info:', error);
      return this.getMockTableInfo();
    }
  }

  // Get active user sessions
  async getUserSessions(): Promise<UserSession[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users/sessions`, {
        headers: this.getHeaders()
      });
      return this.handleResponse<UserSession[]>(response);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return this.getMockUserSessions();
    }
  }

  // Get audit logs
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/audit/logs?limit=${limit}`, {
        headers: this.getHeaders()
      });
      return this.handleResponse<AuditLog[]>(response);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return this.getMockAuditLogs();
    }
  }

  // Execute SQL query (admin only)
  async executeQuery(databaseName: string, query: string): Promise<QueryResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/databases/${databaseName}/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ query })
      });
      return this.handleResponse<QueryResult>(response);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  // Backup database
  async backupDatabase(databaseName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/databases/${databaseName}/backup`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      return this.handleResponse<{ success: boolean; message: string }>(response);
    } catch (error) {
      console.error('Error backing up database:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Backup failed'
      };
    }
  }

  // Get database health metrics
  async getHealthMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/health/metrics`, {
        headers: this.getHeaders()
      });
      return this.handleResponse<any>(response);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      return {};
    }
  }

  // Mock data methods for development
  private getMockDatabaseStatus(): DatabaseStatus[] {
    return [
      {
        name: 'aurex_platform',
        status: 'connected',
        tables: 8,
        records: 1250,
        size: '45.2 MB',
        lastBackup: '2025-01-30 08:00:00'
      },
      {
        name: 'aurex_hydropulse',
        status: 'connected',
        tables: 12,
        records: 3420,
        size: '128.5 MB',
        lastBackup: '2025-01-30 08:00:00'
      },
      {
        name: 'aurex_carbontrace',
        status: 'connected',
        tables: 10,
        records: 890,
        size: '67.8 MB',
        lastBackup: '2025-01-30 08:00:00'
      },
      {
        name: 'aurex_sylvagraph',
        status: 'connected',
        tables: 9,
        records: 567,
        size: '34.2 MB',
        lastBackup: '2025-01-30 08:00:00'
      },
      {
        name: 'aurex_launchpad',
        status: 'connected',
        tables: 11,
        records: 234,
        size: '23.1 MB',
        lastBackup: '2025-01-30 08:00:00'
      }
    ];
  }

  private getMockTableInfo(): TableInfo[] {
    return [
      {
        name: 'users',
        schema: 'public',
        records: 156,
        size: '2.3 MB',
        lastModified: '2025-01-30 14:30:00'
      },
      {
        name: 'user_sessions',
        schema: 'public',
        records: 89,
        size: '1.1 MB',
        lastModified: '2025-01-30 15:45:00'
      },
      {
        name: 'audit_logs',
        schema: 'public',
        records: 1005,
        size: '15.2 MB',
        lastModified: '2025-01-30 16:00:00'
      },
      {
        name: 'farmers',
        schema: 'public',
        records: 234,
        size: '3.4 MB',
        lastModified: '2025-01-30 12:15:00'
      },
      {
        name: 'farms',
        schema: 'public',
        records: 189,
        size: '2.8 MB',
        lastModified: '2025-01-30 11:30:00'
      }
    ];
  }

  private getMockUserSessions(): UserSession[] {
    return [
      {
        id: '1',
        email: 'admin@aurigraph.io',
        role: 'SUPER_ADMIN',
        status: 'active',
        lastActivity: '2025-01-30 16:45:00',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Chrome)'
      },
      {
        id: '2',
        email: 'farmer@example.com',
        role: 'FARMER',
        status: 'active',
        lastActivity: '2025-01-30 16:30:00',
        ipAddress: '203.0.113.45',
        userAgent: 'Mozilla/5.0 (Safari)'
      },
      {
        id: '3',
        email: 'verifier@vvb.com',
        role: 'VERIFIER',
        status: 'inactive',
        lastActivity: '2025-01-30 14:20:00',
        ipAddress: '198.51.100.23',
        userAgent: 'Mozilla/5.0 (Firefox)'
      }
    ];
  }

  private getMockAuditLogs(): AuditLog[] {
    return [
      {
        id: '1',
        action: 'USER_LOGIN',
        resource: 'authentication',
        resourceId: 'user_123',
        userEmail: 'admin@aurigraph.io',
        userRole: 'SUPER_ADMIN',
        timestamp: '2025-01-30 16:45:00',
        ipAddress: '192.168.1.100',
        details: { loginMethod: 'keycloak' }
      },
      {
        id: '2',
        action: 'DATABASE_QUERY',
        resource: 'database',
        resourceId: 'aurex_platform',
        userEmail: 'admin@aurigraph.io',
        userRole: 'SUPER_ADMIN',
        timestamp: '2025-01-30 16:40:00',
        ipAddress: '192.168.1.100',
        details: { query: 'SELECT * FROM users LIMIT 10' }
      },
      {
        id: '3',
        action: 'FARMER_CREATED',
        resource: 'farmer',
        resourceId: 'farmer_456',
        userEmail: 'agent@aurigraph.io',
        userRole: 'FIELD_AGENT',
        timestamp: '2025-01-30 16:30:00',
        ipAddress: '203.0.113.45',
        details: { farmerName: 'John Doe', location: 'Punjab' }
      }
    ];
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
