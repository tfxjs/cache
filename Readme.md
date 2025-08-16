<div align="center">
	<h1>@tfxjs/cache</h1>
	<p>Lightweight, extensible, fully typed in‑memory cache for TypeScript / Node.js.<br/> TTL · size limit · pluggable strategies (LRU / custom) · fetch missing values · typed event hooks.</p>
</div>

> Polska wersja: [`Readme_PL.md`](./Readme_PL.md) oraz [`docs/pl/*`](./docs/pl/).

## Overview
@tfxjs/cache = minimal core + extension surface:
* Size limit & strategy eviction (Base / LRU / custom)
* Global & per‑item TTL + optional background cleanup
* Fetchable mode (`CreateFetchable*` factories) for automatic miss fill
* Strongly typed events mapped to optional strategy hook methods
* Simple, testable, no global emitter overhead

## Install
```bash
npm install @tfxjs/cache
# or
yarn add @tfxjs/cache
```

## Quick Example
```ts
import { CreateStandardLRUCache } from '@tfxjs/cache';

const cache = CreateStandardLRUCache<string>({ maxSize: 100, ttl: 30_000, cleanupInterval: 5_000 });
cache.setCacheItem('user:1', 'John');
console.log(cache.getFromCache('user:1')); // John
cache.dispose(); // stops background timers; create a new instance to use cache again
```

Fetcher + LRU:
```ts
import { CreateFetchableLRUCache, TFetchStrategy } from '@tfxjs/cache';

class UserFetcher implements TFetchStrategy<string> {
	async fetch(key: string) { return key === 'u:1' ? 'John' : null; }
}

const cache = CreateFetchableLRUCache<string>({ maxSize: 50, ttl: 20_000 }, new UserFetcher());
await cache.getOrFetch('u:1');
```

## Documentation
See detailed docs under `docs/en/`:

| Section | File |
|---------|------|
| Core (API, options, events) | [`docs/en/Cache.md`](./docs/en/Cache.md) |
| Strategies (interface, hooks, LRU, custom) | [`docs/en/Strategies.md`](./docs/en/Strategies.md) |
| Fetchers (interface, examples) | [`docs/en/Fetchers.md`](./docs/en/Fetchers.md) |

## License
MIT © tfxjs

---
Questions / ideas? Open an issue or PR. Enjoy caching! 🧠
