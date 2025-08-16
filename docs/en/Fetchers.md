## Fetchers

Return to main [`Readme`](./../../Readme.md) file

### Interface
```ts
export type TFetchStrategy<T> = { fetch(key: string): Promise<T | null> };
```

### Default BasicFetcher
In‑memory map; useful for deterministic tests (manually preset values).

### Custom API Fetcher Example
```ts
class ApiFetcher implements TFetchStrategy<string> {
  async fetch(key: string) {
    const res = await fetch(`https://example.com/data/${key}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.value ?? null;
  }
}
```

### Usage with LRU
```ts
const cache = CreateFetchableLRUCache<string>({ maxSize: 50, ttl: 20_000 }, new ApiFetcher());
await cache.getOrFetch('user:1');
```

### Guidance
* Do not throw for a miss – return `null`.
* Add retries / circuit breaker outside and inject a resilient fetcher.
* Batch (multi key) fetch planned.
