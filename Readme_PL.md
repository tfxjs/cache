<div align="center">
	<h1>@tfxjs/cache</h1>
	<p>Lekka, rozszerzalna, typowana biblioteka cache dla TypeScript / Node.js. <br/>TTL · limit rozmiaru · strategie (LRU / własne) · fetchowanie brakujących danych · hooki zdarzeń.</p>
</div>

> English version: [`Readme.md`](./Readme.md) and [`docs/en/*`](./docs/en/).

## Opis

@tfxjs/cache to minimalistyczny rdzeń cache + warstwa rozszerzalności:

- Limit rozmiaru + wymuszone usuwanie (strategia: Base / LRU / custom)
- TTL (globalny lub per‑item) + opcjonalny background cleanup
- Tryb fetchowania braków (`CacheWithFetcher` / fabryki `CreateFetchable*`)
- Typowane zdarzenia kierowane do hooków w strategii (bez globalnego emittera)
- Proste API, łatwe do testowania (strategia i fetcher wstrzykiwane)

## Instalacja

```bash
npm install @tfxjs/cache
# lub
yarn add @tfxjs/cache
```

## Szybki przykład

```ts
import { CreateStandardLRUCache } from '@tfxjs/cache';

const cache = CreateStandardLRUCache<string>({ maxSize: 100, ttl: 30_000, cleanupInterval: 5_000 });
cache.setCacheItem('user:1', 'Jan');
console.log(cache.getFromCache('user:1')); // Jan
cache.dispose(); // Wyłączenie timerów, w celu ponownego użycia należy utworzyć cache jeszcze raz
```

Fetcher + LRU:

```ts
import { CreateFetchableLRUCache, TFetchStrategy } from '@tfxjs/cache';

class UserFetcher implements TFetchStrategy<string> {
	async fetch(key: string) {
		return key === 'u:1' ? 'Jan' : null;
	}
}

const cache = CreateFetchableLRUCache<string>({ maxSize: 50, ttl: 20_000 }, new UserFetcher());
await cache.getOrFetch('u:1');
```

## Dokumentacja

Pełna dokumentacja (opcje, eventy, strategie, fetchery, przykłady) znajduje się w katalogu `docs/`:

| Sekcja                                    | Plik                                               |
| ----------------------------------------- | -------------------------------------------------- |
| Rdzeń cache (API, opcje, events)          | [`docs/pl/Cache.md`](./docs/pl/Cache.md)           |
| Strategie (interfejs, hooki, LRU, własne) | [`docs/pl/Strategies.md`](./docs/pl/Strategies.md) |
| Fetchery (interfejs, przykłady)           | [`docs/pl/Fetchers.md`](./docs/pl/Fetchers.md)     |

## Licencja

MIT © tfxjs

---

cs/pl/Fetchers.md) |

## Licencja

MIT © tfxjs

---

etchers.md) |

## Licencja

MIT © tfxjs

---

etchers.md) |

## Licencja

MIT © tfxjs

---

etchers.md) |

## Licencja

MIT © tfxjs

---

etchers.md) |

## Licencja

MIT © tfxjs

---

Sugestie / błędy? Otwórz issue lub PR. Miłej zabawy z cache! 🧠
