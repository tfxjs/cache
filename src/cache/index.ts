import { Cache } from '@src/base/Cache';
import { CacheWithFetcher } from '@src/base/CacheWithFetcher';
import BasicFetcher from '@src/fetchers/BasicFetcher';
import BaseStrategy from '@src/strategies/Base.strategy';
import LRUStrategy from '@src/strategies/LRU.strategy';
import { TCacheOptions, TCacheStrategy, TFetchStrategy } from '@src/types';

export const CreateStandardCache = <ItemType>(options: TCacheOptions, strategy: TCacheStrategy<ItemType> = new BaseStrategy<ItemType>()) => new Cache<ItemType>(options, strategy);
export const CreateFetchableCache = <ItemType>(options: TCacheOptions, strategy: TCacheStrategy<ItemType> = new BaseStrategy<ItemType>(), fetcher: TFetchStrategy<ItemType> = new BasicFetcher<ItemType>()) => new CacheWithFetcher<ItemType>(options, strategy, fetcher);

export const CreateStandardLRUCache = <ItemType>(options: TCacheOptions) => CreateStandardCache<ItemType>(options, new LRUStrategy<ItemType>());
export const CreateFetchableLRUCache = <ItemType>(options: TCacheOptions, fetcher: TFetchStrategy<ItemType>) => CreateFetchableCache<ItemType>(options, new LRUStrategy<ItemType>(), fetcher);
