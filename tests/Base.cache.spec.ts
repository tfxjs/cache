import BasicFetcher from '@src/fetchers/BasicFetcher';
import BaseCache from '@src/strategies/Base.cache';

describe('BaseCache', () => {
	describe('constructor', () => {
		describe('correct initialization', () => {
			it('should initialize with correct options', () => {
				const cache = new BaseCache<string>(
					{
						maxSize: 50,
						ttl: 60,
						cleanupInterval: 10,
					},
					null
				);
				expect(cache.Capacity).toBe(50);
				expect(cache.TimeToLive).toBe(60);
				expect(cache.CleanupInterval).toBe(10);
				expect(cache.Size).toBe(0);
				cache.dispose();
			});

			it('should set interval if cleanupInterval is greater than 0', () => {
				const cache = new BaseCache<string>(
					{
						maxSize: 50,
						ttl: 60,
						cleanupInterval: 10,
					},
					null
				);
				expect(cache.CleanupInterval).toBe(10);
				expect(cache['cleanup']).toBeDefined();
				cache.dispose();
			});

			it('should not set interval if cleanupInterval is 0', () => {
				const cache = new BaseCache<string>(
					{
						maxSize: 50,
						ttl: 60,
						cleanupInterval: 0,
					},
					null
				);
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
				expect(
					() =>
						new BaseCache<string>(
							{
								maxSize: -1,
								ttl: 60,
								cleanupInterval: 10,
							},
							null
						)
				).toThrow();

				expect(
					() =>
						new BaseCache<string>(
							{
								maxSize: 0,
								ttl: 60,
								cleanupInterval: 10,
							},
							null
						)
				).toThrow();
			});

			it('should throw an error if ttl is less than or equal to 0', () => {
				expect(
					() =>
						new BaseCache<string>(
							{
								maxSize: 50,
								ttl: -1,
								cleanupInterval: 10,
							},
							null
						)
				).toThrow();

				expect(
					() =>
						new BaseCache<string>(
							{
								maxSize: 50,
								ttl: 0,
								cleanupInterval: 10,
							},
							null
						)
				).toThrow();
			});

			it('should throw an error if cleanupInterval is less than 0', () => {
				expect(
					() =>
						new BaseCache<string>(
							{
								maxSize: 50,
								ttl: 60,
								cleanupInterval: -1,
							},
							null
						)
				).toThrow();
			});
		});
	});

	describe('no fetcher defined', () => {
		// No fetcher = Manual cache, not implemented yet
		let cache: BaseCache<string>;

		beforeEach(() => {
			cache = new BaseCache<string>(
				{
					maxSize: 50,
					ttl: 60,
					cleanupInterval: 10,
				},
				null
			);

			jest.spyOn(cache, 'evict');
		});

		afterEach(() => {
			cache.dispose();
		});

		it('should be true', () => {
			expect(true).toBe(true);
		});
	});

	describe('with fetcher defined', () => {
		let cache: BaseCache<string>;
		let fetcher: BasicFetcher<string>;

		beforeEach(() => {
			fetcher = new BasicFetcher();
			cache = new BaseCache<string>(
				{
					maxSize: 50,
					ttl: 60,
					cleanupInterval: 10,
				},
				fetcher
			);

			jest.spyOn(fetcher, 'fetch');
			jest.spyOn(cache, 'evict');
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

		describe('cache size', () => {
			it('should not exceed max size', async () => {
				for (let i = 1; i <= 55; i++) {
					fetcher.setReturnValue(`key${i}`, `value${i}`);
					await cache.getOrFetch(`key${i}`);
				}
				expect(cache.Size).toBe(50);
			});

			it('should invoke evict when max size exceeded', async () => {
				for (let i = 1; i <= 55; i++) {
					fetcher.setReturnValue(`key${i}`, `value${i}`);
					await cache.getOrFetch(`key${i}`);
				}
				expect(cache['evict']).toHaveBeenCalledTimes(5);
			});
		});
	});
});

/*
Obsługa TTL i wygasania
Czy element wygasa po upływie TTL?
Czy po wygaśnięciu element jest usuwany i nie jest zwracany przez cache?

Obsługa cleanupInterval
Czy automatyczne czyszczenie usuwa wygasłe elementy po zadanym czasie?

Zachowanie po dispose
Czy po wywołaniu dispose() cache nie pozwala na żadne operacje (getOrFetch, setCacheItem, itp.)?

Zachowanie przy fetchStrategy = null
Czy cache poprawnie zwraca null i nie rzuca błędu, gdy nie ma fetchera?

Poprawność metody clear
Czy clear() usuwa wszystkie elementy i resetuje licznik?

Wielokrotne wywołanie dispose/clear
Czy wielokrotne wywołanie dispose() lub clear() nie powoduje błędów?

Zachowanie przy próbie pobrania nieistniejącego klucza
Czy zwracane jest null i nie jest wywoływany fetcher, jeśli fetchStrategy to null?

Poprawność działania evict
Czy po przekroczeniu maxSize wywoływana jest metoda evict()?

Równoległe wywołania getOrFetch
Czy cache poprawnie obsługuje równoległe pobrania tego samego klucza?
*/
