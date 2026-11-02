'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  RotateCcw,
  Package,
  ChevronRight,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { ProductService, ProductFilters } from '@/features/products/product.service';
import { Product, ProductCategory } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/features/cart/cart.context';
import { useToast } from '@/components/ui/Toast';

function ProductCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: ProductCategory | 'ALL'; label: string; count: number }[]>([]);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>(
    (searchParams.get('category') as ProductCategory) || 'ALL'
  );
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [requiresRxOnly, setRequiresRxOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<ProductFilters['sortBy']>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setCategories(ProductService.getCategories());
  }, []);

  useEffect(() => {
    const list = ProductService.filterProducts({
      search,
      category: selectedCategory,
      maxPrice,
      inStockOnly,
      requiresPrescription: requiresRxOnly ? true : undefined,
      sortBy,
    });
    setProducts(list);
  }, [search, selectedCategory, maxPrice, inStockOnly, requiresRxOnly, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setMaxPrice(2000);
    setInStockOnly(false);
    setRequiresRxOnly(false);
    setSortBy('featured');
    router.push('/products');
  };

  const handleAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault();
    const res = addToCart(prod.id, 1);
    if (res.success) {
      success(`Added ${prod.name} to cart.`);
    } else {
      error(res.error || 'Failed to add item to cart.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Healthcare Store</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Healthcare Essentials & Pharmacy Store
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore clinically verified health monitoring equipment, first aid supplies, daily wellness vitamins, and demo prescription items.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter toggle */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters {selectedCategory !== 'ALL' || requiresRxOnly ? '(Active)' : ''}
          </Button>
          <span className="text-xs text-slate-500">{products.length} products found</span>
        </div>

        {/* Filters Sidebar */}
        <aside
          className={`lg:block ${
            showMobileFilters ? 'block' : 'hidden'
          } space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Filter className="w-4 h-4 text-brand-600" />
              <span>Catalog Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Search Store</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Product name, SKU, tag..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categories</label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                    selectedCategory === cat.id
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Max Price</span>
              <span className="font-bold text-slate-900">{formatCurrency(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹100</span>
              <span>₹2,000</span>
            </div>
          </div>

          {/* Checkbox Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 accent-brand-600 cursor-pointer"
              />
              In Stock Items Only
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
              <input
                type="checkbox"
                checked={requiresRxOnly}
                onChange={(e) => setRequiresRxOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 accent-brand-600 cursor-pointer"
              />
              Prescription Required Only
            </label>
          </div>
        </aside>

        {/* Product Cards Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-medium text-slate-600">
              Showing <strong className="text-slate-900">{products.length}</strong> healthcare products
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-products" className="text-xs text-slate-500 whitespace-nowrap">Sort by:</label>
              <select
                id="sort-products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ProductFilters['sortBy'])}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description="No products matched your active search or filters. Try widening your price range or clearing category filters."
              actionText="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {prod.requiresPrescription ? (
                      <div className="absolute top-2.5 left-2.5">
                        <Badge variant="warning" size="sm">
                          Rx Required
                        </Badge>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 left-2.5">
                        <Badge variant="default" size="sm">
                          OTC
                        </Badge>
                      </div>
                    )}

                    <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{prod.rating}</span>
                      <span className="text-slate-400 text-[10px]">({prod.reviewCount})</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                      <span>{prod.category}</span>
                      <span className="text-slate-400 font-mono">{prod.sku}</span>
                    </div>

                    <Link href={`/products/${prod.id}`}>
                      <h3 className="font-bold text-slate-900 text-sm hover:text-brand-600 transition line-clamp-1 mb-1">
                        {prod.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{prod.description}</p>

                    <div className="mt-auto space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-extrabold text-slate-900">
                            {formatCurrency(prod.price)}
                          </span>
                          <span className="text-[11px] text-slate-400 block">{prod.packSize}</span>
                        </div>
                        <div className="text-right">
                          {prod.stock > 0 ? (
                            <span className="text-[11px] font-medium text-emerald-600">
                              {prod.stock < 15 ? `Only ${prod.stock} left` : 'In Stock'}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-600">Out of Stock</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/products/${prod.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Details
                          </Button>
                        </Link>
                        <Button
                          variant="teal"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => handleAddToCart(e, prod)}
                          disabled={prod.stock === 0}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductCatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><div className="h-64 bg-slate-100 animate-pulse rounded-2xl" /></div>}>
      <ProductCatalogContent />
    </Suspense>
  );
}
