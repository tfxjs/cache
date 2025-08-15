import { CacheMemory, TCacheStrategy } from '@src/types';

export default class BaseStrategy<T> implements TCacheStrategy<T> {
	public getCacheItem(cache: CacheMemory<T>, key: string): T | null {
		const item = cache.get(key);
		return item ? item.value : null;
	}

	// Public instead of protected - testing purposes
	public getItemKeyToEvict(cache: CacheMemory<T>): string | null {
		const firstKey = cache.keys().next().value;
		return firstKey || null;
	}
}
