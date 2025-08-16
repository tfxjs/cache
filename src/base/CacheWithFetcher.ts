import { CacheEvent, TCacheOptions, TCacheStrategy, TFetchStrategy } from '@src/types';
import { Cache } from '@src/base/Cache';
import BaseCache from '@src/strategies/Base.strategy';
import BasicFetcher from '@src/fetchers/BasicFetcher';

export class CacheWithFetcher<ItemType> extends Cache<ItemType> {
	constructor(
		options: TCacheOptions,
		protected strategy: TCacheStrategy<ItemType> = new BaseCache<ItemType>(),
		protected fetchStrategy: TFetchStrategy<ItemType> = new BasicFetcher<ItemType>()
	) {
		super(options, strategy);
	}

	// Fetching

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

	/**
	 * Fetch an item from the source
	 * @param key Key of the item to fetch
	 * @returns Fetched item or null if not found
	 */
	private async fetchItem(key: string): Promise<ItemType | null> {
		if (this.Disposed) return null;

		const value = await this.fetchStrategy.fetch(key);
		if (value !== null) {
			const item = this.convertToCacheItem(key, value);
			this.cache.set(key, item);
			
			this.emitEvent(CacheEvent.ITEM_FETCHED, {
				key,
				item,
				ttl: this.TimeToLive,
				currentSize: this.Size
			});
			return value;
		}

		return null;
	}
}
