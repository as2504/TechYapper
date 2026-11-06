---
slug: caching-strategies
title: Caching, and the two hard things
topic: system-design
difficulty: intermediate
minutes: 7
pro: true
related: sql-indexes, rest-idempotency, cors
---
::dek
A cache is a bet that the past predicts the future. Here's how to place that bet — and what to do when the data changes underneath you.

::hook
"There are only two hard things in computer science: cache invalidation and naming things." It's a joke, but every senior engineer has a war story behind it: the stale price, the user who saw someone else's dashboard, the midnight outage when every cache key expired at once. Caching is the most powerful performance tool you have, and the easiest to get subtly wrong.

::yap
Caching is easy; knowing when cached data is wrong is the hard part. Every cache design is really an answer to "how stale is acceptable?"

::basics
A **cache** stores the result of expensive work — a database query, an API call, a rendered page — so the next request can reuse it.

You meet caches everywhere:

- **Browser cache**: images, scripts and stylesheets reused between page loads.
- **CDN**: copies of your static files on servers close to users (Mumbai users get files from Mumbai, not Virginia).
- **Application cache**: Redis or Memcached holding query results.
- **Database cache**: Postgres keeps hot data pages in memory.

Two numbers describe a cache:

- **Hit rate**: how often the answer is already in the cache.
- **Staleness**: how out-of-date a cached answer might be.

The simplest freshness rule is a **TTL** (time to live): "keep this for 10 minutes, then fetch again". Simple, but for those 10 minutes, users might see old data.

::hood
### Read strategies

- **Cache-aside (lazy loading)**: the app checks the cache; on a miss it reads the database and writes the result to the cache. The most common pattern.

```js
async function getProduct(id) {
  const hit = await redis.get(`product:${id}`)
  if (hit) return JSON.parse(hit)
  const product = await db.products.find(id)
  await redis.set(`product:${id}`, JSON.stringify(product), { EX: 600 })
  return product
}
```

- **Read-through**: the cache library itself loads from the database on a miss.

### Write strategies

- **Write-through**: write to cache and database together. Cache is always fresh; writes are slower.
- **Write-behind (write-back)**: write to cache, persist to the database asynchronously. Fast writes, risk of data loss.
- **Invalidate on write**: update the database, then **delete** the cache key so the next read reloads it. Often safer than updating the cached value, which can race with concurrent writers.

### Eviction

Caches have limited memory. When full, they evict entries — usually **LRU** (least recently used) or **LFU** (least frequently used). Redis offers both, approximately, for speed.

### HTTP caching headers

```http
Cache-Control: public, max-age=31536000, immutable   # hashed JS/CSS files
Cache-Control: no-cache                              # revalidate HTML every time
ETag: "v42"                                          # enables 304 Not Modified
```

Fingerprinted asset filenames (`app.3f9c2a.js`) let you cache "forever" — a new deploy simply references a new filename.

::deep
### Cache stampede (thundering herd)

A hot key expires and thousands of concurrent requests miss at once, all hitting the database. Defences:

- **Request coalescing / single-flight**: one request recomputes while others wait for its result.
- **Stale-while-revalidate**: serve the stale value immediately and refresh in the background.
- **Jittered TTLs**: add randomness so keys created together don't expire together.
- **Early probabilistic refresh**: refresh slightly before expiry with increasing probability as expiry nears.

### Consistency traps

- **Race on invalidation**: request A reads old data from the DB, request B writes new data and deletes the key, then A writes the *old* data into the cache. Short TTLs, versioned keys, or delayed double-delete reduce the window.
- **Personalised data in shared caches**: caching a response that depends on the user's cookie at a CDN without `Cache-Control: private` or a correct `Vary` header can leak one user's page to another. This has caused real incidents.
- **Negative caching**: caching "not found" protects the DB from repeated misses (and enumeration attacks) but can hide newly created records.

### Where to cache

Each layer has different trade-offs: in-process memory is fastest but isn't shared between instances and is lost on deploy; Redis is shared but adds a network hop; a CDN offloads the most but is hardest to invalidate precisely. Many systems use a small in-process cache in front of Redis in front of the database.

### Measure before you cache

Caching hides problems — a missing index, an N+1 query — behind a hit rate. When the cache is cold (after a deploy, a flush, a new region), the hidden problem returns at the worst moment. Fix the underlying query when you can; cache what's still expensive.

::myths
- Caching always makes things faster || A low hit rate adds latency and complexity. And cold caches can cause outages if the backend can't handle the load.
- Updating the cached value on write is safer than deleting it || Concurrent writers can leave stale values; deleting and reloading is usually more robust.
- TTL alone keeps data correct || TTL bounds staleness. It doesn't prevent it.

::facts
- The "two hard things" quote is attributed to Phil Karlton, an engineer at Netscape.
- Redis began in 2009 as a side project by Salvatore Sanfilippo to scale a real-time analytics product.

::realworld
- CDNs serving hashed JavaScript bundles with year-long cache lifetimes.
- Redis caching session data, rate-limit counters and expensive aggregates.
- `stale-while-revalidate` in HTTP and in data libraries like SWR and TanStack Query.

::check
A CDN caches `/dashboard`, whose HTML depends on the logged-in user's cookie. The response has `Cache-Control: public, max-age=300`. What's the risk?
- [ ] The dashboard will load slower
- [x] One user's personalised page can be served to other users for up to 5 minutes
- [ ] The CDN will refuse to cache it
- [ ] Cookies will be deleted
> `public` tells shared caches they may store and reuse the response for anyone. Personalised responses need `private` (or `no-store`) or a cache key that includes the user, otherwise data leaks between users.
