import { CacheWithFetcher } from '@src/base/CacheWithFetcher';
import { CreateFetchableCache } from '@src/cache';
import BasicFetcher from '@src/fetchers/BasicFetcher';
import BaseStrategy from '@src/strategies/Base.strategy';

describe('Fetchable Cache', () => {
	let cache: CacheWithFetcher<string>;
	let strategy: BaseStrategy<string>;
	let fetcher: BasicFetcher<string>;

	beforeEach(() => {
		fetcher = new BasicFetcher();
		strategy = new BaseStrategy<string>();
		cache = CreateFetchableCache<string>(
			{
				maxSize: 50,
				ttl: 6000,
				cleanupInterval: 1000,
			},
			strategy,
			fetcher
		);

		jest.spyOn(fetcher, 'fetch');
		jest.spyOn(strategy, 'getItemKeyToEvict');
	});

	afterEach(() => {
		fetcher.clearReturnValues();
		cache.dispose();
	});

	describe('cache events', () => {
		it('should emit an event when an item is fetched', async () => {
			jest.spyOn(strategy, 'onItemFetched');

			const key = 'key1';
			const value = 'value1';
			fetcher.setReturnValue(key, value);
			await cache.getOrFetch(key);
			expect(strategy.onItemFetched).toHaveBeenCalledWith(
				expect.objectContaining({
					key: key,
					item: expect.objectContaining({
						value: value,
						expiry: expect.any(Number),
					}),
				})
			);
		});
	});

	describe('fetching', () => {
		it('should try to fetch value if not in cache', async () => {
			const value = await cache.getOrFetch('key1');
			expect(value).toBeNull();
			expect(fetcher['fetch']).toHaveBeenCalledWith('key1');
		});

		it('should resolve fetched value if not in cache', async () => {
			fetcher.setReturnValue('key1', 'value1');
			const value = await cache.getOrFetch('key1');
			expect(value).toBe('value1');
			expect(cache.Size).toBe(1);
		});

		it('should not fetch value if in cache', async () => {
			// arrange
			fetcher.setReturnValue('key1', 'value1');
			const value1a = await cache.getOrFetch('key1');
			// act
			const value1b = await cache.getOrFetch('key1');
			// assert
			expect(value1a).toBe('value1');
			expect(value1b).toBe('value1');
			expect(fetcher['fetch']).toHaveBeenCalledTimes(1);
		});
	});

	describe('prevent duplicate requests', () => {
		it('should send only one fetch request for the same key', async () => {
			jest.spyOn(cache, 'getOrFetch');
			jest.spyOn(fetcher, 'fetch');

			jest.useFakeTimers();
			const timeout = 1000;

			fetcher.setReturnValue('key1', 'value1', timeout);
			fetcher.setReturnValue('key2', 'value2', timeout);

			const fetchPromise1 = cache.getOrFetch('key1');
			jest.advanceTimersByTime(timeout / 2);
			await Promise.resolve();

			const fetchPromise2 = cache.getOrFetch('key2');
			jest.advanceTimersByTime(timeout);
			await Promise.resolve();

			jest.runOnlyPendingTimers();
			await Promise.resolve();

			expect(await fetchPromise1).toBe('value1');
			expect(await fetchPromise2).toBe('value2');

			expect(cache.getOrFetch).toHaveBeenCalledTimes(2);
			expect(fetcher['fetch']).toHaveBeenCalledTimes(2);

			jest.useRealTimers();
		});

		it('should not send duplicate fetch requests for the same key', async () => {
			jest.spyOn(cache, 'getOrFetch');
			jest.spyOn(fetcher, 'fetch');

			jest.useFakeTimers();
			const timeout = 1000;

			fetcher.setReturnValue('key1', 'value1', timeout);

			const fetchPromise1 = cache.getOrFetch('key1');
			jest.advanceTimersByTime(timeout / 2); // Advance fetcher setTimeout (fetch method)
			await Promise.resolve(); // Next tick for microtask (set request to requestMap @ cache)
			const fetchPromise2 = cache.getOrFetch('key1');

			jest.advanceTimersByTime(timeout); // As same as above
			await Promise.resolve(); // As same as above

			jest.runOnlyPendingTimers();
			await Promise.resolve();

			expect(await fetchPromise1).toBe('value1');
			expect(await fetchPromise2).toBe('value1');

			expect(cache.getOrFetch).toHaveBeenCalledTimes(2);
			expect(fetcher['fetch']).toHaveBeenCalledTimes(1);

			jest.useRealTimers();
		});
	});
});
