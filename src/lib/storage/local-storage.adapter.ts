import { StorageAdapter } from './storage.interface';

class LocalStorageAdapterImpl implements StorageAdapter {
  private memoryStore: Map<string, string> = new Map();
  private subscribers: Map<string, Set<(newValue: unknown) => void>> = new Map();

  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  getItem<T>(key: string, defaultValue: T): T {
    try {
      if (this.isClient()) {
        const item = window.localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
      } else {
        const item = this.memoryStore.get(key);
        if (!item) return defaultValue;
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`[LocalStorageAdapter] Error reading key "${key}":`, error);
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      if (this.isClient()) {
        window.localStorage.setItem(key, serialized);
      } else {
        this.memoryStore.set(key, serialized);
      }
      this.notifySubscribers(key, value);
      return true;
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error saving key "${key}":`, error);
      return false;
    }
  }

  removeItem(key: string): boolean {
    try {
      if (this.isClient()) {
        window.localStorage.removeItem(key);
      } else {
        this.memoryStore.delete(key);
      }
      this.notifySubscribers(key, null);
      return true;
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error removing key "${key}":`, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      if (this.isClient()) {
        window.localStorage.clear();
      } else {
        this.memoryStore.clear();
      }
      this.subscribers.forEach((callbacks, key) => {
        callbacks.forEach((cb) => cb(null));
      });
      return true;
    } catch (error) {
      console.error('[LocalStorageAdapter] Error clearing storage:', error);
      return false;
    }
  }

  subscribe(key: string, callback: (newValue: unknown) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    const set = this.subscribers.get(key)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  notifySubscribers(key: string, value: unknown): void {
    const set = this.subscribers.get(key);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(value);
        } catch (e) {
          console.error(`[LocalStorageAdapter] Subscriber error on key ${key}:`, e);
        }
      });
    }
  }
}

export const localStorageAdapter = new LocalStorageAdapterImpl();

