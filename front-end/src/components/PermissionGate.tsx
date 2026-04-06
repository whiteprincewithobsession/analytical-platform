import { ReactNode } from 'react';
import { Lock, ShieldX } from 'lucide-react';
import { Permission } from '../config/permissions';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  showLock?: boolean;
}

export function PermissionGate({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback,
  showLock = false,
}: PermissionGateProps) {
  const { canAll, canAny } = usePermissions();

  const allPerms = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? canAll(allPerms) 
    : allPerms.length > 0 
      ? canAny(allPerms)
      : true;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLock) {
    return (
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
        <Lock className="w-4 h-4" />
        <span className="text-sm">Нет доступа</span>
      </div>
    );
  }

  return null;
}

// Компонент для страниц без доступа
export function AccessDeniedPage() {
  const { role } = usePermissions();

  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-red-500 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Доступ запрещён
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        У вашей роли <span className="font-medium text-gray-700 dark:text-gray-300">"{role}"</span> нет
        доступа к этой странице. Обратитесь к администратору для получения необходимых прав.
      </p>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-md">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          💡 Если вам нужен доступ к этой функции, свяжитесь с администратором системы
          или отправьте запрос через раздел "Справка и поддержка".
        </p>
      </div>
    </div>
  );
}

// HOC для защиты страниц
interface ProtectedPageProps {
  permission: Permission;
  children: ReactNode;
}

export function ProtectedPage({ permission, children }: ProtectedPageProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
