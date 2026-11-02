import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { Product, ProductCategory } from '@/types';
import { generateId } from '@/lib/utils';
import { addActivityLog } from '@/features/admin/admin.service';

export interface ProductFilters {
  search?: string;
  category?: ProductCategory | 'ALL';
  minPrice?: number;
  maxPrice?: number;
  requiresPrescription?: boolean;
  inStockOnly?: boolean;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name';
}

export class ProductService {
  static getProducts(): Product[] {
    return localStorageAdapter.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  static getActiveProducts(): Product[] {
    return this.getProducts().filter((p) => p.isActive);
  }

  static getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  static getCategories(): { id: ProductCategory | 'ALL'; label: string; count: number }[] {
    const products = this.getActiveProducts();
    const categories: (ProductCategory | 'ALL')[] = [
      'ALL',
      'wellness',
      'first-aid',
      'monitoring',
      'hygiene',
      'prescription',
    ];

    const labels: Record<ProductCategory | 'ALL', string> = {
      ALL: 'All Categories',
      wellness: 'Wellness & Nutrition',
      'first-aid': 'First Aid & Safety',
      monitoring: 'Health Devices & Monitors',
      hygiene: 'Personal Care & Hygiene',
      prescription: 'Prescription Items (Demo)',
    };

    return categories.map((cat) => ({
      id: cat,
      label: labels[cat],
      count: cat === 'ALL' ? products.length : products.filter((p) => p.category === cat).length,
    }));
  }

  static filterProducts(filters: ProductFilters = {}): Product[] {
    let list = this.getActiveProducts();

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((p) => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      list = list.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      list = list.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.requiresPrescription !== undefined) {
      list = list.filter((p) => p.requiresPrescription === filters.requiresPrescription);
    }

    if (filters.inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    switch (filters.sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        list.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount);
        break;
    }

    return list;
  }

  static createProduct(data: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): { success: boolean; product?: Product; error?: string } {
    const products = this.getProducts();
    const newProduct: Product = {
      ...data,
      id: generateId('prod'),
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };

    products.push(newProduct);
    localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);

    addActivityLog({
      userId: 'admin',
      userName: 'Admin',
      action: 'CREATED_PRODUCT',
      details: `Added new product: ${newProduct.name} (SKU: ${newProduct.sku})`,
      entityType: 'PRODUCT',
      entityId: newProduct.id,
    });

    return { success: true, product: newProduct };
  }

  static updateProduct(productId: string, updates: Partial<Product>): { success: boolean; product?: Product; error?: string } {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) {
      return { success: false, error: 'Product not found.' };
    }

    products[idx] = { ...products[idx], ...updates };
    localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);

    addActivityLog({
      userId: 'admin',
      userName: 'Admin',
      action: 'UPDATED_PRODUCT',
      details: `Updated product ${products[idx].name}`,
      entityType: 'PRODUCT',
      entityId: productId,
    });

    return { success: true, product: products[idx] };
  }

  static updateProductStock(productId: string, newStock: number): { success: boolean; product?: Product; error?: string } {
    if (newStock < 0) {
      return { success: false, error: 'Stock cannot be negative.' };
    }
    return this.updateProduct(productId, { stock: newStock });
  }

  static toggleProductActive(productId: string): { success: boolean; isActive?: boolean; error?: string } {
    const products = this.getProducts();
    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found' };

    prod.isActive = !prod.isActive;
    localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);

    addActivityLog({
      userId: 'admin',
      userName: 'Admin',
      action: prod.isActive ? 'ACTIVATED_PRODUCT' : 'DEACTIVATED_PRODUCT',
      details: `${prod.name} was ${prod.isActive ? 'activated' : 'archived'}`,
      entityType: 'PRODUCT',
      entityId: productId,
    });

    return { success: true, isActive: prod.isActive };
  }
}

