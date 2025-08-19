import { CacheClearedEventData, CacheDisposedEventData, CacheMemory, ItemAddedEventData, ItemEvictedEventData, ItemExpiredEventData, ItemFetchedEventData, ItemRemovedEventData, ItemUpdatedEventData, ItemUsedEventData, OnCacheCleared, OnCacheDisposed, OnItemAdded, OnItemEvicted, OnItemExpired, OnItemFetched, OnItemRemoved, OnItemUpdated, OnItemUsed, TCacheStrategy } from '@src/types';

export default class BaseStrategy<T> implements TCacheStrategy<T>, OnItemAdded<T>, OnItemUpdated<T>, OnItemFetched<T>, OnItemExpired<T>, OnItemEvicted<T>, OnItemUsed<T>, OnCacheCleared<T>, OnCacheDisposed<T>, OnItemRemoved<T> {
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
	onItemUpdated(data: ItemUpdatedEventData<T>): void {}
	onItemFetched(data: ItemFetchedEventData<T>): void {}
	onItemExpired(data: ItemExpiredEventData<T>): void {}
	onItemEvicted(data: ItemEvictedEventData<T>): void {}
	onItemUsed(data: ItemUsedEventData<T>): void {}
	onItemRemoved(data: ItemRemovedEventData<T>): void {}
	onCacheCleared(data: CacheClearedEventData<T>): void {}
	onCacheDisposed(data: CacheDisposedEventData<T>): void {}
}
