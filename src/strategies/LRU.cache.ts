import { CacheWithFetcher } from '@src/base/CacheWithFetcher';
import { CacheOptions, FetchStrategy } from '@src/types';

/**
 * Least Recently Used (LRU) Cache
 * @template T Type of the cache value
 */
export default class LRUCache<T> extends CacheWithFetcher<T> {
	constructor(options: CacheOptions, fetchStrategy: FetchStrategy<T> | null) {
		super(options, fetchStrategy);
	}

	protected async getCacheItem(key: string): Promise<T | null> {
		const item = this.cache.get(key);
		if (item === undefined) return null;
		this.cache.delete(key);
		this.cache.set(key, item);
		return item.value;
	}

	protected async evict(): Promise<void> {
		const firstKey = this.cache.keys().next().value;
		if (firstKey !== undefined) {
			this.cache.delete(firstKey);
		}
	}
}
