export type CacheMemory<ItemType> = Map<string, TCacheItem<ItemType>>;

export type TCacheOptions = {
	ttl?: number; // Time to live in seconds, 0 means no TTL
	maxSize?: number; // Maximum number of records
	cleanupInterval?: number; // Cleanup interval in seconds
};

export type TCacheItem<T> = {
	value: T;
	expiry: number; // Expiry timestamp in milliseconds
};

/**
 * Cache interface
 * @template ItemType Type of the cache value
 */
export type TCache<ItemType> = {
	getFromCache(key: string): ItemType | null;
};

export type TFetchStrategy<ItemType> = {
	fetch(key: string): Promise<ItemType | null>;
};

export type TCacheStrategy<ItemType> = {
	getCacheItem(cache: CacheMemory<ItemType>, key: string): ItemType | null;
	getItemKeyToEvict(cache: CacheMemory<ItemType>): string | null;
};
