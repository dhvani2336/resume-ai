const cacheStore = new Map();

export const cache = {
  get: (key) => {
    const item = cacheStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      cacheStore.delete(key);
      return null;
    }
    return item.value;
  },
  set: (key, value, ttlMs = 10 * 60 * 1000) => { // Default TTL: 10 minutes
    cacheStore.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  },
  delete: (key) => {
    cacheStore.delete(key);
  },
  clear: () => {
    cacheStore.clear();
  }
};
