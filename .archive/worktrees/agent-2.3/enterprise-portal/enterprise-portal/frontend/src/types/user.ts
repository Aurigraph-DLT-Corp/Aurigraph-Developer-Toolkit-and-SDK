/**
 * User Management Type Definitions
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  department?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  isSystemRole: boolean;
}

export interface Permission {
  module: string;
  actions: {
    view: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    manage?: boolean;
    deploy?: boolean;
    execute?: boolean;
    validate?: boolean;
    configure?: boolean;
    initiate?: boolean;
  };
}

export const DEFAULT_PERMISSIONS: Permission[] = [
  {
    module: 'Dashboard',
    actions: { view: true, edit: false, delete: false },
  },
  {
    module: 'Transactions',
    actions: { view: true, create: false, edit: false },
  },
  {
    module: 'Blocks',
    actions: { view: true, validate: false },
  },
  {
    module: 'Validators',
    actions: { view: true, manage: false },
  },
  {
    module: 'Smart Contracts',
    actions: { view: true, deploy: false, execute: false },
  },
  {
    module: 'Tokenization',
    actions: { view: true, create: false, manage: false },
  },
  {
    module: 'Bridge',
    actions: { view: true, initiate: false },
  },
  {
    module: 'Security',
    actions: { view: true, configure: false },
  },
  {
    module: 'Monitoring',
    actions: { view: true, configure: false },
  },
  {
    module: 'DevOps',
    actions: { view: false, deploy: false, configure: false, manage: false },
  },
];

// Mock data for development
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@aurigraph.io',
    role: 'Admin',
    status: 'active',
    createdAt: '2025-10-01',
    lastLogin: '2025-10-16 09:30:00',
    department: 'Engineering',
  },
  {
    id: '2',
    username: 'john.doe',
    email: 'john.doe@aurigraph.io',
    role: 'User',
    status: 'active',
    createdAt: '2025-10-05',
    lastLogin: '2025-10-15 14:22:00',
    department: 'Operations',
  },
  {
    id: '3',
    username: 'jane.smith',
    email: 'jane.smith@aurigraph.io',
    role: 'DevOps',
    status: 'active',
    createdAt: '2025-10-08',
    lastLogin: '2025-10-16 08:15:00',
    department: 'DevOps',
  },
  {
    id: '4',
    username: 'bob.wilson',
    email: 'bob.wilson@aurigraph.io',
    role: 'User',
    status: 'active',
    createdAt: '2025-10-10',
    lastLogin: '2025-10-14 16:45:00',
    department: 'Finance',
  },
  {
    id: '5',
    username: 'alice.johnson',
    email: 'alice.johnson@aurigraph.io',
    role: 'User',
    status: 'inactive',
    createdAt: '2025-10-03',
    lastLogin: '2025-10-10 11:20:00',
    department: 'Legal',
  },
];

export const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system administrator with all permissions',
    userCount: 1,
    createdAt: '2025-10-01',
    isSystemRole: true,
    permissions: [
      { module: 'Dashboard', actions: { view: true, edit: true, delete: true } },
      { module: 'Transactions', actions: { view: true, create: true, edit: true } },
      { module: 'Blocks', actions: { view: true, validate: true } },
      { module: 'Validators', actions: { view: true, manage: true } },
      { module: 'Smart Contracts', actions: { view: true, deploy: true, execute: true } },
      { module: 'Tokenization', actions: { view: true, create: true, manage: true } },
      { module: 'Bridge', actions: { view: true, initiate: true } },
      { module: 'Security', actions: { view: true, configure: true } },
      { module: 'Monitoring', actions: { view: true, configure: true } },
      { module: 'DevOps', actions: { view: true, deploy: true, configure: true, manage: true } },
    ],
  },
  {
    id: '2',
    name: 'User',
    description: 'Standard user with read access and limited transaction capabilities',
    userCount: 3,
    createdAt: '2025-10-01',
    isSystemRole: true,
    permissions: [
      { module: 'Dashboard', actions: { view: true, edit: false, delete: false } },
      { module: 'Transactions', actions: { view: true, create: true, edit: false } },
      { module: 'Blocks', actions: { view: true, validate: false } },
      { module: 'Validators', actions: { view: true, manage: false } },
      { module: 'Smart Contracts', actions: { view: true, deploy: false, execute: true } },
      { module: 'Tokenization', actions: { view: true, create: true, manage: false } },
      { module: 'Bridge', actions: { view: true, initiate: false } },
      { module: 'Security', actions: { view: true, configure: false } },
      { module: 'Monitoring', actions: { view: true, configure: false } },
      {
        module: 'DevOps',
        actions: { view: false, deploy: false, configure: false, manage: false },
      },
    ],
  },
  {
    id: '3',
    name: 'DevOps',
    description: 'DevOps engineer with deployment and infrastructure management permissions',
    userCount: 1,
    createdAt: '2025-10-01',
    isSystemRole: true,
    permissions: [
      { module: 'Dashboard', actions: { view: true, edit: true, delete: false } },
      { module: 'Transactions', actions: { view: true, create: false, edit: false } },
      { module: 'Blocks', actions: { view: true, validate: true } },
      { module: 'Validators', actions: { view: true, manage: true } },
      { module: 'Smart Contracts', actions: { view: true, deploy: true, execute: false } },
      { module: 'Tokenization', actions: { view: true, create: false, manage: false } },
      { module: 'Bridge', actions: { view: true, initiate: false } },
      { module: 'Security', actions: { view: true, configure: true } },
      { module: 'Monitoring', actions: { view: true, configure: true } },
      { module: 'DevOps', actions: { view: true, deploy: true, configure: true, manage: true } },
    ],
  },
];
