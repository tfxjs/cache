import { CreateStandardCache, CreateStandardLRUCache, CreateFetchableLRUCache } from '@src/cache';

import { TCacheOptions, TCacheStrategy, TFetchStrategy, OnItemAdded, OnItemFetched, OnItemExpired, OnItemEvicted, OnCacheCleared, ItemAddedEventData, ItemFetchedEventData, ItemExpiredEventData, ItemEvictedEventData, CacheClearedEventData, TCacheItem, TCache } from '@src/types';

export { CreateStandardCache, CreateStandardLRUCache, CreateFetchableLRUCache, TCacheOptions, TCacheStrategy, TFetchStrategy, OnItemAdded, OnItemFetched, OnItemExpired, OnItemEvicted, OnCacheCleared, ItemAddedEventData, ItemFetchedEventData, ItemExpiredEventData, ItemEvictedEventData, CacheClearedEventData, TCacheItem, TCache };

// import BasicFetcher from "./fetchers/BasicFetcher";

// class CustomObject {
//     id: string;
//     name: string;

//     constructor(id: string, name: string) {
//         this.id = id;
//         this.name = name;
//     }
// }

// async function main() {
//     const fetcher = new BasicFetcher<CustomObject>();
//     const cache = CreateFetchableLRUCache<CustomObject>({
//         maxSize: 2,
//         ttl: 2000,
//         cleanupInterval: 5000,
//         debugMode: true
//     }, fetcher);

//     cache.setCacheItem("key1", new CustomObject("1", "value1"), 2000);
//     cache.getFromCache("key1");
//     await new Promise(resolve => setTimeout(resolve, 3000));
//     cache.getFromCache("key1");
//     fetcher.setReturnValue("key2", new CustomObject("2", "value2"));
//     cache.getFromCache("key2");
//     await cache.getOrFetch("key2");
//     cache.clearCache();
//     await cache.getOrFetch("key2");

//     await new Promise(resolve => setTimeout(resolve, 3000));

//     cache.setCacheItem("key1_a", new CustomObject("1", "value1"), 2000);
//     cache.setCacheItem("key2_a", new CustomObject("2", "value2"), 2000);
//     cache.setCacheItem("key3_a", new CustomObject("3", "value3"), 2000);
//     cache.setCacheItem("key4_a", new CustomObject("4", "value4"), 2000);
// }

// main();
