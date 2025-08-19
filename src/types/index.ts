export type CacheMemory<ItemType> = Map<string, TCacheItem<ItemType>>;

export type TCacheOptions = {
	ttl: number; // Time to live in seconds, 0 means no TTL
	maxSize: number; // Maximum number of records
	cleanupInterval: number; // Cleanup interval in seconds
	debugMode?: boolean; // Enable debug logs
	customName?: string; // Custom name for the cache instance
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

// Events

export enum CacheEvent {
	ITEM_ADDED = 'ITEM_ADDED',
	ITEM_FETCHED = 'ITEM_FETCHED',
	ITEM_USED = 'ITEM_USED',
	ITEM_EXPIRED = 'ITEM_EXPIRED',
	ITEM_EVICTED = 'ITEM_EVICTED',
	CACHE_CLEARED = 'CACHE_CLEARED',
	CACHE_DISPOSED = 'CACHE_DISPOSED',
}

export type ItemAddedEventData<ItemType> = {
	key: string;
	item: TCacheItem<ItemType>;
	ttl: number;
	currentSize: number;
};

export type ItemFetchedEventData<ItemType> = {
	key: string;
	item: TCacheItem<ItemType>;
	ttl: number;
	currentSize: number;
};

export type ItemUsedEventData<ItemType> = {
	key: string;
	item: ItemType;
	currentSize: number;
};

export type ItemExpiredEventData<ItemType> = {
	key: string;
	item: ItemType;
	currentSize: number;
};

export type ItemEvictedEventData<ItemType> = {
	key: string;
	item: ItemType;
	currentSize: number;
};

export type CacheClearedEventData<ItemType> = {
	removedItems: Array<TCacheItem<ItemType>>;
};

export type CacheDisposedEventData<ItemType> = {};

// Mapping from CacheEvent discriminator to its concrete payload shape
export interface CacheEventPayloadMap<ItemType> {
	[CacheEvent.ITEM_ADDED]: ItemAddedEventData<ItemType>;
	[CacheEvent.ITEM_FETCHED]: ItemFetchedEventData<ItemType>;
	[CacheEvent.ITEM_USED]: ItemUsedEventData<ItemType>;
	[CacheEvent.ITEM_EXPIRED]: ItemExpiredEventData<ItemType>;
	[CacheEvent.ITEM_EVICTED]: ItemEvictedEventData<ItemType>;
	[CacheEvent.CACHE_CLEARED]: CacheClearedEventData<ItemType>;
	[CacheEvent.CACHE_DISPOSED]: CacheDisposedEventData<ItemType>;
}

// Single event type for a specific CacheEvent value
export type CacheEventData<Type extends CacheEvent, ItemType> = {
	event: Type;
	data: CacheEventPayloadMap<ItemType>[Type];
};

// Discriminated union of all possible cache events
export type AnyCacheEventData<ItemType> = {
	[K in CacheEvent]: { event: K; data: CacheEventPayloadMap<ItemType>[K] };
}[CacheEvent];

// Helper factory to build correctly typed event objects (optional)
export const createCacheEvent = <T, E extends CacheEvent>(event: E, data: CacheEventPayloadMap<T>[E]): CacheEventData<E, T> => ({ event, data });

export interface OnItemAdded<ItemType> {
	onItemAdded: (data: ItemAddedEventData<ItemType>) => void;
}

export interface OnItemFetched<ItemType> {
	onItemFetched: (data: ItemFetchedEventData<ItemType>) => void;
}

export interface OnItemUsed<ItemType> {
	onItemUsed: (data: ItemUsedEventData<ItemType>) => void;
}

export interface OnItemExpired<ItemType> {
	onItemExpired: (data: ItemExpiredEventData<ItemType>) => void;
}

export interface OnItemEvicted<ItemType> {
	onItemEvicted: (data: ItemEvictedEventData<ItemType>) => void;
}

export interface OnCacheCleared<ItemType> {
	onCacheCleared: (data: CacheClearedEventData<ItemType>) => void;
}

export interface OnCacheDisposed<ItemType> {
	onCacheDisposed: (data: CacheDisposedEventData<ItemType>) => void;
}
