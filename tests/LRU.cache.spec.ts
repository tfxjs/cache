import { Cache } from '@src/base/Cache';
import { CreateStandardLRUCache } from '@src/cache';
import BaseStrategy from '@src/strategies/Base.strategy';

describe('LRU Cache', () => {
	let cache: Cache<string>;
	let strategy: BaseStrategy<string>;

	beforeEach(() => {
		cache = CreateStandardLRUCache<string>({
			maxSize: 50,
			ttl: 60,
			cleanupInterval: 10,
		});
	});

	afterEach(() => {
		cache.dispose();
	});

	it('should remove least recently used item when max size exceeded #1', async () => {
		// Simulate adding 55 ([1, 55]) items to the cache
		for (let i = 1; i <= 55; i++) {
			cache.setCacheItem(`key${i}`, `value${i}`);
		}

		expect(cache.Size).toBe(50);

		// Verify that the least recently used items were evicted - [1, 5]
		for (let i = 1; i <= 5; i++) {
			const value = cache.getFromCache(`key${i}`);
			expect(value).toBeNull();
		}
	});

	it('should remove least recently used item when max size exceeded #2', async () => {
		// Add 60 ([1, 60]) items to the cache
		for (let i = 1; i <= 60; i++) {
			cache.setCacheItem(`key${i}`, `value${i}`);
		}

		// In cache: [11, 12, ..., 60], can no longer add new items
		// Use [12, 13, 14, 15, 16] - 5 item used - 11, 17, 18 should be evicted, [12, 13, ..., 16] should be in cache
		for (let i = 12; i <= 16; i++) {
			const value = cache.getFromCache(`key${i}`);
			expect(value).toBe(`value${i}`);
		}

		// Add [61, 62, 63]
		for (let i = 61; i <= 63; i++) {
			cache.setCacheItem(`key${i}`, `value${i}`);
		}

		// keys 11, 17, 18 should be evicted
		const evictedKeys = [11, 17, 18];
		for (const key of evictedKeys) {
			const value = cache.getFromCache(`key${key}`);
			expect(value).toBeNull();
		}
	});
});
