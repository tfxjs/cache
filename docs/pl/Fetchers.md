## Fetchery

Powrót to głównego pliku [`Readme`](./../../Readme_PL.md)

### Interfejs
```ts
export type TFetchStrategy<T> = { fetch(key: string): Promise<T | null> };
```

### Domyślny BasicFetcher
Prosty magazyn w pamięci użyteczny w testach (ustawiasz zwracane wartości manualnie).

### Przykład custom fetchera (API)
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

### Użycie z LRU
```ts
const cache = CreateFetchableLRUCache<string>({ maxSize: 50, ttl: 20_000 }, new ApiFetcher());
await cache.getOrFetch('user:1');
```

### Wskazówki
* Fetcher nie powinien rzucać – zwracaj `null` dla braku danych.
* Możesz dodać warstwę retry/circuit breaker poza fetcherem i przekazać już resilientny adapter.
* Do masowych pobrań (batch) – planowane rozszerzenie (zob. roadmapa).
