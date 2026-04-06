import { useState, useMemo } from 'react';
import type { Product } from '../types';

interface UseProductsOptions {
  products: Product[];
  categories?: string[];
}

export function useProducts({ products, categories = [] }: UseProductsOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Все' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      draft: products.filter(p => p.status === 'draft').length,
      archived: products.filter(p => p.status === 'archived').length,
      outOfStock: products.filter(p => p.stock === 0).length,
    };
  }, [products]);

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const setCategory = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const setView = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  return {
    filteredProducts,
    searchQuery,
    selectedCategory,
    viewMode,
    stats,
    categories,
    setSearch,
    setCategory,
    setView,
  };
}
