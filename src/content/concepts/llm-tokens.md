---
slug: llm-tokens
title: How an LLM writes, one token at a time
topic: ai
difficulty: beginner
minutes: 7
pro: false
related: embeddings-vector-db, rag, python-gil
---
::dek
No database of answers, no thinking in sentences. Just a very large function predicting the next token — over and over.

::hook
Large language models feel like they "know" things and "decide" what to say. Under the hood, the loop is almost embarrassingly simple: look at the text so far, score every possible next token, pick one, append it, repeat. Understanding that loop explains hallucinations, token pricing, context limits and why the same prompt can give different answers.

::yap
An LLM doesn't retrieve answers — it predicts the next token, appends it, and does it again. Everything else, from creativity to hallucination, falls out of that loop.

::basics
### Tokens, not words

LLMs read and write **tokens**: chunks of text, often a word or part of a word. "Unbelievable" might be `un` + `believ` + `able`. In English, a token averages roughly three-quarters of a word. Code, other languages and unusual words often use more tokens.

That's why APIs price by **tokens**, and why limits are measured in tokens: the **context window** is how many tokens the model can consider at once (prompt plus response).

### The loop

1. Your prompt is split into tokens.
2. The model computes a probability for **every token in its vocabulary** being next.
3. One token is chosen.
4. It's appended to the text, and the whole thing goes back in for the next step.

```text
"The capital of France is" → " Paris" (92%) " a" (3%) " located" (1%) …
```

The model never "looks up" Paris. It learned, from enormous amounts of text, that this continuation is overwhelmingly likely.

### Why it sometimes makes things up

The model is optimised to produce *plausible* text. Usually plausible and true overlap. When the model hasn't strongly learned a fact — an obscure paper, a niche API — it still produces something plausible-looking. That's a **hallucination**.

::hood
### Transformers and attention

Modern LLMs are **transformers**. Each token becomes a vector (an embedding), and the model passes these through dozens of layers. The key mechanism is **self-attention**: each token's representation is updated by looking at every earlier token and weighting how relevant each one is. That's how "it" gets connected to the right noun three sentences back.

### Sampling: temperature, top-p

After the model produces probabilities, a **sampler** picks the token:

- **Temperature** reshapes the distribution. Low (≈0) → almost always the top token, focused and repetitive. High (≈1+) → flatter, more varied, more surprising.
- **Top-p (nucleus sampling)** only samples from the smallest set of tokens whose probabilities add up to p (e.g. 0.9).

Even at temperature 0, outputs can differ slightly between runs due to floating-point and batching effects on GPUs.

### Pretraining vs instruction tuning

**Pretraining** on vast text teaches next-token prediction — the model learns grammar, facts, code patterns. On its own it would just *continue* your text. **Instruction tuning** and **reinforcement learning from human (or AI) feedback** teach it to follow instructions and behave like an assistant. Same architecture, very different behaviour.

### Why input and output tokens cost differently

Input tokens can be processed in parallel in one pass. Output tokens are generated **one at a time**, each requiring a full forward pass. That's why output tokens are typically priced several times higher and why long answers take longer.

::deep
### The KV cache

Recomputing attention over the whole sequence for every new token would be wasteful. Models store each layer's **keys and values** for past tokens — the **KV cache** — so each step only computes the new token's contribution. The KV cache's size grows with context length and is a main reason long contexts are expensive in GPU memory. **Prompt caching** offered by API providers reuses this work across requests that share a long prefix (like a big system prompt), cutting cost and latency.

### Context windows and their limits

Attention cost grows with sequence length (naïvely quadratically). Techniques like FlashAttention, grouped-query attention and positional schemes (RoPE and its extensions) made 100k+ token windows practical. But a big window isn't perfect recall: models can attend less reliably to details buried in the middle of very long inputs, so retrieval and good prompt structure still matter.

### Reasoning models

Newer models are trained to produce intermediate reasoning tokens before answering — sometimes hidden, sometimes visible. It's still next-token prediction, but spending more tokens "thinking" measurably improves maths, coding and multi-step problems. It also costs more tokens and time: a real product trade-off.

### Tokenisation quirks

Tokenisers are usually trained with byte-pair encoding (BPE) or similar. Quirks follow: models can be bad at counting letters in a word (they see tokens, not letters), arithmetic on long numbers can suffer from how digits are split, and non-English text can cost noticeably more tokens for the same meaning.

### Structured output

Because generation is token-by-token, providers can **constrain decoding**: at each step, only allow tokens that keep the output valid against a JSON schema or grammar. That's how reliable "structured outputs" and tool calls work.

::myths
- LLMs look up answers in a database || They generate text from learned patterns. Grounding in real documents requires retrieval (RAG) or tools.
- Temperature 0 means perfectly deterministic || It's close, but hardware-level non-determinism can still change outputs occasionally.
- A bigger context window means the model remembers everything in it equally well || Recall over very long inputs is uneven; position and relevance matter.

::facts
- The transformer architecture comes from the 2017 paper "Attention Is All You Need" by researchers at Google.
- A common rule of thumb: about 4 characters or ¾ of a word per token in English text.

::realworld
- Estimating API cost: tokens in × input price + tokens out × output price.
- Using low temperature for extraction and classification, higher for brainstorming copy.
- Prompt caching for apps with long, reused system prompts or documents.

::check
Why are output tokens usually more expensive than input tokens in LLM APIs?
- [ ] Output tokens are longer than input tokens
- [x] Output tokens are generated sequentially, each needing its own forward pass, while input can be processed in parallel
- [ ] Output tokens are stored permanently
- [ ] Input tokens are compressed before processing
> The prompt is processed in one parallel pass. Each output token depends on the previous one, so generation is a sequence of passes — more compute per token and harder to batch.
