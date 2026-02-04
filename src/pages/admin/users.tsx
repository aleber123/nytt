/**
 * Admin Users Management Page
 * Manage admin users and their roles/permissions
 */

import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllAdminUsers,
  getAdminUserByEmail,
  createOrUpdateAdminUser,
  updateAdminUserRole,
  deactivateAdminUser,
  reactivateAdminUser,
  deleteAdminUser,
  AdminUser,
  UserRole,
  ROLE_PERMISSIONS
} from '@/firebase/userService';

function AdminUsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadUsers();
      checkCurrentUserRole();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllAdminUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Could not load users');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUserRole = async () => {
    if (!currentUser?.email) return;
    const user = await getAdminUserByEmail(currentUser.email);
    setCurrentUserRole(user?.role || null);
  };

  // Allow managing users if super_admin OR if no users exist yet (first setup)
  const canManageUsers = currentUserRole === 'super_admin' || users.length === 0;

  const handleAddUser = async (email: string, displayName: string, role: UserRole, notes: string) => {
    try {
      // Generate a temporary UID based on email (will be replaced when user logs in)
      const tempUid = `pending_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      await createOrUpdateAdminUser(tempUid, {
        email,
        displayName,
        role,
        notes,
        isActive: true
      }, currentUser?.email || 'admin');
      
      toast.success('User added successfully');
      setShowAddModal(false);
      loadUsers();
    } catch (error) {
      toast.error('Could not add user');
    }
  };

  const handleUpdateRole = async (user: AdminUser, newRole: UserRole) => {
    try {
      await updateAdminUserRole(user.id, newRole);
      toast.success('Role updated');
      loadUsers();
    } catch (error) {
      toast.error('Could not update role');
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      if (user.isActive) {
        await deactivateAdminUser(user.id);
        toast.success('User deactivated');
      } else {
        await reactivateAdminUser(user.id);
        toast.success('User reactivated');
      }
      loadUsers();
    } catch (error) {
      toast.error('Could not update user status');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to permanently delete ${user.email}?`)) return;
    
    try {
      await deleteAdminUser(user.id);
      toast.success('User deleted');
      loadUsers();
    } catch (error) {
      toast.error('Could not delete user');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>User Management | Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage admin users and their access levels
                </p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/admin"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to Dashboard
                </a>
                {canManageUsers && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Add User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Role Legend */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Role Permissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.entries(ROLE_PERMISSIONS) as [UserRole, typeof ROLE_PERMISSIONS['super_admin']][]).map(([role, perms]) => (
                <div key={role} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                      role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      role === 'editor' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {perms.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{perms.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 mb-4">No admin users configured yet.</p>
              {canManageUsers && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add First User
                </button>
              )}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left max-w-md mx-auto">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> The first user you add with email matching your current login ({currentUser?.email}) will automatically become a Super Admin.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    {canManageUsers && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className={!user.isActive ? 'bg-gray-50 opacity-60' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || user.email}
                          </div>
                          {user.displayName && (
                            <div className="text-sm text-gray-500">{user.email}</div>
                          )}
                          {user.notes && (
                            <div className="text-xs text-gray-400 mt-1">{user.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canManageUsers && user.email !== currentUser?.email ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user, e.target.value as UserRole)}
                            className={`text-xs rounded px-2 py-1 border ${
                              user.role === 'super_admin' ? 'bg-purple-50 border-purple-200' :
                              user.role === 'admin' ? 'bg-blue-50 border-blue-200' :
                              user.role === 'editor' ? 'bg-green-50 border-green-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {(Object.entries(ROLE_PERMISSIONS) as [UserRole, typeof ROLE_PERMISSIONS['super_admin']][]).map(([role, perms]) => (
                              <option key={role} value={role}>{perms.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'editor' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ROLE_PERMISSIONS[user.role]?.label || user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      {canManageUsers && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {user.email !== currentUser?.email && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleToggleActive(user)}
                                className={`px-2 py-1 text-xs rounded ${
                                  user.isActive 
                                    ? 'text-amber-700 hover:bg-amber-50' 
                                    : 'text-green-700 hover:bg-green-50'
                                }`}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Current User Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Your account:</strong> {currentUser?.email}
              {currentUserRole && (
                <span className="ml-2">
                  (Role: <strong>{ROLE_PERMISSIONS[currentUserRole]?.label || currentUserRole}</strong>)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onSave={handleAddUser}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </ProtectedRoute>
  );
}

// Add User Modal Component
function AddUserModal({
  onSave,
  onClose
}: {
  onSave: (email: string, displayName: string, role: UserRole, notes: string) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    onSave(email.trim(), displayName.trim(), role, notes.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Add Admin User</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              User must have a Firebase account with this email to log in
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {(Object.entries(ROLE_PERMISSIONS) as [UserRole, typeof ROLE_PERMISSIONS['super_admin']][]).map(([r, perms]) => (
                <option key={r} value={r}>{perms.label} - {perms.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this user..."
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default AdminUsersPage;
