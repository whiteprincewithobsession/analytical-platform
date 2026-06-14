import { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Save,
  AlertTriangle,
  Package,
  Download,
} from 'lucide-react';
import { PermissionGate } from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { useLocalization } from '../contexts/LocalizationContext';
import { exportToCSV, Column } from '../utils/export';

// ── Types ──────────────────────────────────────────────────────
interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  category_id: number;
  category_name: string;
  category_code: string;
  price: number;
  cost: number | null;
  sku: string;
  active: boolean;
  status: 'active' | 'archived';
  stock: number;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  code: string;
  name: string;
  description: string;
  parent_id: number | null;
  slug: string;
  active: boolean;
  sort_order: number;
  icon: string;
}

type ProductForm = {
  name: string;
  description: string;
  category_id: string;
  price: string;
  cost: string;
  sku: string;
  code: string;
  active: boolean;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  category_id: '',
  price: '',
  cost: '',
  sku: '',
  code: '',
  active: true,
};

const statusConfig = {
  active: { label: 'Активен', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  archived: { label: 'Архив', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
};

// ── API helpers ────────────────────────────────────────────────
async function fetchProducts(search = '', categoryId = '', status = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (categoryId) params.set('category_id', categoryId);
  if (status && status !== 'all') params.set('status', status);
  params.set('limit', '200');

  const res = await fetch(`/api/products/products?${params}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/products/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

async function createProduct(data: Partial<ProductForm>): Promise<Product> {
  const res = await fetch('/api/products/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Failed to create product');
  }
  return res.json();
}

async function updateProduct(id: number, data: Partial<ProductForm>): Promise<Product> {
  const res = await fetch(`/api/products/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Failed to update product');
  }
  return res.json();
}

async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`/api/products/products/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Failed to delete product');
  }
}

// ── ProductFormModal ───────────────────────────────────────────
interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<ProductForm>) => Promise<void>;
  categories: Category[];
  initial?: Product | null;
}

function ProductFormModal({ open, onClose, onSave, categories, initial }: ProductFormModalProps) {
  const { t, language } = useLocalization();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        description: initial.description || '',
        category_id: String(initial.category_id),
        price: String(initial.price),
        cost: initial.cost ? String(initial.cost) : '',
        sku: initial.sku,
        code: initial.code,
        active: initial.active,
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [initial, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category_id || !form.price) {
      setError(language === 'ru' ? 'Заполните обязательные поля' : 'Fill required fields');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Partial<ProductForm> = {
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        price: parseFloat(form.price),
        active: form.active,
      };
      if (form.cost.trim()) payload.cost = parseFloat(form.cost);
      if (form.sku.trim()) payload.sku = form.sku.trim();
      if (form.code.trim()) payload.code = form.code.trim();
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit
              ? (language === 'ru' ? 'Редактировать товар' : 'Edit Product')
              : (language === 'ru' ? 'Добавить товар' : 'Add Product')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {language === 'ru' ? 'Название' : 'Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {language === 'ru' ? 'Описание' : 'Description'}
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'ru' ? 'Категория' : 'Category'} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">{language === 'ru' ? 'Выберите...' : 'Select...'}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'ru' ? 'Цена (₽)' : 'Price (₽)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'ru' ? 'Себестоимость' : 'Cost'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={e => setForm({ ...form, cost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'ru' ? 'Артикул (SKU)' : 'SKU'}
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={isEdit ? undefined : (language === 'ru' ? 'Авто-генерация' : 'Auto-generated')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {language === 'ru' ? 'Код товара' : 'Product Code'}
            </label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={isEdit ? undefined : (language === 'ru' ? 'Авто-генерация' : 'Auto-generated')}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {form.active
                ? (language === 'ru' ? 'Активен' : 'Active')
                : (language === 'ru' ? 'Архив' : 'Archived')}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving
                ? (language === 'ru' ? 'Сохранение...' : 'Saving...')
                : (language === 'ru' ? 'Сохранить' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ContextMenu ────────────────────────────────────────────────
interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  productActive: boolean;
}

function ContextMenu({ open, onClose, onEdit, onDelete, onToggleStatus, productActive }: ContextMenuProps) {
  const { language } = useLocalization();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute right-0 top-8 z-40 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1" ref={ref}>
      <button
        onClick={() => { onEdit(); onClose(); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Edit2 className="w-4 h-4" />
        {language === 'ru' ? 'Редактировать' : 'Edit'}
      </button>
      <button
        onClick={() => { onToggleStatus(); onClose(); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Package className="w-4 h-4" />
        {productActive
          ? (language === 'ru' ? 'В архив' : 'Archive')
          : (language === 'ru' ? 'Активировать' : 'Activate')}
      </button>
      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="w-4 h-4" />
        {language === 'ru' ? 'Удалить' : 'Delete'}
      </button>
    </div>
  );
}

// ── DeleteConfirmModal ─────────────────────────────────────────
function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  productName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  productName: string;
}) {
  const { language } = useLocalization();
  const [deleting, setDeleting] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {language === 'ru' ? 'Удалить товар?' : 'Delete product?'}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {language === 'ru'
            ? `Вы уверены, что хотите удалить «${productName}»? Это действие нельзя отменить.`
            : `Are you sure you want to delete "${productName}"? This action cannot be undone.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={async () => { setDeleting(true); await onConfirm(); setDeleting(false); }}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting
              ? (language === 'ru' ? 'Удаление...' : 'Deleting...')
              : (language === 'ru' ? 'Удалить' : 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProductsPage ───────────────────────────────────────────────
export function ProductsPage() {
  const { t, language } = useLocalization();
  const { can, isViewer } = usePermissions();
  const canEdit = can('edit_products');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Context menu
  const [contextMenuId, setContextMenuId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prodData, cats] = await Promise.all([
        fetchProducts(searchQuery, selectedCategoryId, statusFilter),
        fetchCategories(),
      ]);
      setProducts(prodData.products || []);
      setCategories(cats);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategoryId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: Partial<ProductForm>) => {
    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, data);
      setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    } else {
      const created = await createProduct(data);
      setProducts(prev => [created, ...prev]);
    }
    setEditingProduct(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
    } catch (err: any) {
      alert(err.message);
    }
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const updated = await updateProduct(product.id, { active: !product.active });
      setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated, status: updated.active ? 'active' : 'archived' } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportProducts = () => {
    const columns: Column<Product>[] = [
      { header: language === 'ru' ? 'Код' : 'Code', accessor: p => p.code },
      { header: language === 'ru' ? 'Название' : 'Name', accessor: p => p.name },
      { header: language === 'ru' ? 'Категория' : 'Category', accessor: p => p.category_name },
      { header: language === 'ru' ? 'Цена (₽)' : 'Price (₽)', accessor: p => p.price },
      { header: language === 'ru' ? 'Себестоимость (₽)' : 'Cost (₽)', accessor: p => p.cost ?? null },
      { header: language === 'ru' ? 'Артикул' : 'SKU', accessor: p => p.sku },
      { header: language === 'ru' ? 'Остаток' : 'Stock', accessor: p => p.stock },
      { header: language === 'ru' ? 'Статус' : 'Status', accessor: p => p.status === 'active' ? (language === 'ru' ? 'Активен' : 'Active') : (language === 'ru' ? 'Архив' : 'Archived') },
      { header: language === 'ru' ? 'Описание' : 'Description', accessor: p => p.description || '—' },
    ];

    const date = new Date().toISOString().slice(0, 10);
    exportToCSV(products, columns, `products-${date}`);
  };

  // Build flat list with indentation for hierarchy
  const buildCategoryTree = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const addWithChildren = (parentId: number | null, depth: number) => {
      const children = cats.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
      for (const child of children) {
        result.push({ ...child, _depth: depth } as any);
        addWithChildren(child.id, depth + 1);
      }
    };
    addWithChildren(null, 0);
    return result;
  };
  const orderedCategories = buildCategoryTree(categories);
  const selectedCategoryObj = categories.find(c => c.id === Number(selectedCategoryId));
  const selectedCategoryName = selectedCategoryObj?.name || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ru' ? 'Товары' : 'Products'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {products.length} {language === 'ru' ? 'товаров в каталоге' : 'products in catalog'}
            {selectedCategoryName && ` → ${selectedCategoryName}`}
          </p>
        </div>
        <PermissionGate
          permission="edit_products"
          fallback={
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg">
              <Lock className="w-4 h-4" />
              <span>{language === 'ru' ? 'Только просмотр' : 'View only'}</span>
            </div>
          }
        >
          <button
            onClick={() => { setEditingProduct(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {language === 'ru' ? 'Добавить товар' : 'Add Product'}
          </button>
        </PermissionGate>
      </div>

      {isViewer && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-200">
              {language === 'ru'
                ? 'Режим просмотра — редактирование недоступно для вашей роли'
                : 'View mode — editing is not available for your role'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={loadData} className="ml-auto underline hover:no-underline">
            {language === 'ru' ? 'Повторить' : 'Retry'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск товаров...' : 'Search products...'}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{language === 'ru' ? 'Все категории' : 'All categories'}</option>
              {orderedCategories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {'\u00A0'.repeat((cat._depth || 0) * 4)}{cat._depth > 0 ? '└ ' : ''}{cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">{language === 'ru' ? 'Все статусы' : 'All statuses'}</option>
            <option value="active">{language === 'ru' ? 'Активные' : 'Active'}</option>
            <option value="inactive">{language === 'ru' ? 'Архив' : 'Archived'}</option>
          </select>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <PermissionGate permission="export_data">
            <button
              onClick={handleExportProducts}
              disabled={!products.length}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {language === 'ru' ? 'Экспорт' : 'Export'}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div
              key={product.id}
              className="relative bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl">
                  {product.icon}
                </div>
                {canEdit && (
                  <div className="relative">
                    <button
                      onClick={() => setContextMenuId(contextMenuId === product.id ? null : product.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <ContextMenu
                      open={contextMenuId === product.id}
                      onClose={() => setContextMenuId(null)}
                      onEdit={() => { setEditingProduct(product); setFormOpen(true); }}
                      onDelete={() => setDeleteTarget(product)}
                      onToggleStatus={() => handleToggleStatus(product)}
                      productActive={product.active}
                    />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.category_name}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ₽ {product.price.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[product.status].color}`}>
                  {product.status === 'active'
                    ? (language === 'ru' ? 'Активен' : 'Active')
                    : (language === 'ru' ? 'Архив' : 'Archived')}
                </span>
              </div>
              <div className="mt-3 text-sm">
                <span className={product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {product.stock > 0
                    ? (language === 'ru' ? `В наличии: ${product.stock}` : `In stock: ${product.stock}`)
                    : (language === 'ru' ? 'Нет в наличии' : 'Out of stock')}
                </span>
              </div>
              {canEdit && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { setEditingProduct(product); setFormOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    {language === 'ru' ? 'Изменить' : 'Edit'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'ru' ? 'Товар' : 'Product'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'ru' ? 'Категория' : 'Category'}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'ru' ? 'Цена' : 'Price'}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'ru' ? 'Остаток' : 'Stock'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'ru' ? 'Статус' : 'Status'}
                </th>
                {canEdit && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {language === 'ru' ? 'Действия' : 'Actions'}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                        {product.icon}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                        <div className="text-xs text-gray-400">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{product.category_name}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                    ₽ {product.price.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {product.stock}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[product.status].color}`}>
                      {product.status === 'active'
                        ? (language === 'ru' ? 'Активен' : 'Active')
                        : (language === 'ru' ? 'Архив' : 'Archived')}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingProduct(product); setFormOpen(true); }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          title={language === 'ru' ? 'Редактировать' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          title={product.active ? (language === 'ru' ? 'В архив' : 'Archive') : (language === 'ru' ? 'Активировать' : 'Activate')}
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                          title={language === 'ru' ? 'Удалить' : 'Delete'}
                        >
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

      {!loading && !loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">
            {language === 'ru' ? 'Товары не найдены' : 'No products found'}
          </p>
          <p className="text-sm mt-1">
            {language === 'ru' ? 'Попробуйте изменить фильтры' : 'Try changing filters'}
          </p>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingProduct(null); }}
        onSave={handleSave}
        categories={categories}
        initial={editingProduct}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        productName={deleteTarget?.name || ''}
      />
    </div>
  );
}
