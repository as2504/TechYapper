---
slug: rag
title: RAG
category: ai
aliases: Retrieval-Augmented Generation, retrieval augmented generation, chat with your docs, grounding
tagline: Give a language model the right documents at question time, so it answers from your data instead of its memory.
level: intermediate
minutes: 5
concepts: rag, embeddings-vector-db, llm-tokens
related: llms, vector-databases
popular: true
---
::what
RAG stands for **Retrieval-Augmented Generation**. When a user asks a question, the system first searches your documents for the most relevant passages, puts them into the prompt, and then asks the LLM to answer using those passages. The model doesn't learn anything new. It's reading from notes you handed it.

::why
LLMs only know their training data, which is frozen at a cutoff date and doesn't include your company's policies, tickets or wiki. Retraining a model every time a document changes is slow and expensive. RAG lets you keep the model as-is and swap the knowledge in at question time.

::how
1. **Index:** split your documents into chunks, turn each chunk into an **embedding** (a vector of numbers capturing its meaning) and store them in a vector database.
2. **Retrieve:** embed the user's question the same way and find the chunks with the closest vectors, often combined with keyword search.
3. **Augment:** put the top chunks into the prompt with instructions like "answer only from this context and cite sources".
4. **Generate:** the LLM writes the answer.

::where
- Internal "ask the docs" assistants for HR policies, engineering wikis and runbooks
- Customer support bots that answer from help-centre articles
- Search over contracts, research papers or legal documents
- Coding assistants that pull in relevant files from your repository

::know
- **Retrieval quality caps answer quality.** If the right chunk isn't retrieved, the model can't use it.
- **Chunking matters:** too small loses context, too big dilutes relevance and wastes tokens.
- **Hybrid search** (vectors plus keywords) usually beats either alone, especially for names, codes and IDs.
- **Citations** make answers checkable and build trust.
- **Evaluate it:** keep a set of real questions with known good answers and measure retrieval and answer quality.

::analogy
RAG is an open-book exam. The model is a student who writes well, and retrieval is finding the right pages to bring in. A brilliant student with the wrong pages still writes a confident, wrong answer.

::talk10
RAG means retrieving relevant documents and adding them to the prompt, so the LLM answers from your actual data instead of just its training memory.

::talk30
RAG, retrieval-augmented generation, is how most companies make an LLM answer questions about their own data. You split documents into chunks, store embeddings of those chunks in a vector database, and at question time you find the chunks most similar to the question and put them in the prompt. The model then answers from that context, ideally with citations. It doesn't retrain the model, so you can update the knowledge just by updating the documents. In practice, most of the work is in getting retrieval right, because the model can only be as good as what you give it.

::comebacks
- Why not just fine-tune on our documents? || Fine-tuning is good at teaching style and behaviour, not reliable at memorising facts, and you'd have to retrain whenever documents change. RAG updates instantly.
- Why not paste all the docs into the prompt? || Context windows and costs are limited, and models handle focused context better than a giant dump.
- Does RAG stop hallucinations? || It reduces them a lot when retrieval works. It doesn't eliminate them, so citations and evaluation still matter.

::facts
- The term comes from a 2020 paper by researchers at Facebook AI Research (Lewis et al.).
- Many production RAG systems add a **re-ranker**, a second model that re-orders the retrieved chunks by relevance.
- Postgres can do vector search through the `pgvector` extension, so you don't always need a separate database.

::deeper
### Where RAG systems break
- **Retrieval misses:** the answer is in a table, a PDF image or split across two chunks.
- **Query mismatch:** users ask "can I WFH Fridays?" and the policy says "remote work". Query rewriting or hybrid search helps.
- **Stale or conflicting sources:** two versions of a policy both get retrieved.
- **Prompt injection:** a retrieved document contains instructions. Treat retrieved text as data.

### A minimal pipeline
```text
docs → chunk (≈300–800 tokens, with overlap) → embed → store
question → embed → top-k search (+ keyword) → re-rank → prompt → answer + citations
```

### What to measure
1. **Retrieval:** is the right chunk in the top k? (recall@k)
2. **Faithfulness:** does the answer stick to the retrieved context?
3. **Answer quality:** is it correct and useful for the question?

::sources
- [Lewis et al., Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (2020)](https://arxiv.org/abs/2005.11401)
- [pgvector on GitHub](https://github.com/pgvector/pgvector)
- [Anthropic: Contextual retrieval](https://www.anthropic.com/news/contextual-retrieval)

::check
Your RAG bot gives wrong answers about a policy. The policy text is in your documents. What should you check first?
- [ ] Switch to a bigger LLM
- [x] Whether the right chunk is actually being retrieved for that question
- [ ] Raise the temperature
- [ ] Fine-tune the model on the policy
> If the correct passage isn't in the retrieved context, no model can answer from it. Inspect what retrieval returns before changing anything else.

::interview
=== q: What is RAG and why is it used? | level: beginner | pro: false
#answer
1. Retrieval-Augmented Generation: retrieve relevant documents, add them to the prompt, then generate.
2. Solves knowledge cutoff and lack of private data without retraining.
3. Knowledge is easy to update: change the documents, not the model.
4. Enables citations, which makes answers verifiable.
#short
RAG is retrieve, then generate. When a question comes in, we search our documents for the relevant parts and put them in the prompt, so the model answers from our data with citations. It's how you get an LLM to know your company's information without retraining it.
#detail
Good candidates mention that RAG is mostly a search problem. Talk about chunking, embeddings, hybrid search and evaluating retrieval. That signals you've thought about it beyond the diagram.
#followups
- What's an embedding? || A list of numbers representing the meaning of text, so similar meanings end up close together and can be found with similarity search.
- How do you pick chunk size? || Experiment against real questions. Start around a few hundred tokens with some overlap and measure retrieval quality.
#mistakes
- Describing RAG as training the model on your documents
- Ignoring retrieval quality and evaluation

=== q: How would you evaluate a RAG system? | level: intermediate | pro: false
#answer
1. Build a test set of real questions with the correct source documents and answers.
2. Measure retrieval: is the correct chunk in the top k?
3. Measure faithfulness: does the answer only use the retrieved context?
4. Measure answer quality, using human review or a carefully checked LLM grader.
5. Re-run the set whenever you change chunking, models or prompts.
#short
I'd split it into two parts: retrieval and generation. First, does search find the right chunk for each test question? Then, given the right context, is the answer correct and faithful to it? Keep a fixed test set and re-run it after every change.
#detail
Separating retrieval from generation is the key insight: it tells you which half to fix. Mention monitoring in production too, like tracking questions where users click "not helpful".
#followups
- Can you use an LLM to grade answers? || Yes, as a scalable check, but validate it against human judgments first, because graders have their own biases.
#mistakes
- Evaluating only by trying a few questions manually

=== q: Design a RAG system for 50,000 internal documents with permissions. | level: advanced | pro: true
#answer
1. Ingestion: parse documents, chunk them, embed them, and store chunks with metadata (source, date, access groups).
2. Retrieval: hybrid search filtered by the user's permissions before ranking.
3. Re-rank the top results, then build the prompt with citations.
4. Keep the index fresh with incremental re-indexing on document changes.
5. Evaluation set, logging and feedback loop.
#short
I'd store each chunk with its source and access groups, and filter by the user's permissions at query time, before ranking, so nobody can retrieve what they can't read. Then hybrid search, a re-ranker, and a prompt that answers only from the context with citations. Ingestion runs incrementally as documents change, and I'd track quality with a fixed evaluation set.
#detail
Permission filtering at retrieval time is the point most candidates miss: filtering after generation is too late, because the content has already been in the prompt. Also mention handling deletions, so removed documents stop showing up.
#followups
- Why not filter permissions after retrieval? || If you filter after the LLM sees the chunk, private content can leak into the answer.
#mistakes
- Forgetting access control entirely
