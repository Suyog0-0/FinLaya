'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Eye, Mail, Calendar } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in: string;
  status: 'active' | 'inactive';
}

const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    created_at: '2024-01-15T10:30:00Z',
    last_sign_in: '2024-02-03T08:45:00Z',
    status: 'active',
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    created_at: '2024-01-20T14:20:00Z',
    last_sign_in: '2024-02-02T16:30:00Z',
    status: 'active',
  },
  {
    id: '3',
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    created_at: '2024-01-10T09:15:00Z',
    last_sign_in: '2024-01-25T12:00:00Z',
    status: 'inactive',
  },
  {
    id: '4',
    email: 'alice.brown@example.com',
    name: 'Alice Brown',
    created_at: '2024-02-01T11:45:00Z',
    last_sign_in: '2024-02-03T09:20:00Z',
    status: 'active',
  },
];

export default function UserManagementMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(userId);
    
    // Simulate API call
    setTimeout(() => {
      setUsers(users.filter(u => u.id !== userId));
      setIsDeleting(null);
    }, 1000);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">View and manage all registered users</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Inactive Users</p>
            <p className="text-2xl font-bold text-orange-600">
              {users.filter(u => u.status === 'inactive').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                          {userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail size={12} />
                            {userData.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        userData.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {userData.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(userData.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(userData.last_sign_in)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(userData.id)}
                          disabled={isDeleting === userData.id}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete User"
                        >
                          {isDeleting === userData.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}