import { Cache, CacheItem, CacheOptions, FetchStrategy } from '@src/types';

export abstract class CacheWithFetcher<ItemType> implements Cache<ItemType> {
	protected cache: Map<string, CacheItem<ItemType>> = new Map();
	private maxSize: number;
	private ttl: number;

	private cleanup: NodeJS.Timeout | null = null;
	private cleanupInterval: number;
	private disposed: boolean = false;

	constructor(
		options: CacheOptions,
		protected fetchStrategy: FetchStrategy<ItemType> | null
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

	protected abstract getCacheItem(key: string): Promise<ItemType | null>;
	protected abstract evict(): void;

	/**
	 * Check if the cache item is expired
	 * @param item Cache item
	 * @returns True if the item is expired
	 */
	private isExpired(key: string): boolean {
		const item = this.cache.get(key);
		return item !== undefined && this.ttl > 0 && Date.now() > item.expiry;
	}

	/**
	 * Get the cache item
	 * @param key Key of the cache item
	 * @returns Cache item or null if not found or expired
	 */
	async getFromCache(key: string): Promise<ItemType | null> {
		if (this.disposed) return null;

		if (this.isExpired(key)) {
			this.cache.delete(key);
		}

		const item = await this.getCacheItem(key);
		return item;
	}

	/**
	 * Get the cache item or fetch it if not found
	 * @param key Key of the cache item
	 * @returns Item if found in cache or fetched, null if not found, expired, or fetch fails
	 */
	async getOrFetch(key: string): Promise<ItemType | null> {
		const item = await this.getFromCache(key);
		if (item !== null) {
			return item;
		}
		return this.fetchItem(key);
	}

	private async fetchItem(key: string): Promise<ItemType | null> {
		if (this.disposed) return null;

		if (this.fetchStrategy === null) {
			return null;
		}

		const value = await this.fetchStrategy.fetch(key);
		if (value !== null) {
			this.setCacheItem(key, value);
			return value;
		}

		return null;
	}

	protected setCacheItem(key: string, value: ItemType, options: CacheOptions = {}): void {
		if (this.disposed) return;

		const ttl = options.ttl !== undefined ? options.ttl : this.ttl;
		const expiry = ttl > 0 ? Date.now() + ttl * 1000 : Infinity;

		// Evict the item (defined by strategy) if the cache is full
		if (this.cache.size >= this.maxSize) {
			this.evict();
		}

		this.cache.set(key, { value, expiry });
	}

	protected clear(): void {
		if (this.disposed) return;

		this.cache.clear();
		if (this.cleanup) clearInterval(this.cleanup);
		this.cleanup = setInterval(() => this.removeExpiredItems(), this.cleanupInterval * 1000);
	}

	public dispose(): void {
		if (this.disposed) return;

		if (this.cleanup) {
			clearInterval(this.cleanup);
			this.cleanup = null;
		}
		this.disposed = true;
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
