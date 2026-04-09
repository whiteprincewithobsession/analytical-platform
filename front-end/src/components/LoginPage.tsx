import { useState } from 'react';
import { User, Shield, Eye, LogIn, Check, X, Info } from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { roleDescriptions } from '../config/permissions';

interface RoleConfig {
  value: UserRole;
  labelKey: string;
  icon: typeof User;
  descriptionKey: string;
  color: string;
}

const roles: RoleConfig[] = [
  { value: 'admin', labelKey: 'auth.admin', icon: Shield, descriptionKey: 'auth.adminDesc', color: 'from-purple-500 to-indigo-600' },
  { value: 'analyst', labelKey: 'auth.analyst', icon: User, descriptionKey: 'auth.analystDesc', color: 'from-blue-500 to-cyan-600' },
  { value: 'manager', labelKey: 'auth.manager', icon: User, descriptionKey: 'auth.managerDesc', color: 'from-emerald-500 to-teal-600' },
  { value: 'viewer', labelKey: 'auth.viewer', icon: Eye, descriptionKey: 'auth.viewerDesc', color: 'from-amber-500 to-orange-600' },
];

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLocalization();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [showDetails, setShowDetails] = useState(false);

  const selectedRoleInfo = roleDescriptions[selectedRole];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Marketplace Admin</h1>
          <p className="text-indigo-200 mt-2">{t('common.selectRoleToLogin')}</p>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;

            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`relative p-4 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-white/10 ring-2 ring-white/30 scale-105'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`p-3 rounded-xl bg-gradient-to-br ${role.color} w-fit mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-white">{t(role.labelKey)}</div>
                <div className="text-sm text-indigo-200 mt-1">{t(role.descriptionKey)}</div>
              </button>
            );
          })}
        </div>

        {}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-2 py-3 text-indigo-300 hover:text-white transition-colors mb-4"
        >
          <Info className="w-4 h-4" />
          <span>{showDetails ? t('common.hideRoleDetails') : t('common.showRoleDetails')}</span>
        </button>

        {}
        {showDetails && (
          <div className="bg-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedRoleInfo.title}: {t('auth.accessRights')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {}
              <div>
                <h4 className="text-sm font-medium text-emerald-400 uppercase tracking-wide mb-3">
                  ✓ {t('common.available')}
                </h4>
                <ul className="space-y-2">
                  {selectedRoleInfo.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-center gap-2 text-indigo-100">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {}
              <div>
                <h4 className="text-sm font-medium text-red-400 uppercase tracking-wide mb-3">
                  ✗ {t('common.restricted')}
                </h4>
                {selectedRoleInfo.restrictions.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedRoleInfo.restrictions.map((res, i) => (
                      <li key={i} className="flex items-center gap-2 text-indigo-200">
                        <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span>{res}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-indigo-200 italic">{t('common.noRestrictions')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {}
        <div className="bg-white/10 rounded-xl overflow-hidden mb-6 backdrop-blur-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-200">{t('common.feature')}</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-purple-300">{t('roles.admin')}</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-blue-300">{t('roles.analyst')}</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-emerald-300">{t('roles.manager')}</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-amber-300">{t('roles.viewer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { feature: 'nav.overview', admin: true, analyst: true, manager: true, viewer: true },
                { feature: 'nav.sales', admin: true, analyst: true, manager: true, viewer: true },
                { feature: 'nav.analytics', admin: true, analyst: true, manager: false, viewer: false },
                { feature: 'nav.reports', admin: true, analyst: true, manager: false, viewer: false },
                { feature: 'common.export', admin: true, analyst: true, manager: false, viewer: false },
                { feature: 'permissions.edit_products', admin: true, analyst: false, manager: true, viewer: false },
                { feature: 'permissions.edit_orders', admin: true, analyst: false, manager: true, viewer: false },
                { feature: 'permissions.edit_users', admin: true, analyst: false, manager: false, viewer: false },
                { feature: 'nav.settings', admin: true, analyst: false, manager: false, viewer: false },
                { feature: 'permissions.view_financials', admin: true, analyst: true, manager: false, viewer: false },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="px-4 py-2.5 text-sm text-indigo-100">{t(row.feature)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.admin ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-red-400/50 mx-auto" />}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.analyst ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-red-400/50 mx-auto" />}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.manager ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-red-400/50 mx-auto" />}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.viewer ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-red-400/50 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <button
          onClick={() => login(selectedRole)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
        >
          <LogIn className="w-5 h-5" />
          {t('common.loginAs')} {t(roles.find(r => r.value === selectedRole)?.labelKey || '')}
        </button>

        <p className="text-center text-indigo-300/60 text-sm mt-4">
          {t('common.demoMode')}
        </p>
      </div>
    </div>
  );
}
