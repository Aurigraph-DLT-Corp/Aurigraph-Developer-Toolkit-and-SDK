export interface AuditLogEntry {
  timestamp: number;
  user: string;
  action: string;
  status: 'success' | 'failure';
  details: string;
  ipAddress?: string;
}

export const getAuditLogs = async (): Promise<AuditLogEntry[]> => {
  const response = await fetch('/api/v11/audit/logs');
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
};

export const filterLogsByUser = async (user: string): Promise<AuditLogEntry[]> => {
  const logs = await getAuditLogs();
  return logs.filter(log => log.user === user);
};

export const filterLogsByAction = async (action: string): Promise<AuditLogEntry[]> => {
  const logs = await getAuditLogs();
  return logs.filter(log => log.action.includes(action));
};
