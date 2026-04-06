import { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  Filter,
  Grid,
  List,
  Lock,
  Eye,
} from 'lucide-react';
import { PermissionGate } from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  image: string;
}

const products: Product[] = [
  { id: 1, name: 'iPhone 15 Pro', category: 'Смартфоны', price: 149990, stock: 45, status: 'active', image: '📱' },
  { id: 2, name: 'MacBook Pro 14"', category: 'Ноутбуки', price: 299990, stock: 12, status: 'active', image: '💻' },
  { id: 3, name: 'AirPods Pro', category: 'Аудио', price: 24990, stock: 120, status: 'active', image: '🎧' },
  { id: 4, name: 'iPad Air', category: 'Планшеты', price: 79990, stock: 0, status: 'archived', image: '📟' },
  { id: 5, name: 'Apple Watch Ultra', category: 'Часы', price: 89990, stock: 35, status: 'active', image: '⌚' },
  { id: 6, name: 'Samsung S24 Ultra', category: 'Смартфоны', price: 129990, stock: 28, status: 'draft', image: '📱' },
  { id: 7, name: 'Sony WH-1000XM5', category: 'Аудио', price: 34990, stock: 55, status: 'active', image: '🎧' },
  { id: 8, name: 'Dell XPS 15', category: 'Ноутбуки', price: 189990, stock: 8, status: 'active', image: '💻' },
];

const categories = ['Все', 'Смартфоны', 'Ноутбуки', 'Планшеты', 'Аудио', 'Часы'];

const statusConfig = {
  active: { label: 'Активен', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  draft: { label: 'Черновик', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  archived: { label: 'Архив', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
};

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { can, isViewer } = usePermissions();

  const canEdit = can('edit_products');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Товары</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {filteredProducts.length} товаров в каталоге
          </p>
        </div>
        <PermissionGate 
          permission="edit_products"
          fallback={
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg">
              <Lock className="w-4 h-4" />
              <span>Только просмотр</span>
            </div>
          }
        >
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            Добавить товар
          </button>
        </PermissionGate>
      </div>

      {/* Viewer notice */}
      {isViewer && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-200">
              Режим просмотра — редактирование недоступно для вашей роли
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск товаров..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl">
                  {product.image}
                </div>
                {canEdit && (
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ₽ {product.price.toLocaleString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[product.status].color}`}>
                  {statusConfig[product.status].label}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className={`${product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет в наличии'}
                </span>
              </div>
              {canEdit && (
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                    <Edit2 className="w-4 h-4" />
                    Изменить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Товар
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Категория
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Цена
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Остаток
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Статус
                </th>
                {canEdit && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                        {product.image}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{product.category}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                    ₽ {product.price.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${
                    product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {product.stock}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[product.status].color}`}>
                      {statusConfig[product.status].label}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
