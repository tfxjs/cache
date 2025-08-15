import BaseCache from '@src/strategies/Base.strategy';
import { TCache, TCacheItem, TCacheOptions, TCacheStrategy } from '@src/types';

export class Cache<ItemType> implements TCache<ItemType> {
	protected cache: Map<string, TCacheItem<ItemType>> = new Map();
	private maxSize: number;
	private ttl: number;

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

		if (this.maxSize <= 0) throw new Error('Max size must be greater than 0');
		if (this.ttl <= 0) throw new Error('TTL must be greater than 0');
		if (this.cleanupInterval < 0) throw new Error('Cleanup interval must be greater than or equal to 0');

		if (this.cleanupInterval > 0) {
			this.cleanup = setInterval(() => this.removeExpiredItems(), this.cleanupInterval * 1000);
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

	// Abstract

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
		if (key) this.cache.delete(key);
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

		const ttl = overrideTTL !== undefined ? overrideTTL : this.ttl;
		const expiry = ttl > 0 ? Date.now() + ttl * 1000 : Infinity;

		// Evict the item (defined by strategy) if the cache is full
		if (this.cache.size >= this.maxSize) {
			this.evict();
		}

		this.cache.set(key, { value, expiry });
	}

	/**
	 * Clear the cache
	 * @returns
	 */
	public clearCache(): void {
		if (this.disposed) return;

		this.cache.clear();
		if (this.cleanup) clearInterval(this.cleanup);
		this.cleanup = setInterval(() => this.removeExpiredItems(), this.cleanupInterval * 1000);
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
	 * Check if the cache item is expired
	 * @param item Cache item
	 * @returns True if the item is expired
	 */
	protected isExpired(key: string): boolean {
		const item = this.cache.get(key);
		return item !== undefined && this.ttl > 0 && Date.now() > item.expiry;
	}

	protected removeExpiredItems(): void {
		if (this.disposed) return;

		for (const [key, _] of this.cache.entries()) {
			if (this.isExpired(key)) {
				this.cache.delete(key);
			}
		}
	}
}
