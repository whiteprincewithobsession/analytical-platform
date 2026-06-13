import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  TrendingUp,
  ShoppingCart,
  Banknote,
  BarChart3,
  X,
} from 'lucide-react';
import { PermissionGate } from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { useLocalization } from '../contexts/LocalizationContext';
import { SupersetDashboard } from '../components/SupersetDashboard';

// ── Types ──────────────────────────────────────────────────────
interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
}

interface Order {
  id: number;
  user_id: number;
  user_name: string;
  order_date: string;
  status: string;
  status_label: string;
  total_amount: number;
  payment_method_code: string;
  payment_label: string;
  delivery_type_code: string;
  delivery_label: string;
  promo_code: string | null;
  discount_amount: number;
  source_channel: string;
  comments: string | null;
  tracking_number: string | null;
  address_id: number | null;
  address: {
    full: string;
    postal: string;
    region: string;
    comment: string | null;
  } | null;
  items: OrderItem[];
  status_history: { from: string | null; to: string; source: string; time: string }[];
  created_at: string;
  updated_at: string;
}

interface SalesStats {
  total_orders: number;
  total_revenue: number;
  avg_order: number;
  by_status: Record<string, number>;
  by_payment: Record<string, number>;
  payments: string[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
};

// ── API ────────────────────────────────────────────────────────
async function fetchSales(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/sales/sales?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

// ── OrderDetailModal ───────────────────────────────────────────
function OrderDetailModal({
  open,
  onClose,
  order,
}: {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}) {
  const { language } = useLocalization();
  if (!open || !order) return null;

  const t = (ru: string, en: string) => language === 'ru' ? ru : en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('Заказ', 'Order')} #{order.id}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {order.order_date} · {order.source_channel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {order.status_label}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Delivery address block */}
          {order.address && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                {t('📍 Адрес доставки', '📍 Delivery Address')}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{order.address.full}</p>
              {order.address.region && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{order.address.region}, {order.address.postal}</p>
              )}
              {order.address.comment && (
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 italic">💬 {order.address.comment}</p>
              )}
            </div>
          )}
          {!order.address && order.delivery_type_code === 'pickup_point' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                {t('📦 Пункт выдачи', '📦 Pickup Point')}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-200">
                {t('Заказ будет доставлен в пункт выдачи. Ожидается уведомление о готовности.',
                   'Order will be delivered to pickup point. A readiness notification is expected.')}
              </p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('Клиент', 'Customer')}</span>
              <p className="font-medium text-gray-900 dark:text-white">{order.user_name}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('Оплата', 'Payment')}</span>
              <p className="font-medium text-gray-900 dark:text-white">{order.payment_label}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('Доставка', 'Delivery')}</span>
              <p className="font-medium text-gray-900 dark:text-white">{order.delivery_label}</p>
            </div>
            {order.tracking_number && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('Трек-номер', 'Tracking')}</span>
                <p className="font-mono text-gray-900 dark:text-white">{order.tracking_number}</p>
              </div>
            )}
            {order.promo_code && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('Промокод', 'Promo')}</span>
                <p className="font-medium text-emerald-600">{order.promo_code} (-{order.discount_amount.toLocaleString()} ₽)</p>
              </div>
            )}
            {order.comments && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">{t('Комментарий', 'Comment')}</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">{order.comments}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t('Товары', 'Items')} ({order.items.length})
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{t('Товар', 'Product')}</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">{t('Кол-во', 'Qty')}</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">{t('Цена', 'Price')}</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">{t('Сумма', 'Total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{item.product_name}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{item.price.toLocaleString()} ₽</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                        {(item.price * item.quantity).toLocaleString()} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                    <td colSpan={3} className="px-4 py-2 text-right text-gray-900 dark:text-white">{t('Итого', 'Total')}</td>
                    <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{order.total_amount.toLocaleString()} ₽</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status history */}
          {order.status_history && order.status_history.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {t('📋 История статуса', '📋 Status History')}
              </h3>
              <div className="space-y-2">
                {order.status_history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      h.to === 'delivered' ? 'bg-emerald-500' :
                      h.to === 'cancelled' ? 'bg-red-500' :
                      h.to === 'shipped' ? 'bg-purple-500' :
                      h.to === 'processing' ? 'bg-indigo-500' :
                      h.to === 'confirmed' ? 'bg-blue-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {h.to === 'delivered' ? t('Доставлен', 'Delivered') :
                         h.to === 'cancelled' ? t('Отменён', 'Cancelled') :
                         h.to === 'shipped' ? t('Отправлен', 'Shipped') :
                         h.to === 'processing' ? t('В обработке', 'Processing') :
                         h.to === 'confirmed' ? t('Подтверждён', 'Confirmed') :
                         h.to === 'pending' ? t('Ожидает', 'Pending') : h.to}
                      </span>
                      {h.from && (
                        <span className="text-gray-400 ml-1">
                          ← {h.from}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{h.source}</span>
                    <span className="text-xs text-gray-400">{new Date(h.time).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SalesPage ──────────────────────────────────────────────────
export function SalesPage() {
  const { t, language } = useLocalization();
  const { can } = usePermissions();

  // Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders'>('orders');

  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // UI
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: '200' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.payment = paymentFilter;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;

      const data = await fetchSales(params);
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter, minPrice, maxPrice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val: number) =>
    val.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

  const tabs = [
    { id: 'orders' as const, label: language === 'ru' ? 'Все продажи' : 'All Sales', icon: ShoppingCart },
    { id: 'dashboard' as const, label: language === 'ru' ? 'Дашборд' : 'Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ru' ? 'Продажи' : 'Sales'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ru' ? 'Аналитика и детализация продаж' : 'Sales analytics and details'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats cards (only on orders tab) */}
      {activeTab === 'orders' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ru' ? 'Всего заказов' : 'Total Orders'}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ru' ? 'Выручка' : 'Revenue'}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total_revenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ru' ? 'Средний чек' : 'Avg Order'}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.avg_order)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard tab */}
      {activeTab === 'dashboard' && (
        <div className="h-[70vh]">
          <SupersetDashboard dashboardId="2" height="100%" />
        </div>
      )}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Search + controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={language === 'ru' ? 'Поиск по треку, промокоду, комментарию...' : 'Search by tracking, promo, comment...'}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                {language === 'ru' ? 'Фильтры' : 'Filters'}
              </button>

              <button
                onClick={loadData}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                title={t('common.refresh')}
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <PermissionGate permission="export_data">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Download className="w-4 h-4" />
                  {t('common.export')}
                </button>
              </PermissionGate>
            </div>

            {/* Extended filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {language === 'ru' ? 'Статус' : 'Status'}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">{language === 'ru' ? 'Все' : 'All'}</option>
                    <option value="pending">{language === 'ru' ? 'Ожидает' : 'Pending'}</option>
                    <option value="confirmed">{language === 'ru' ? 'Подтверждён' : 'Confirmed'}</option>
                    <option value="processing">{language === 'ru' ? 'В обработке' : 'Processing'}</option>
                    <option value="shipped">{language === 'ru' ? 'Отправлен' : 'Shipped'}</option>
                    <option value="delivered">{language === 'ru' ? 'Доставлен' : 'Delivered'}</option>
                    <option value="cancelled">{language === 'ru' ? 'Отменён' : 'Cancelled'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {language === 'ru' ? 'Оплата' : 'Payment'}
                  </label>
                  <select
                    value={paymentFilter}
                    onChange={e => setPaymentFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">{language === 'ru' ? 'Все' : 'All'}</option>
                    {stats?.payments.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {language === 'ru' ? 'Мин. сумма' : 'Min amount'}
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {language === 'ru' ? 'Макс. сумма' : 'Max amount'}
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    placeholder="∞"
                  />
                </div>
                {(statusFilter || paymentFilter || minPrice || maxPrice) && (
                  <div className="col-span-2 sm:col-span-4">
                    <button
                      onClick={() => { setStatusFilter(''); setPaymentFilter(''); setMinPrice(''); setMaxPrice(''); }}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {language === 'ru' ? 'Сбросить фильтры' : 'Reset filters'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
              <button onClick={loadData} className="ml-2 underline">{language === 'ru' ? 'Повторить' : 'Retry'}</button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Orders table */}
          {!loading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {language === 'ru' ? 'Заказ' : 'Order'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {language === 'ru' ? 'Клиент' : 'Customer'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {language === 'ru' ? 'Дата' : 'Date'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {language === 'ru' ? 'Статус' : 'Status'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">
                      {language === 'ru' ? 'Оплата' : 'Payment'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {language === 'ru' ? 'Сумма' : 'Amount'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {orders.map(order => (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium text-gray-900 dark:text-white">#{order.id}</span>
                          {order.tracking_number && (
                            <div className="text-xs text-gray-400 font-mono">{order.tracking_number}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-white">{order.user_name}</div>
                          <div className="text-xs text-gray-400 capitalize">{order.source_channel}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{order.order_date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                            {order.status_label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                          {order.payment_label}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={e => { e.stopPropagation(); setDetailOrder(order); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title={language === 'ru' ? 'Подробнее' : 'Details'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {/* Expanded items row */}
                      {expandedOrderId === order.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {order.items.map((item, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-sm border border-gray-200 dark:border-gray-600"
                                >
                                  <span className="text-gray-900 dark:text-white">{item.product_name}</span>
                                  <span className="text-gray-400">× {item.quantity}</span>
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                                    {(item.price * item.quantity).toLocaleString()} ₽
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {!loading && orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">
                    {language === 'ru' ? 'Заказы не найдены' : 'No orders found'}
                  </p>
                  <p className="text-sm mt-1">
                    {language === 'ru' ? 'Попробуйте изменить фильтры' : 'Try changing filters'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      <OrderDetailModal
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        order={detailOrder}
      />
    </div>
  );
}
