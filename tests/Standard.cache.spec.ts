import { Cache } from '@src/base/Cache';
import { CreateStandardCache } from '@src/cache';
import BaseStrategy from '@src/strategies/Base.strategy';
import { TCacheStrategy } from '@src/types';

describe('Standard Cache', () => {
	const calculateWaitTime = (ttl: number, cleanupInterval: number): number => {
		return (
			(Math.ceil(ttl / cleanupInterval) + // Round up to the nearest interval
				0.5 + // Add half an interval
				(ttl % cleanupInterval === 0 ? 1 : 0)) * // Add an extra interval if ttl is a multiple of cleanupInterval
			cleanupInterval
		);
	};

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
			const evictSpy = jest.spyOn(cache as any, 'evict');
			for (let i = 1; i <= 55; i++) {
				cache.setCacheItem(`key${i}`, `value${i}`);
			}
			expect(evictSpy).toHaveBeenCalledTimes(5);
			expect(strategy['getItemKeyToEvict']).toHaveBeenCalledTimes(5);
		});
	});

	describe('cache timers', () => {
		let cache: Cache<string>;
		let strategy: BaseStrategy<string>;
		let cleanupInterval: number;
		let ttl: number;

		beforeEach(() => {
			jest.useFakeTimers();

			cleanupInterval = 10000;
			ttl = 60000;
			strategy = new BaseStrategy<string>();
			cache = CreateStandardCache<string>(
				{
					maxSize: 50,
					ttl,
					cleanupInterval,
				},
				strategy
			);
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should call removeExpiredItems on interval tick', () => {
			const removeSpy = jest.spyOn(cache as any, 'removeExpiredItems');
			expect(removeSpy).not.toHaveBeenCalled();
			const clearCycles = 3;
			const clearCyclesOffset = 0.5;
			const waitTime = cleanupInterval * (clearCycles + clearCyclesOffset);
			jest.advanceTimersByTime(waitTime);
			expect(removeSpy).toHaveBeenCalledTimes(clearCycles);
		});
	});

	describe('cache item ttl/expiration time', () => {
		let cache: Cache<string>;
		let strategy: BaseStrategy<string>;
		let ttl: number;
		let cleanupInterval: number;

		beforeEach(() => {
			jest.useFakeTimers();

			ttl = 60000;
			cleanupInterval = 10000;
			strategy = new BaseStrategy<string>();
			cache = CreateStandardCache<string>(
				{
					maxSize: 50,
					ttl,
					cleanupInterval,
				},
				strategy
			);
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should set expiration time correctly', () => {
			const key = 'key1';
			const value = 'value1';
			const currentTime = Date.now();
			const cacheItem = cache['convertToCacheItem'](key, value, ttl);
			expect(cacheItem).toStrictEqual(
				expect.objectContaining({
					value: value,
					expiry: expect.closeTo(currentTime + ttl),
				})
			);
		});

		it('should not return the item if expired', () => {
			const key = 'key1';
			const value = 'value1';
			const waitTime = ttl + 1000;
			cache.setCacheItem(key, value);
			jest.advanceTimersByTime(waitTime);
			expect(cache.getFromCache(key)).toBeNull();
		});

		it('should remove expired items', () => {
			const key = 'key1';
			const value = 'value1';
			const waitTime = calculateWaitTime(ttl, cleanupInterval);
			const cacheMemory: Map<string, any> = (cache as any).cache;
			cache.setCacheItem(key, value);
			expect(cacheMemory.has(key)).toBe(true);
			expect(cacheMemory.get(key)).toEqual(expect.objectContaining({ value }));
			jest.advanceTimersByTime(waitTime);
			expect(cacheMemory.has(key)).toBe(false);
			expect(cacheMemory.get(key)).not.toEqual(expect.objectContaining({ value }));
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
				},
				strategy
			);

			jest.spyOn(strategy, 'onItemAdded');
			jest.spyOn(strategy, 'onItemExpired');
			jest.spyOn(strategy, 'onItemEvicted');
			jest.spyOn(strategy, 'onItemUsed');
			jest.spyOn(strategy, 'onItemRemoved');
			jest.spyOn(strategy, 'onCacheCleared');
			jest.spyOn(strategy, 'onCacheDisposed');
			// onItemFetched will be tested in Fetchable tests
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should emit an event when an item is added', () => {
			const key = 'key1';
			const value = 'value1';
			cache.setCacheItem(key, value);
			expect(strategy.onItemAdded).toHaveBeenCalledWith(
				expect.objectContaining({
					key: key,
					ttl: ttl,
					currentSize: 1,
					item: expect.objectContaining({
						value: value,
						expiry: expect.any(Number),
					}),
				})
			);
		});

		it('should emit an event when item is expired', () => {
			const key = 'key1';
			const value = 'value1';
			cache.setCacheItem(key, value);
			const waitTime = calculateWaitTime(ttl, cleanupInterval);
			jest.advanceTimersByTime(waitTime);
			expect(strategy.onItemExpired).toHaveBeenCalledWith(
				expect.objectContaining({
					key: key,
					item: value,
					currentSize: 0,
				})
			);
		});

		it('should emit an event when item is evicted', () => {
			const key = (x: number) => `key${x}`;
			const value = (x: number) => `value${x}`;
			for (let i = 1; i <= size + 1; i++) {
				cache.setCacheItem(key(i), value(i));
			}
			expect(strategy.onItemEvicted).toHaveBeenCalledWith(
				expect.objectContaining({
					key: key(1),
					item: value(1),
					currentSize: size - 1,
				})
			);
		});

		it('should emit an event when item is used', () => {
			const key = 'key1';
			const value = 'value1';
			cache.setCacheItem(key, value);
			cache.getFromCache(key);
			expect(strategy.onItemUsed).toHaveBeenCalledWith(
				expect.objectContaining({
					key: key,
					item: value,
					currentSize: 1,
				})
			);
		});

		it('should emit an event when item is removed', () => {
			const key = 'key1';
			const value = 'value1';
			cache.setCacheItem(key, value);
			cache.setCacheItem('key2', 'value2');
			expect(cache.Size).toBe(2);
			cache.removeFromCache(key);
			expect(strategy.onItemRemoved).toHaveBeenCalledWith(
				expect.objectContaining({
					key: key,
					item: value,
					currentSize: 1,
				})
			);
			expect(cache.Size).toBe(1);
			expect(cache.getFromCache(key)).toBeNull();
			expect(cache.getFromCache('key2')).toBe('value2');
		});

		it('should emit an event when cache is cleared', () => {
			for (let i = 1; i <= size; i++) {
				cache.setCacheItem(`key${i}`, `value${i}`);
			}
			expect(cache.Size).toBe(size);
			cache.clearCache();
			expect(strategy.onCacheCleared).toHaveBeenCalledWith(
				expect.objectContaining({
					removedItems: expect.arrayContaining([expect.objectContaining({ value: 'value1', expiry: expect.any(Number) }), expect.objectContaining({ value: 'value2', expiry: expect.any(Number) }), expect.objectContaining({ value: 'value3', expiry: expect.any(Number) })]),
				})
			);
			expect(cache.Size).toBe(0);
		});

		it('should emit an event when cache is disposed', () => {
			cache.dispose();
			expect(strategy.onCacheDisposed).toHaveBeenCalledWith(expect.objectContaining({}));
		});
	});

	describe('cache clear', () => {
		let cache: Cache<string>;

		beforeEach(() => {
			cache = CreateStandardCache<string>({
				maxSize: 50,
				ttl: 60000,
				cleanupInterval: 10000,
			});
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

		it('should reset the timers', () => {
			const before = (cache as any).cleanup;
			expect(before).toBeDefined();
			cache.clearCache();
			const after = (cache as any).cleanup;
			expect(after).toBeDefined();
			// Should create a new interval instance
			expect(after).not.toBe(before);
		});
	});

	describe('cache dispose', () => {
		let cache: Cache<string>;
		let cacheMemory: Map<string, string>;
		let strategy: TCacheStrategy<string>;

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
			cacheMemory = (cache as any).cache as Map<string, any>;
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should set dispose to true', () => {
			expect(cache.IsDisposed).toBe(false);
			cache.dispose();
			expect(cache.IsDisposed).toBe(true);
		});

		it('should clear cleanup interval', () => {
			let interval = (cache as any).cleanup;
			expect(interval).toBeDefined();
			expect(interval).not.toBeNull();
			cache.dispose();
			interval = (cache as any).cleanup;
			expect(interval).toBeNull();
		});

		it('should clear the cache after disposal', () => {
			jest.spyOn(cacheMemory, 'clear');
			cache.setCacheItem('key1', 'value1');
			cache.setCacheItem('key2', 'value2');
			cache.dispose();
			expect(cacheMemory.clear).toHaveBeenCalled();
		});

		it('should not allow to get items after disposal', () => {
			jest.spyOn(strategy, 'getCacheItem');
			cache.dispose();
			cache.getFromCache('key1');
			expect(strategy.getCacheItem).not.toHaveBeenCalled();
		});

		it('should not allow to set items after disposal', () => {
			jest.spyOn(cacheMemory, 'set');
			cache.dispose();
			cache.setCacheItem('key1', 'value1');
			expect(cacheMemory.set).not.toHaveBeenCalled();
		});

		it('should not allow to clear cache after disposal', () => {
			jest.spyOn(cacheMemory, 'clear');
			cache.dispose();
			// dispose itself calls clear
			expect(cacheMemory.clear).toHaveBeenCalledTimes(1);
			cache.clearCache();
			// clearCache normally calls clear - after disposal it should not be called again
			expect(cacheMemory.clear).toHaveBeenCalledTimes(1);
		});

		it('should not allow to dispose cache after disposal (prevent multiple disposals)', () => {
			jest.spyOn(cacheMemory, 'clear');
			cache.dispose();
			// dispose itself calls clear
			expect(cacheMemory.clear).toHaveBeenCalledTimes(1);
			cache.dispose();
			// dispose normally calls clear - after disposal it should not be called again
			expect(cacheMemory.clear).toHaveBeenCalledTimes(1);
		});
	});
});
