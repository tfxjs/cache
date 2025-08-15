import { CacheMemory, TCacheStrategy } from '@src/types';

/**
 * Least Recently Used (LRU) Cache
 * @template T Type of the cache value
 */
export default class LRUStrategy<T> implements TCacheStrategy<T> {
	getCacheItem(cache: CacheMemory<T>, key: string): T | null {
		const item = cache.get(key);
		if (item === undefined) return null;
		cache.delete(key);
		cache.set(key, item);
		return item.value;
	}

	getItemKeyToEvict(cache: CacheMemory<T>): string | null {
		const firstKey = cache.keys().next().value;
		return firstKey || null;
	}
}
