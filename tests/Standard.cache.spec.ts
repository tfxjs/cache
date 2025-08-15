import { Cache } from '@src/base/Cache';
import { CreateStandardCache } from '@src/cache';
import BaseStrategy from '@src/strategies/Base.strategy';

describe('Standard Cache', () => {
	describe('constructor', () => {
		describe('correct initialization', () => {
			it('should initialize with correct options', () => {
				const cache = CreateStandardCache<string>({
					maxSize: 50,
					ttl: 60,
					cleanupInterval: 10,
				});
				expect(cache.Capacity).toBe(50);
				expect(cache.TimeToLive).toBe(60);
				expect(cache.CleanupInterval).toBe(10);
				expect(cache.Size).toBe(0);
				cache.dispose();
			});

			it('should set interval if cleanupInterval is greater than 0', () => {
				const cache = CreateStandardCache<string>({
					maxSize: 50,
					ttl: 60,
					cleanupInterval: 10,
				});
				expect(cache.CleanupInterval).toBe(10);
				expect(cache['cleanup']).toBeDefined();
				cache.dispose();
			});

			it('should not set interval if cleanupInterval is 0', () => {
				const cache = CreateStandardCache<string>({
					maxSize: 50,
					ttl: 60,
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
						ttl: 60,
						cleanupInterval: 10,
					})
				).toThrow();

				expect(() =>
					CreateStandardCache<string>({
						maxSize: 0,
						ttl: 60,
						cleanupInterval: 10,
					})
				).toThrow();
			});

			it('should throw an error if ttl is less than or equal to 0', () => {
				expect(() =>
					CreateStandardCache<string>({
						maxSize: 50,
						ttl: -1,
						cleanupInterval: 10,
					})
				).toThrow();

				expect(() =>
					CreateStandardCache<string>({
						maxSize: 50,
						ttl: 0,
						cleanupInterval: 10,
					})
				).toThrow();
			});

			it('should throw an error if cleanupInterval is less than 0', () => {
				expect(() =>
					CreateStandardCache<string>({
						maxSize: 50,
						ttl: 60,
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
					ttl: 60,
					cleanupInterval: 10,
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

	describe('cache ttl', () => {
		it('should be defined', () => {
			expect(true).toBe(true);
		});
	});
});
