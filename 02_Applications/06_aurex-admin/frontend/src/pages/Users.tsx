import React, { useState } from 'react'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import clsx from 'clsx'

interface User {
  id: string
  name: string
  email: string
  role: string
  organization: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  createdAt: string
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Admin',
    organization: 'Acme Corp',
    status: 'active',
    lastLogin: '2 hours ago',
    createdAt: '2023-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@greentech.io',
    role: 'Manager',
    organization: 'GreenTech Solutions',
    status: 'active',
    lastLogin: '1 day ago',
    createdAt: '2023-02-20',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.j@sustainableco.com',
    role: 'User',
    organization: 'Sustainable Co',
    status: 'inactive',
    lastLogin: '1 week ago',
    createdAt: '2023-03-10',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.w@ecofirm.org',
    role: 'User',
    organization: 'EcoFirm',
    status: 'pending',
    lastLogin: 'Never',
    createdAt: '2023-04-05',
  },
]

const Users: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'badge-success'
      case 'inactive':
        return 'badge-danger'
      case 'pending':
        return 'badge-warning'
      default:
        return 'badge-info'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-admin-900">Users</h1>
          <p className="mt-1 text-sm text-admin-600">
            Manage user accounts and permissions across all applications
          </p>
        </div>
        <button className="btn-primary">
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-admin-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="form-input pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                className="form-input"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="form-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">User</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Organization</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Last Login</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-admin-50">
                    <td className="table-body-cell">
                      <div className="flex items-center">
                        <UserCircleIcon className="h-8 w-8 text-admin-400 mr-3" />
                        <div>
                          <div className="font-medium text-admin-900">{user.name}</div>
                          <div className="text-sm text-admin-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-body-cell">
                      <span className="badge badge-info">{user.role}</span>
                    </td>
                    <td className="table-body-cell text-admin-500">
                      {user.organization}
                    </td>
                    <td className="table-body-cell">
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="table-body-cell text-admin-500">
                      {user.lastLogin}
                    </td>
                    <td className="table-body-cell text-admin-500">
                      {user.createdAt}
                    </td>
                    <td className="table-body-cell">
                      <Menu as="div" className="relative inline-block text-left">
                        <div>
                          <Menu.Button className="p-1 rounded-lg hover:bg-admin-100 transition-colors">
                            <EllipsisVerticalIcon className="h-5 w-5 text-admin-400" />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={clsx(
                                    active ? 'bg-admin-100' : '',
                                    'group flex items-center px-4 py-2 text-sm text-admin-700 w-full text-left'
                                  )}
                                >
                                  <PencilIcon className="mr-3 h-4 w-4" />
                                  Edit User
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={clsx(
                                    active ? 'bg-admin-100' : '',
                                    'group flex items-center px-4 py-2 text-sm text-red-700 w-full text-left'
                                  )}
                                >
                                  <TrashIcon className="mr-3 h-4 w-4" />
                                  Delete User
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserCircleIcon className="mx-auto h-12 w-12 text-admin-400" />
              <h3 className="mt-2 text-sm font-medium text-admin-900">No users found</h3>
              <p className="mt-1 text-sm text-admin-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination would go here in a real implementation */}
    </div>
  )
}

export default Users