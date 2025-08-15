export type CacheOptions = {
	ttl?: number; // Time to live in seconds, 0 means no TTL
	maxSize?: number; // Maximum number of records
	cleanupInterval?: number; // Cleanup interval in seconds
};

export type CacheItem<T> = {
	value: T;
	expiry: number; // Expiry timestamp in milliseconds
};

/**
 * Cache interface
 * @template ItemType Type of the cache value
 */
export type Cache<ItemType> = {
	getFromCache(key: string): Promise<ItemType | null>;
};

export type FetchStrategy<ItemType> = {
	fetch(key: string): Promise<ItemType | null>;
};
