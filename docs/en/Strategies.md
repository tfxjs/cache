## Strategies

Return to main [`Readme`](./../../Readme.md) file

### Basic Interface

```ts
export type TCacheStrategy<T> = {
	getCacheItem(cache: CacheMemory<T>, key: string): T | null;
	getItemKeyToEvict(cache: CacheMemory<T>): string | null;
};
```

Optional hook interfaces (implement any subset):
`OnItemAdded`, `OnItemFetched`, `OnItemUsed`, `OnItemExpired`, `OnItemEvicted`, `OnCacheCleared`.

### Built‑ins

| Strategy     | Behavior                                              | get/set complexity (≈) |
| ------------ | ----------------------------------------------------- | ---------------------- |
| BaseStrategy | FIFO – evicts the first inserted key                  | O(1)                   |
| LRUStrategy  | Least Recently Used – moves accessed entry to the end | O(1)                   |

### Hooks Execution

Hooks are invoked only if the corresponding method exists (duck typing). No method = no overhead.

Example with multiple hooks:

```ts
class VerboseStrategy<T> implements TCacheStrategy<T>, OnItemAdded<T>, OnItemEvicted<T> {
	getCacheItem(cache: CacheMemory<T>, key: string) {
		return cache.get(key)?.value ?? null;
	}
	getItemKeyToEvict(cache: CacheMemory<T>) {
		return cache.keys().next().value || null;
	}
	onItemAdded(e: ItemAddedEventData<T>) {
		console.log('ADD', e.key);
	}
	onItemEvicted(e: ItemEvictedEventData<T>) {
		console.log('EVICT', e.key);
	}
}
```

### Strategy Composition

Wrap another strategy instance and delegate core methods while adding hook behavior.

### Custom Strategy Example

```ts
class RandomEvictStrategy<T> implements TCacheStrategy<T> {
	getCacheItem(cache: CacheMemory<T>, key: string) {
		return cache.get(key)?.value ?? null;
	}
	getItemKeyToEvict(cache: CacheMemory<T>) {
		const keys = Array.from(cache.keys());
		return keys.length ? keys[Math.floor(Math.random() * keys.length)] : null;
	}
}
```
