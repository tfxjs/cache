import { CacheClearedEventData, CacheDisposedEventData, CacheMemory, ItemAddedEventData, ItemEvictedEventData, ItemExpiredEventData, ItemFetchedEventData, ItemUsedEventData, OnCacheCleared, OnCacheDisposed, OnItemAdded, OnItemEvicted, OnItemExpired, OnItemFetched, OnItemUsed, TCacheStrategy } from '@src/types';

export default class BaseStrategy<T> implements TCacheStrategy<T>, OnItemAdded<T>, OnItemFetched<T>, OnItemExpired<T>, OnItemEvicted<T>, OnItemUsed<T>, OnCacheCleared<T>, OnCacheDisposed<T> {
	public getCacheItem(cache: CacheMemory<T>, key: string): T | null {
		const item = cache.get(key);
		return item ? item.value : null;
	}

	// Public instead of protected - testing purposes
	public getItemKeyToEvict(cache: CacheMemory<T>): string | null {
		const firstKey = cache.keys().next().value;
		return firstKey || null;
	}

	onItemAdded(data: ItemAddedEventData<T>): void {}
	onItemFetched(data: ItemFetchedEventData<T>): void {}
	onItemExpired(data: ItemExpiredEventData<T>): void {}
	onItemEvicted(data: ItemEvictedEventData<T>): void {}
	onItemUsed(data: ItemUsedEventData<T>): void {}
	onCacheCleared(data: CacheClearedEventData<T>): void {}
	onCacheDisposed(data: CacheDisposedEventData<T>): void {}
}
