## Cache – rdzeń

Powrót to głównego pliku [`Readme`](./../../Readme_PL.md)

### Opcje

| Pole              | Typ       | Domyślna   | Opis                                        |
| ----------------- | --------- | ---------- | ------------------------------------------- |
| `maxSize`         | `number`  | `Infinity` | Maksymalna liczba elementów                 |
| `ttl`             | `number`  | `0`        | TTL w ms (`0` = brak wygaszania)            |
| `cleanupInterval` | `number`  | `0`        | Interwał w ms dla usuwania wygasłych wpisów |
| `debugMode`       | `boolean` | `false`    | Rezerwowane na logi                         |
| `customName`      | `string`  | losowy     | Nazwa instancji                             |

Per‑item TTL przez trzeci parametr `overrideTTL` w `setCacheItem(key, value, ttlMs)`.

### Podstawowe metody

| Metoda                                   | Opis                                             |
| ---------------------------------------- | ------------------------------------------------ |
| `setCacheItem(key, value, overrideTTL?)` | Dodaje / nadpisuje wartość (evict jeśli limit)   |
| `getFromCache(key)`                      | Zwraca wartość lub `null` (także gdy wygasła)    |
| `clearCache()`                           | Usuwa wszystkie wpisy (emituje `CACHE_CLEARED`)  |
| `dispose()`                              | Czyści timery / oznacza instancję jako zamkniętą |

### Zdarzenia (definicje)

`ITEM_ADDED`, `ITEM_FETCHED`, `ITEM_USED`, `ITEM_EXPIRED`, `ITEM_EVICTED`, `CACHE_CLEARED`.

Payloady (skrót):

- ADDED / FETCHED: `{ key, item: { value, expiry }, ttl, currentSize }`
- USED / EXPIRED / EVICTED: `{ key, item /* surowa wartość */, currentSize }`
- CACHE_CLEARED: `{ removedItems: Array<{ value, expiry }> }`

Emitowane tylko jeśli strategia implementuje odpowiedni interfejs hooka.

### Cykl życia wartości

1. `setCacheItem` -> zapis + (opcjonalny) eviction + event ADDED
2. `getFromCache` -> sprawdzenie wygaśnięcia -> (lazy remove + EXPIRED) -> event USED (jeśli zwrócono wartość)
3. `getOrFetch` (wariant fetchera) -> jeśli miss -> fetch -> zapis -> event FETCHED
4. `cleanupInterval` (jeśli >0) okresowo usuwa wygasłe -> event EXPIRED per wpis

### Debugowanie

Pole `debugMode` zarezerwowane (możesz dodać własne logi w forku lub strategii).
