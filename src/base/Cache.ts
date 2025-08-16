import BaseCache from '@src/strategies/Base.strategy';
import { CacheEvent, CacheEventPayloadMap, TCache, TCacheItem, TCacheOptions, TCacheStrategy } from '@src/types';

export class Cache<ItemType> implements TCache<ItemType> {
	protected readonly cache: Map<string, TCacheItem<ItemType>> = new Map();
	private readonly maxSize: number;
	private readonly ttl: number;
	private readonly debugMode: boolean;
	private readonly name: string;

	private cleanup: NodeJS.Timeout | null = null;
	private cleanupInterval: number;
	private disposed: boolean = false;

	constructor(
		options: TCacheOptions,
		protected strategy: TCacheStrategy<ItemType> = new BaseCache<ItemType>()
	) {
		this.maxSize = options.maxSize != undefined ? options.maxSize : Infinity;
		this.ttl = options.ttl != undefined ? options.ttl : 0;
		this.cleanupInterval = options.cleanupInterval != undefined ? options.cleanupInterval : 0;
		this.debugMode = options.debugMode !== undefined ? options.debugMode : false;
		this.name = options.customName !== undefined ? options.customName : `${Math.random().toString(36).substring(2, 9)}`;

		if (this.maxSize <= 0) throw new Error('Max size must be greater than 0');
		if (this.ttl <= 0) throw new Error('TTL must be greater than 0');
		if (this.cleanupInterval < 0) throw new Error('Cleanup interval must be greater than or equal to 0');

		if (this.cleanupInterval > 0) {
			this.cleanup = setInterval(() => this.removeExpiredItems(), this.cleanupInterval);
		}
	}

	// Getters

	get Capacity(): number {
		return this.maxSize;
	}

	get Size(): number {
		return this.cache.size;
	}

	get TimeToLive(): number {
		return this.ttl;
	}

	get CleanupInterval(): number {
		return this.cleanupInterval;
	}

	get Disposed(): boolean {
		return this.disposed;
	}

	// Strategy

	/**
	 * Get the cache item - retrieves the item from the cache and handles logic for different strategies
	 * @param key Key of the cache item
	 */
	protected getCacheItem(key: string): ItemType | null {
		return this.strategy.getCacheItem(this.cache, key);
	}

	/**
	 * Evict an item from the cache - handle eviction logic for different strategies
	 */
	protected evict(): void {
		const key = this.strategy.getItemKeyToEvict(this.cache);

		if (!key) {
			throw new Error(`evict: No item key found to evict`);
		}

		const item = this.cache.get(key);
		if (!item) {
			throw new Error(`evict: Cache item not found: ${key}`);
		}

		this.cache.delete(key);
		this.emitEvent(CacheEvent.ITEM_EVICTED, { key, item: item.value, currentSize: this.Size });
	}

	// Public

	/**
	 * Get the cache item
	 * @param key Key of the cache item
	 * @returns Cache item or null if not found or expired
	 */
	public getFromCache(key: string): ItemType | null {
		if (this.disposed) return null;

		if (this.isExpired(key)) {
			this.cache.delete(key);
		}

		const item = this.getCacheItem(key);
		if(item !== null) this.emitEvent(CacheEvent.ITEM_USED, { key, item, currentSize: this.Size });

		return item;
	}

	/**
	 * Set a cache item
	 * @param key Key of the cache item
	 * @param value Value of the cache item
	 * @param overrideTTL Override the TTL for this item in seconds
	 * @returns
	 */
	public setCacheItem(key: string, value: ItemType, overrideTTL: number | undefined = undefined): void {
		if (this.disposed) return;

		// Evict the item (defined by strategy) if the cache is full
		if (this.cache.size >= this.maxSize) {
			this.evict();
		}

		const item = this.convertToCacheItem(key, value, overrideTTL);
		this.cache.set(key, item);

		this.emitEvent(CacheEvent.ITEM_ADDED, {
			key,
			item,
			ttl: overrideTTL ?? this.TimeToLive,
			currentSize: this.Size
		});
	}

	/**
	 * Clear the cache
	 * @returns
	 */
	public clearCache(): void {
		if (this.disposed) return;

		const removedItems = Array.from(this.cache.values());
		this.cache.clear();
		this.emitEvent(CacheEvent.CACHE_CLEARED, { removedItems });

		if (this.cleanup) clearInterval(this.cleanup);
		this.cleanup = setInterval(() => this.removeExpiredItems(), this.cleanupInterval);
	}

	/**
	 * Dispose the cache
	 * @returns
	 */
	public dispose(): void {
		if (this.disposed) return;

		if (this.cleanup) {
			clearInterval(this.cleanup);
			this.cleanup = null;
		}
		this.disposed = true;
	}

	// Private & Protected - internal use

	/**
	 * Convert the given key and value into a cache item
	 * @param key Key of the cache item
	 * @param value Value of the cache item
	 * @param overrideTTL Override the TTL for this item in seconds
	 * @returns Cache item
	 */
	protected convertToCacheItem(key: string, value: ItemType, overrideTTL: number | undefined = undefined): TCacheItem<ItemType> {
		const ttl = overrideTTL !== undefined ? overrideTTL : this.ttl;
		return {
			value,
			expiry: Date.now() + ttl
		};
	}

	/**
	 * Check if the cache item is expired
	 * @param item Cache item
	 * @returns True if the item is expired
	 */
	protected isExpired(key: string): boolean {
		const item = this.cache.get(key);
		return item !== undefined && this.ttl > 0 && Date.now() > item.expiry;
	}

	/**
	 * Remove expired items from the cache
	 * @returns
	 */
	protected removeExpiredItems(): void {
		if (this.disposed) return;

		for (const [key, _] of this.cache.entries()) {
			const item = this.cache.get(key);
			if (this.isExpired(key) && item !== undefined) {
				this.cache.delete(key);
				this.emitEvent(CacheEvent.ITEM_EXPIRED, { key, item: item.value, currentSize: this.Size });
			}
		}
	}

	// Events

	/**
	 * Emit a cache event
	 * @param event Cache event type
	 * @param data Event data
	 */
	protected emitEvent<K extends CacheEvent>(event: K, data: CacheEventPayloadMap<ItemType>[K]): void {
		// Dynamically dispatch to strategy lifecycle hooks if they exist
		// Strategy may implement any subset of the OnItemXXX interfaces.
		// We intentionally keep loose assertions localized here to preserve
		// strong typing elsewhere while allowing pluggable strategies.
		if (this.debugMode) {
			console.log(`Cache[${this.name}]`, { event, data: JSON.stringify(data) });
		}
		switch (event) {
			case CacheEvent.ITEM_ADDED: {
				const handler = (this.strategy as unknown as { onItemAdded?: (d: CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_ADDED]) => void }).onItemAdded;
				handler?.(data as CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_ADDED]);
				break;
			}
			case CacheEvent.ITEM_EVICTED: {
				const handler = (this.strategy as unknown as { onItemEvicted?: (d: CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_EVICTED]) => void }).onItemEvicted;
				handler?.(data as CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_EVICTED]);
				break;
			}
			case CacheEvent.ITEM_FETCHED: {
				const handler = (this.strategy as unknown as { onItemFetched?: (d: CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_FETCHED]) => void }).onItemFetched;
				handler?.(data as CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_FETCHED]);
				break;
			}
			case CacheEvent.ITEM_EXPIRED: {
				const handler = (this.strategy as unknown as { onItemExpired?: (d: CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_EXPIRED]) => void }).onItemExpired;
				handler?.(data as CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_EXPIRED]);
				break;
			}
			case CacheEvent.ITEM_USED: {
				const handler = (this.strategy as unknown as { onItemUsed?: (d: CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_USED]) => void }).onItemUsed;
				handler?.(data as CacheEventPayloadMap<ItemType>[typeof CacheEvent.ITEM_USED]);
				break;
			}
			case CacheEvent.CACHE_CLEARED: {
				const handler = (this.strategy as unknown as { onCacheCleared?: (d: CacheEventPayloadMap<ItemType>[typeof CacheEvent.CACHE_CLEARED]) => void }).onCacheCleared;
				handler?.(data as CacheEventPayloadMap<ItemType>[typeof CacheEvent.CACHE_CLEARED]);
				break;
			}
			default:
				throw new Error(`Unknown cache event: ${event}`);
		}
	}
}
