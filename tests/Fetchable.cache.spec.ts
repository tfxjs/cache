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
				ttl: 60,
				cleanupInterval: 10,
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
});
