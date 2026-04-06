import { useAuth } from '../contexts/AuthContext';
import { Permission, hasPermission, hasAllPermissions, hasAnyPermission } from '../config/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    role,
    isAdmin: role === 'admin',
    isAnalyst: role === 'analyst',
    isManager: role === 'manager',
    isViewer: role === 'viewer',
  };
}
