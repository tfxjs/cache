## Cache Core

Return to main [`Readme`](./../../Readme.md) file

### Options

| Field             | Type      | Default    | Description                                    |
| ----------------- | --------- | ---------- | ---------------------------------------------- |
| `maxSize`         | `number`  | `Infinity` | Maximum number of entries                      |
| `ttl`             | `number`  | `0`        | TTL in ms (`0` = never expires)                |
| `cleanupInterval` | `number`  | `0`        | Background sweep interval in ms (0 = disabled) |
| `debugMode`       | `boolean` | `false`    | Reserved for future debug logging              |
| `customName`      | `string`  | random     | Instance name (useful for logging)             |

Per‑item TTL: third argument `overrideTTL` in `setCacheItem(key, value, ttlMs)`.

### Core Methods

| Method                                   | Description                                        |
| ---------------------------------------- | -------------------------------------------------- |
| `setCacheItem(key, value, overrideTTL?)` | Insert / overwrite (evicts if size limit exceeded) |
| `getFromCache(key)`                      | Returns value or `null` (also `null` if expired)   |
| `clearCache()`                           | Removes all entries (emits `CACHE_CLEARED`)        |
| `dispose()`                              | Clears timers and marks cache as disposed          |

### Events

`ITEM_ADDED`, `ITEM_FETCHED`, `ITEM_USED`, `ITEM_EXPIRED`, `ITEM_EVICTED`, `CACHE_CLEARED`.

Payload (short form):

- ADDED / FETCHED: `{ key, item: { value, expiry }, ttl, currentSize }`
- USED / EXPIRED / EVICTED: `{ key, item /* raw value */, currentSize }`
- CACHE_CLEARED: `{ removedItems: Array<{ value, expiry }> }`

Events are routed only to strategy hook methods that exist (duck typing) – no global emitter.

### Value Lifecycle

1. `setCacheItem` -> store + possible eviction -> ADDED
2. `getFromCache` -> expiry check -> (optional lazy removal + EXPIRED) -> USED
3. `getOrFetch` (fetchable variant) -> miss -> fetch -> store -> FETCHED
4. `cleanupInterval` (if >0) -> periodic expiry sweep -> EXPIRED per removed item

### Disposal

Always call `dispose()` in tests or when the cache lifetime ends to clear intervals.

### Debug Mode

`debugMode` currently reserved (implement custom logging in a wrapper strategy if needed).
