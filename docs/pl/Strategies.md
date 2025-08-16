## Strategie

Powrót to głównego pliku [`Readme`](./../../Readme_PL.md)

### Interfejs podstawowy
```ts
export type TCacheStrategy<T> = {
	getCacheItem(cache: CacheMemory<T>, key: string): T | null;
	getItemKeyToEvict(cache: CacheMemory<T>): string | null;
};
```

Możesz opcjonalnie implementować interfejsy hooków:
`OnItemAdded`, `OnItemFetched`, `OnItemUsed`, `OnItemExpired`, `OnItemEvicted`, `OnCacheCleared`.

### Wbudowane
| Strategia | Zachowanie | Złożoność get/set (≈) |
|-----------|------------|------------------------|
| BaseStrategy | FIFO – usuwa pierwszy klucz | O(1) |
| LRUStrategy | Least Recently Used – przenosi użyty wpis na koniec | O(1) |

### Implementacja hooków
Hook wywoływany tylko jeśli metoda istnieje w obiekcie strategii (duck typing). Brak metody = brak kosztu.

Przykład wielohookowy:
```ts
class VerboseStrategy<T> implements TCacheStrategy<T>, OnItemAdded<T>, OnItemEvicted<T> {
	getCacheItem(cache: CacheMemory<T>, key: string) { return cache.get(key)?.value ?? null; }
	getItemKeyToEvict(cache: CacheMemory<T>) { return cache.keys().next().value || null; }
	onItemAdded(e: ItemAddedEventData<T>) { console.log('ADD', e.key); }
	onItemEvicted(e: ItemEvictedEventData<T>) { console.log('EVICT', e.key); }
}
```

### Kompozycja strategii
Możesz owinąć jedną strategię inną przekazując delegata i rozszerzać tylko hooki.

### Własna strategia – przykład
```ts
class RandomEvictStrategy<T> implements TCacheStrategy<T> {
	getCacheItem(cache: CacheMemory<T>, key: string) { return cache.get(key)?.value ?? null; }
	getItemKeyToEvict(cache: CacheMemory<T>) {
		const keys = Array.from(cache.keys());
		return keys.length ? keys[Math.floor(Math.random()*keys.length)] : null;
	}
}
```
