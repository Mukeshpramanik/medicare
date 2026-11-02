'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Star,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Package,
  AlertTriangle,
  Info,
  CheckCircle2,
  Minus,
  Plus,
} from 'lucide-react';
import { ProductService } from '@/features/products/product.service';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/features/cart/cart.context';
import { useToast } from '@/components/ui/Toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { success, error } = useToast();

  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    const prod = ProductService.getProductById(productId);
    if (prod) {
      setProduct(prod);
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    const res = addToCart(product.id, quantity);
    if (res.success) {
      success(`Added ${quantity} × ${product.name} to cart.`);
    } else {
      error(res.error || 'Failed to add item to cart.');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const res = addToCart(product.id, quantity);
    if (res.success) {
      router.push('/cart');
    } else {
      error(res.error || 'Failed to proceed to cart.');
    }
  };

  if (!product) {
    const recommendedProducts = ProductService.getActiveProducts().slice(0, 3);
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Package className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Healthcare Product Not Found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The requested product (ID: <code className="text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{productId}</code>) could not be found or has been archived from the catalog.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Link href="/products">
            <Button variant="primary">Browse Full Catalog</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Homepage</Button>
          </Link>
        </div>

        {recommendedProducts.length > 0 && (
          <div className="pt-8 border-t border-slate-200 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
              Popular Healthcare Items in Catalog
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedProducts.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h4>
                      <p className="text-[11px] font-bold text-slate-700">{formatCurrency(p.price)}</p>
                    </div>
                  </div>
                  <Link href={`/products/${p.id}`} className="mt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/products" className="hover:text-slate-800">Healthcare Store</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Image */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.requiresPrescription ? (
                <div className="absolute top-4 left-4">
                  <Badge variant="warning" size="md">Prescription Required (Demo)</Badge>
                </div>
              ) : (
                <div className="absolute top-4 left-4">
                  <Badge variant="default" size="md">Over The Counter</Badge>
                </div>
              )}
            </div>

            {/* Catalog Info tags */}
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Product Details & Purchase Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-tealbrand-700">
                <span>{product.category}</span>
                <span className="text-slate-400 font-mono">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-slate-900 font-bold">{product.rating}</strong>
                  <span className="text-slate-400">({product.reviewCount} customer reviews)</span>
                </div>
                <span>•</span>
                <span className="text-slate-500 font-medium">Pack: {product.packSize}</span>
              </div>
            </div>

            {/* Price block */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Retail Price (Inclusive of Taxes)</span>
                <span className="text-3xl font-black text-slate-900">{formatCurrency(product.price)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Inventory</span>
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {product.stock} units in stock
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    Currently Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Product Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Usage Information */}
            <div className="p-4 rounded-2xl bg-tealbrand-50/50 border border-tealbrand-100 space-y-1.5 text-xs text-tealbrand-950">
              <div className="font-bold flex items-center gap-1.5 text-tealbrand-800">
                <Info className="w-4 h-4" /> Usage & Storage Information
              </div>
              <p className="text-tealbrand-900 leading-relaxed">{product.usageInfo}</p>
            </div>

            {/* Prescription notice if required */}
            {product.requiresPrescription && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Demo Prescription Verification Required
                </div>
                <p>
                  This item requires an approved prescription before checkout can be confirmed. A demo prescription document must be submitted for simulated administrative review.
                </p>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1 || product.stock === 0}
                    className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                    disabled={quantity >= product.stock || product.stock === 0}
                    className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">Total: {formatCurrency(product.price * quantity)}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="teal"
                  size="lg"
                  className="flex-1"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

