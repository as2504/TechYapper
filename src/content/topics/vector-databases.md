---
slug: vector-databases
title: Vector databases
category: ai
aliases: vector DB, embeddings, pgvector, Pinecone, Weaviate, Qdrant, similarity search, semantic search, ANN
tagline: Databases that find things by meaning, by storing embeddings and searching for the nearest ones.
level: intermediate
minutes: 4
concepts: embeddings-vector-db, rag
related: rag, llms, postgresql
popular: false
---
::what
A vector database stores **embeddings**, which are lists of numbers that represent the meaning of text, images or other data. It's built to answer one question fast: "which stored items are closest to this one?" That lets you search by meaning instead of exact words.

::why
Keyword search fails when people use different words for the same thing. "Laptop won't turn on" and "notebook doesn't power up" share no keywords. Embedding models place them close together in vector space, and a vector database finds them, even across millions of items, in milliseconds.

::how
An embedding model turns each item into a vector with hundreds or thousands of dimensions. The database indexes those vectors, typically with an **approximate nearest neighbour** (ANN) index such as HNSW. At query time you embed the query and the index returns the most similar vectors, measured by cosine similarity or a similar distance. "Approximate" means it trades a tiny bit of accuracy for huge speed gains.

::where
- Retrieval for RAG systems
- Semantic search on websites and documentation
- Recommendations ("products similar to this one")
- Duplicate detection for support tickets, images or questions

::know
- **Embeddings come from a model.** Changing the embedding model means re-embedding everything.
- **Approximate search** is the norm. It's very fast and nearly always right.
- **Metadata filters** (date, owner, permissions) are as important as similarity.
- **You may not need a new database:** Postgres with pgvector handles many workloads.
- **Hybrid search** combining vectors and keywords usually performs best.

::analogy
Imagine a library where books are shelved by what they're about instead of alphabetically. A book on "fixing slow websites" sits next to "web performance tuning". A vector database is that library, plus a librarian who can walk straight to the right shelf.

::talk10
A vector database stores embeddings, numeric representations of meaning, and finds the most similar ones quickly. It's what lets you search by meaning instead of exact keywords.

::talk30
A vector database is built around embeddings. You run your text, or images, through an embedding model that turns each item into a long list of numbers, where similar meanings end up close together. The database indexes those vectors so it can find the nearest ones to a query in milliseconds, using approximate nearest-neighbour algorithms like HNSW. It's the retrieval layer behind most RAG systems and semantic search. You don't always need a dedicated product; Postgres with the pgvector extension covers a lot of use cases.

::comebacks
- Is it a replacement for a normal database? || Usually not. It's for similarity search. Your users, orders and transactions still belong in a regular database.
- Why approximate? || Exact search compares the query with every vector, which is too slow at scale. Approximate indexes are dramatically faster and almost as accurate.

::facts
- HNSW stands for Hierarchical Navigable Small World, a graph-based index described in 2016.
- Common embedding sizes range from a few hundred to a few thousand dimensions.

::deeper
### Similarity measures
- **Cosine similarity:** compares the angle between vectors, ignoring length. The most common for text.
- **Dot product:** fast, and equal to cosine when vectors are normalised.
- **Euclidean distance:** straight-line distance.

### pgvector example
```sql
create extension if not exists vector;
create table docs (id bigserial primary key, body text, embedding vector(1536));
create index on docs using hnsw (embedding vector_cosine_ops);
select id, body from docs order by embedding <=> $1 limit 5;
```
`<=>` is cosine distance. Keeping vectors next to your relational data makes permission filters and joins easy.

### Trade-offs
- Dedicated vector databases can scale further and add features; Postgres keeps your stack simpler.
- HNSW indexes use a lot of memory and take time to build.

::sources
- [pgvector documentation](https://github.com/pgvector/pgvector)
- [Malkov and Yashunin, HNSW paper](https://arxiv.org/abs/1603.09320)

::check
You switch to a new, better embedding model. What do you have to do with your existing vectors?
- [ ] Nothing, vectors from different models are compatible
- [x] Re-embed all stored items with the new model
- [ ] Only re-embed new documents
- [ ] Normalise the old vectors
> Each model has its own vector space. Comparing a query from model B against documents embedded by model A gives meaningless results.

::interview
=== q: What is a vector database and when would you use one? | level: beginner | pro: false
#answer
1. Stores embeddings and searches for the most similar vectors.
2. Enables semantic search: matching by meaning, not exact words.
3. Uses approximate nearest-neighbour indexes for speed.
4. Use cases: RAG, semantic search, recommendations, deduplication.
#short
A vector database stores embeddings and finds the closest ones to a query, so you can search by meaning. I'd use one for semantic search or as the retrieval layer in a RAG system. For smaller projects, pgvector in Postgres is often enough.
#detail
Mention that it complements rather than replaces a relational database, and that metadata filtering, like permissions, is essential in real products.
#followups
- What is cosine similarity? || A measure of how closely two vectors point in the same direction, from -1 to 1. Higher means more similar.
#mistakes
- Suggesting a vector database to store all application data

=== q: Dedicated vector DB or pgvector? | level: intermediate | pro: true
#answer
1. pgvector: one database, transactions, joins and permission filters next to your data; simpler operations.
2. Dedicated vector DB: better at very large scale, more specialised features, separate scaling.
3. Decide by data size, query volume, filtering needs and team operations.
#short
If I already use Postgres and have up to a few million vectors, I'd start with pgvector, since it keeps permissions and joins simple. I'd move to a dedicated vector database if scale or latency requirements outgrow it.
#detail
Interviewers like hearing that you'd measure first: latency at your expected data size, and recall at your index settings.
#followups
- What is recall in vector search? || The fraction of the true nearest neighbours the approximate index actually returns.
#mistakes
- Choosing a dedicated vector database by default for a small prototype
