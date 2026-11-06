---
slug: rag
title: RAG, without the hype
topic: genai
difficulty: intermediate
minutes: 7
pro: true
related: embeddings-vector-db, llm-tokens, caching-strategies
---
::dek
Retrieval-Augmented Generation is an open-book exam for language models. Most of the engineering is in finding the right page.

::hook
"We'll just add RAG" has become the default answer to "how do we make the chatbot know our stuff?". The idea is simple and genuinely powerful. The reason so many RAG demos impress and so many RAG products disappoint is that the hard part isn't the LLM at all — it's retrieval.

::yap
RAG doesn't teach the model anything. It finds the right paragraphs and pastes them into the prompt — so answer quality is capped by retrieval quality.

::basics
An LLM only knows what was in its training data — which is frozen at some date and doesn't include your company's documents. **Retrieval-Augmented Generation (RAG)** fixes this without retraining:

1. **Retrieve**: when a question comes in, search your documents for the most relevant passages.
2. **Augment**: put those passages into the prompt alongside the question.
3. **Generate**: the LLM writes an answer using that context — ideally citing it.

```text
System: Answer using only the context. Cite sources. If unsure, say so.
Context:
[1] Refunds are processed within 5–7 working days… (refund-policy.md)
[2] UPI refunds may reflect within 48 hours… (payments-faq.md)
Question: How long does a UPI refund take?
```

It's an **open-book exam**: the model doesn't need to memorise your policies, it needs to read the right page.

Why teams like it:

- Answers can use **private and current** data.
- Updating knowledge = updating documents, not retraining.
- Answers can include **citations** users can check.

::hood
### The indexing pipeline

Before any question is asked:

1. **Load** documents (PDFs, Confluence, tickets, code).
2. **Chunk** them into passages — commonly a few hundred tokens, split along headings or paragraphs, often with some overlap.
3. **Embed** each chunk with an embedding model.
4. **Store** vectors plus metadata (source, section title, date, permissions) in a vector index.

### The query pipeline

1. Embed the user's question (sometimes after rewriting it into a clearer search query).
2. Retrieve the top-k chunks — ideally with **hybrid search** (keywords + vectors).
3. Optionally **re-rank** them with a cross-encoder that scores query–chunk pairs more precisely.
4. Build the prompt with instructions, retrieved context and the question.
5. Generate, with citations.

### Where it goes wrong

- **Bad chunks**: a rule split from its exception; a table separated from its header; chunks with no title so "it" means nothing.
- **Wrong retrieval**: semantic search missing exact terms like error codes or product names.
- **Too much context**: twenty loosely related chunks distract the model more than three precise ones.
- **Ignored context**: the model answers from its training data instead of the provided text — instructions and evaluations catch this.

::deep
### Evaluate retrieval and generation separately

Build an evaluation set of real questions with the documents (or passages) that should answer them. Measure:

- **Retrieval**: recall@k (did the right chunk appear in the top k?), MRR.
- **Generation**: faithfulness (is every claim supported by the context?), answer correctness, citation accuracy.

LLM-as-judge can scale grading, but calibrate it against human labels. Without evals, every prompt tweak is a guess.

### Techniques that move the needle

- **Structure-aware chunking** and attaching document/section titles to each chunk ("contextual" chunk headers).
- **Hybrid retrieval + re-ranking** — often the single biggest quality jump.
- **Query rewriting**: turn "and for UPI?" in a conversation into a standalone query.
- **Metadata filters**: product, region, date, and especially **access control** — users must only retrieve documents they're allowed to see.
- **Parent-document retrieval**: match on small chunks, but give the model the larger surrounding section.

### RAG vs long context vs fine-tuning

- **Long context**: paste everything. Simple, but costly per request, slower, and recall over huge inputs is uneven. Great for a few documents.
- **Fine-tuning**: changes behaviour, tone and format reliably; poor at injecting facts that change often, and can't cite sources.
- **RAG**: best for large, changing knowledge bases needing citations and permissions.

Real systems combine them: fine-tune or prompt for format, RAG for knowledge, long context for reasoning over retrieved material.

### Agentic retrieval

Instead of one retrieval step, the model can call search as a **tool** — searching, reading, refining the query and searching again. This handles multi-hop questions ("compare our 2024 and 2025 refund policies") at the cost of latency and more tokens.

::myths
- RAG trains the model on your documents || The model's weights never change. Documents are inserted into the prompt at query time.
- A bigger LLM fixes bad RAG answers || If the right passage isn't retrieved, no model can use it. Fix retrieval first.
- RAG eliminates hallucinations || It reduces them. Models can still misread or ignore context, which is why faithfulness evals matter.

::facts
- The term RAG comes from a 2020 paper by Patrick Lewis and colleagues at Facebook AI Research, UCL and NYU.
- Reciprocal Rank Fusion, a common way to merge keyword and vector results, dates from a 2009 information-retrieval paper — older than the hype by a decade.

::realworld
- Internal knowledge assistants over HR, IT and policy documents.
- Customer support bots that cite help-centre articles.
- Developer assistants that retrieve from a codebase and its docs.

::check
A RAG bot retrieves chunks from the correct document but keeps answering with an outdated rule from the same file. What's the best first fix to try?
- [ ] Increase the model's temperature
- [x] Improve chunking and metadata (section titles, effective dates) so the current rule is retrieved and recognisable
- [ ] Switch to a model with a larger context window
- [ ] Fine-tune the model on the document
> The failure is in what gets retrieved and how it's labelled. Clean chunk boundaries plus metadata like section and effective date let retrieval and the model pick the current rule.
