export interface StorageAdapter {
  getItem<T>(key: string, defaultValue: T): T;
  setItem<T>(key: string, value: T): boolean;
  removeItem(key: string): boolean;
  clear(): boolean;
  subscribe(key: string, callback: (newValue: unknown) => void): () => void;
  notifySubscribers(key: string, value: unknown): void;
}

