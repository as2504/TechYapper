---
slug: embeddings-vector-db
title: Embeddings and vector databases
topic: ai
difficulty: intermediate
minutes: 6
pro: true
related: rag, llm-tokens, sql-indexes
---
::dek
Turn meaning into coordinates, then search by distance. The quiet idea behind semantic search, recommendations and almost every RAG system.

::hook
Search "my card got declined" in a classic keyword engine and you miss the help article titled "Payment failures". Same meaning, zero shared words. Embeddings fix this by turning text into points in space where *meaning* is distance. Vector databases are what you get when you need to search millions of those points in milliseconds.

::yap
An embedding turns text into a list of numbers where similar meanings land close together. A vector database is just a very fast way to find the nearest neighbours.

::basics
An **embedding** is a list of numbers (a **vector**) that represents the meaning of a piece of text — or an image, or audio. Typical embedding models produce vectors with hundreds to a few thousand numbers.

The magic property: **similar meanings produce nearby vectors**.

```text
"reset my password"      → [0.12, -0.48, 0.33, …]
"I can't log in"          → [0.10, -0.45, 0.31, …]   ← close
"best biryani in Hyderabad" → [-0.71, 0.22, 0.05, …]  ← far away
```

To search:

1. Embed all your documents once and store the vectors.
2. When a query arrives, embed it with the **same model**.
3. Find the stored vectors closest to the query vector.

That's **semantic search**. A **vector database** (or a vector extension like pgvector for Postgres) stores the vectors and finds nearest neighbours quickly.

"Closeness" is usually measured with **cosine similarity** — how much two vectors point in the same direction.

::hood
### Where the numbers come from

Embedding models are neural networks (often transformer encoders) trained so that related pairs — a question and its answer, a caption and its image — end up close and unrelated pairs end up far apart (**contrastive learning**). The individual dimensions aren't human-readable; meaning lives in the geometry.

### Distance metrics

- **Cosine similarity**: angle between vectors; ignores length. The common default for text.
- **Dot product**: equals cosine when vectors are normalised to length 1 — many models output normalised vectors for this reason.
- **Euclidean (L2) distance**: straight-line distance.

Use the metric the model was trained for.

### Why you can't just scan

Comparing a query against 10 million 1,536-dimensional vectors is billions of multiplications per search. Exact search doesn't scale, so vector databases use **approximate nearest neighbour (ANN)** indexes, trading a little accuracy (recall) for huge speed-ups.

### Postgres can do this

```sql
create extension vector;
create table docs (id bigint primary key, body text, embedding vector(1536));
create index on docs using hnsw (embedding vector_cosine_ops);

select id, body from docs
order by embedding <=> $1   -- cosine distance to the query vector
limit 5;
```

For many apps, pgvector inside an existing Postgres (including Supabase) beats running a separate vector database.

::deep
### ANN index families

- **HNSW** (Hierarchical Navigable Small World): a multi-layer graph; search hops from coarse to fine layers. Excellent recall and speed, higher memory use and slower builds. Tunables: `m` (connections per node), `ef_construction`, `ef_search`.
- **IVF** (inverted file): cluster vectors into lists with k-means; search only the nearest few lists (`probes`). Faster to build, needs training data, recall depends on probes.
- **Product quantisation** and other compression: store vectors in fewer bytes to fit billions in memory, at some precision cost.

### Filtering is the hard part

"Nearest neighbours **where tenant_id = 42 and published = true**" is surprisingly tricky. Post-filtering after ANN search can return too few results; pre-filtering can defeat the index. Approaches include filtered HNSW variants, partitioning per tenant, and iterative scans (pgvector added iterative index scans in 0.8 for exactly this).

### Hybrid search

Embeddings are weak at exact identifiers: error codes, SKUs, names. Production systems usually combine **BM25 keyword search** with vector search and merge results (for example with Reciprocal Rank Fusion), often followed by a **re-ranker** model that scores the top candidates more precisely.

### Practical gotchas

- **Never mix models**: vectors from different embedding models (or versions) aren't comparable. Changing models means re-embedding everything.
- **Chunk size matters**: embedding a 30-page PDF as one vector blurs everything together; chunks of a few hundred tokens with context work better.
- **Dimensions cost money**: storage and memory scale with dimension × rows. Some models support shortened ("Matryoshka") embeddings with small quality loss.

::myths
- Vector databases understand meaning || The embedding model encodes meaning. The database only does fast geometry.
- You need a dedicated vector database || For millions of vectors, pgvector in Postgres is often enough and keeps data in one place.
- Semantic search replaces keyword search || It complements it. Exact terms like codes and names still need keyword matching.

::facts
- Word2Vec (2013) popularised the famous example where vector("king") − vector("man") + vector("woman") lands near vector("queen").
- HNSW was described by Yury Malkov and Dmitry Yashunin in 2016 and is now the most widely used ANN index.

::realworld
- Semantic search over docs and support tickets.
- "Similar items" recommendations in e-commerce and content apps.
- The retrieval step of RAG chatbots.
- De-duplicating near-identical records and clustering feedback by theme.

::check
You switch to a newer, better embedding model for new documents but keep the old vectors for existing ones. What happens to search quality?
- [ ] It improves across the board
- [x] It breaks — vectors from different models live in different spaces and can't be meaningfully compared
- [ ] Nothing changes, because cosine similarity normalises differences
- [ ] Only the number of dimensions needs to match
> Each model learns its own geometry. Comparing a query from model B against documents from model A is like comparing coordinates from two different maps. Re-embed everything when you switch.
