import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { Cart, CartItem, Product } from '@/types';
import { ProductService } from '@/features/products/product.service';

const INITIAL_EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  requiresPrescription: false,
};

export class CartService {
  static getCart(): Cart {
    const cart = localStorageAdapter.getItem<Cart>(STORAGE_KEYS.CART, INITIAL_EMPTY_CART);
    return this.recalculateCart(cart);
  }

  private static recalculateCart(cart: Cart): Cart {
    const products = ProductService.getProducts();

    const validatedItems: CartItem[] = [];

    cart.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.isActive) {
        // Enforce valid quantity <= stock
        const validQty = Math.max(1, Math.min(item.quantity, prod.stock));
        if (prod.stock > 0) {
          validatedItems.push({
            productId: prod.id,
            product: prod,
            quantity: validQty,
            priceSnapshot: prod.price,
          });
        }
      }
    });

    const subtotal = validatedItems.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0);
    const deliveryFee = subtotal > 0 ? (subtotal >= 1000 ? 0 : 50) : 0;
    const discount = subtotal >= 2500 ? 150 : 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);
    const requiresPrescription = validatedItems.some((item) => item.product.requiresPrescription);

    const calculatedCart: Cart = {
      items: validatedItems,
      subtotal,
      deliveryFee,
      discount,
      total,
      requiresPrescription,
    };

    return calculatedCart;
  }

  static saveCart(cart: Cart): Cart {
    const calculated = this.recalculateCart(cart);
    localStorageAdapter.setItem(STORAGE_KEYS.CART, calculated);
    return calculated;
  }

  static addToCart(productId: string, quantity: number = 1): { success: boolean; cart: Cart; error?: string } {
    const product = ProductService.getProductById(productId);
    if (!product || !product.isActive) {
      return { success: false, cart: this.getCart(), error: 'Product is no longer available.' };
    }

    if (product.stock <= 0) {
      return { success: false, cart: this.getCart(), error: 'Product is currently out of stock.' };
    }

    const currentCart = this.getCart();
    const existingIndex = currentCart.items.findIndex((item) => item.productId === productId);

    if (existingIndex > -1) {
      const newQty = currentCart.items[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        return {
          success: false,
          cart: currentCart,
          error: `Only ${product.stock} units of ${product.name} are available in stock.`,
        };
      }
      currentCart.items[existingIndex].quantity = newQty;
    } else {
      if (quantity > product.stock) {
        return {
          success: false,
          cart: currentCart,
          error: `Only ${product.stock} units of ${product.name} are available in stock.`,
        };
      }
      currentCart.items.push({
        productId: product.id,
        product,
        quantity,
        priceSnapshot: product.price,
      });
    }

    const updated = this.saveCart(currentCart);
    return { success: true, cart: updated };
  }

  static updateQuantity(productId: string, quantity: number): { success: boolean; cart: Cart; error?: string } {
    const currentCart = this.getCart();
    const itemIndex = currentCart.items.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      return { success: false, cart: currentCart, error: 'Item not found in cart.' };
    }

    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    const product = ProductService.getProductById(productId);
    if (!product || quantity > product.stock) {
      return {
        success: false,
        cart: currentCart,
        error: `Only ${product?.stock || 0} units available in stock.`,
      };
    }

    currentCart.items[itemIndex].quantity = quantity;
    const updated = this.saveCart(currentCart);
    return { success: true, cart: updated };
  }

  static removeFromCart(productId: string): { success: boolean; cart: Cart } {
    const currentCart = this.getCart();
    currentCart.items = currentCart.items.filter((item) => item.productId !== productId);
    const updated = this.saveCart(currentCart);
    return { success: true, cart: updated };
  }

  static clearCart(): Cart {
    const empty = { ...INITIAL_EMPTY_CART, items: [] };
    localStorageAdapter.setItem(STORAGE_KEYS.CART, empty);
    return empty;
  }
}

