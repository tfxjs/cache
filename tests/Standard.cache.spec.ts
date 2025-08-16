import { Cache } from '@src/base/Cache';
import { CreateStandardCache } from '@src/cache';
import BaseStrategy from '@src/strategies/Base.strategy';

describe('Standard Cache', () => {
	describe('constructor', () => {
		describe('correct initialization', () => {
			it('should initialize with correct options', () => {
				const cache = CreateStandardCache<string>({
					maxSize: 50,
					ttl: 60000,
					cleanupInterval: 10000,
				});
				expect(cache.Capacity).toBe(50);
				expect(cache.TimeToLive).toBe(60000);
				expect(cache.CleanupInterval).toBe(10000);
				expect(cache.Size).toBe(0);
				cache.dispose();
			});

			it('should set interval if cleanupInterval is greater than 0', () => {
				const cache = CreateStandardCache<string>({
					maxSize: 50,
					ttl: 60000,
					cleanupInterval: 10000,
				});
				expect(cache.CleanupInterval).toBe(10000);
				expect(cache['cleanup']).toBeDefined();
				cache.dispose();
			});

			it('should not set interval if cleanupInterval is 0', () => {
				const cache = CreateStandardCache<string>({
					maxSize: 50,
					ttl: 60000,
					cleanupInterval: 0,
				});
				expect(cache.CleanupInterval).toBe(0);
				expect(cache['cleanup']).toBeNull();
				cache.dispose();
			});
		});

		/*
        Wyjątki przy złych opcjach
        Czy konstruktor rzuca błędy przy nieprawidłowych wartościach opcji (ttl < 0, maxSize <= 0, itp.)?
        */
		describe('throw error', () => {
			it('should throw an error if maxSize is less than or equal to 0', () => {
				expect(() =>
					CreateStandardCache<string>({
						maxSize: -1,
						ttl: 60000,
						cleanupInterval: 10000,
					})
				).toThrow();

				expect(() =>
					CreateStandardCache<string>({
						maxSize: 0,
						ttl: 60000,
						cleanupInterval: 10000,
					})
				).toThrow();
			});

			it('should throw an error if ttl is less than or equal to 0', () => {
				expect(() =>
					CreateStandardCache<string>({
						maxSize: 50,
						ttl: -1,
						cleanupInterval: 10000,
					})
				).toThrow();

				expect(() =>
					CreateStandardCache<string>({
						maxSize: 50,
						ttl: 0,
						cleanupInterval: 10000,
					})
				).toThrow();
			});

			it('should throw an error if cleanupInterval is less than 0', () => {
				expect(() =>
					CreateStandardCache<string>({
						maxSize: 50,
						ttl: 60000,
						cleanupInterval: -1,
					})
				).toThrow();
			});
		});
	});

	describe('cache size', () => {
		let cache: Cache<string>;
		let strategy: BaseStrategy<string>;

		beforeEach(() => {
			strategy = new BaseStrategy<string>();
			cache = CreateStandardCache<string>(
				{
					maxSize: 50,
					ttl: 60000,
					cleanupInterval: 10000,
				},
				strategy
			);

			jest.spyOn(strategy, 'getItemKeyToEvict');
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should not exceed max size', async () => {
			for (let i = 1; i <= 55; i++) {
				cache.setCacheItem(`key${i}`, `value${i}`);
			}
			expect(cache.Size).toBe(50);
		});

		it('should invoke evict when max size exceeded', async () => {
			for (let i = 1; i <= 55; i++) {
				cache.setCacheItem(`key${i}`, `value${i}`);
			}
			expect(strategy['getItemKeyToEvict']).toHaveBeenCalledTimes(5);
		});
	});

	describe('cache item ttl/expiration time', () => {
		let cache: Cache<string>;
		let strategy: BaseStrategy<string>;

		beforeEach(() => {
			strategy = new BaseStrategy<string>();
			cache = CreateStandardCache<string>(
				{
					maxSize: 50,
					ttl: 60000,
					cleanupInterval: 10000,
				},
				strategy
			);

			jest.spyOn(strategy, 'getItemKeyToEvict');
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should set expiration time correctly', () => {
			const key = 'key1';
			const value = 'value1';
			const currentTime = Date.now();
			const ttl = 2000;
			const cacheItem = cache['convertToCacheItem'](key, value, ttl);
			expect(cacheItem).toStrictEqual(expect.objectContaining({
				value: value,
				expiry: expect.closeTo(currentTime + ttl)
			}));
		});
	});

	describe('cache events', () => {
		let size: number;
		let cleanupInterval: number;
		let ttl: number;
		let strategy: BaseStrategy<string>;
		let cache: Cache<string>;

		beforeEach(() => {
			jest.useFakeTimers();

			size = 3;
			cleanupInterval = 3000;
			ttl = 2000;
			strategy = new BaseStrategy<string>();
			cache = CreateStandardCache<string>(
				{
					maxSize: 3,
					ttl,
					cleanupInterval,
				}, strategy
			);

			jest.spyOn(strategy, 'onItemAdded');
			jest.spyOn(strategy, 'onItemExpired');
			jest.spyOn(strategy, 'onItemEvicted');
			jest.spyOn(strategy, 'onItemUsed');
			jest.spyOn(strategy, 'onCacheCleared');
			// onItemFetched will be tested in Fetchable tests
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should emit an event when an item is added', () => {
			const key = 'key1';
			const value = 'value1';
			cache.setCacheItem(key, value);
			expect(strategy.onItemAdded).toHaveBeenCalledWith(expect.objectContaining({
				key: key,
				ttl: ttl,
				currentSize: 1,
				item: expect.objectContaining({ 
					value: value,
					expiry: expect.any(Number)
				})
			}));
		});

		it('should emit an event when item is expired', () => {
			const key = 'key1';
			const value = 'value1';
			cache.setCacheItem(key, value);
			const waitTime = (Math.ceil(ttl/cleanupInterval) + 0.5) * (cleanupInterval);
			jest.advanceTimersByTime(waitTime);
			expect(strategy.onItemExpired).toHaveBeenCalledWith(expect.objectContaining({
				key: key,
				item: value,
				currentSize: 0
			}));
		});

		it('should emit an event when item is evicted', () => {
			const key = (x: number) => `key${x}`;
			const value = (x: number) => `value${x}`;
			for(let i = 1; i <= size + 1; i++) {
				cache.setCacheItem(key(i), value(i));
			}
			expect(strategy.onItemEvicted).toHaveBeenCalledWith(expect.objectContaining({
				key: key(1),
				item: value(1),
				currentSize: size - 1
			}));
		});

		it('should emit an event when item is used', () => {
			const key = 'key1';
			const value = 'value1';
			cache.setCacheItem(key, value);
			cache.getFromCache(key);
			expect(strategy.onItemUsed).toHaveBeenCalledWith(expect.objectContaining({
				key: key,
				item: value,
				currentSize: 1
			}));
		});

		it('should emit an event when cache is cleared', () => {
			for (let i = 1; i <= size; i++) {
				cache.setCacheItem(`key${i}`, `value${i}`);
			}
			expect(cache.Size).toBe(size);
			cache.clearCache();
			expect(strategy.onCacheCleared).toHaveBeenCalledWith(expect.objectContaining({
				removedItems: expect.arrayContaining([
					expect.objectContaining({ value: 'value1', expiry: expect.any(Number) }),
					expect.objectContaining({ value: 'value2', expiry: expect.any(Number) }),
					expect.objectContaining({ value: 'value3', expiry: expect.any(Number) })
				])
			}));
			expect(cache.Size).toBe(0);
		});
	});

	describe('cache clear', () => {
		let cache: Cache<string>;

		beforeEach(() => {
			cache = CreateStandardCache<string>(
				{
					maxSize: 50,
					ttl: 60000,
					cleanupInterval: 10000,
				}
			);
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should clear the cache', () => {
			cache.setCacheItem('key1', 'value1');
			cache.setCacheItem('key2', 'value2');
			cache.clearCache();
			expect(cache.Size).toBe(0);
		});
	});
});
