import { CacheWithFetcher } from '@src/base/CacheWithFetcher';

export default class BaseCache<T> extends CacheWithFetcher<T> {
	protected async getCacheItem(key: string): Promise<T | null> {
		const item = this.cache.get(key);
		return item ? item.value : null;
	}
	// Public instead of protected - testing purposes
	public evict(): void {
		// Remove first element - can be random (base class for testing abstract)
		const firstKey = this.cache.keys().next().value;
		if (firstKey) this.cache.delete(firstKey);
	}
}
