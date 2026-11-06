---
slug: llms
title: Large Language Models
category: ai
aliases: LLM, GPT, Claude, Gemini, Llama, transformers, tokens, generative AI, GenAI
tagline: Models trained on huge amounts of text to predict the next token, which turns out to be enough to write, summarise and reason.
level: beginner
minutes: 5
concepts: llm-tokens, embeddings-vector-db, rag
related: rag, vector-databases
popular: true
---
::what
A large language model (LLM) is a neural network trained on a huge amount of text to predict the next piece of text, called a **token**. GPT, Claude, Gemini and Llama are LLMs. Given a prompt, the model generates a response one token at a time, each time choosing a likely next token based on everything so far.

::why
Classic NLP needed a separate model for each task: one for translation, one for sentiment, one for summarising. Researchers found that one big model trained to predict text gets surprisingly good at all of those, and can follow instructions it was never explicitly trained on. That generality is why LLMs took off.

::how
Text is split into **tokens** (pieces of words). The model, usually a **transformer**, turns each token into numbers and uses **attention** to weigh how every token relates to every other token in the context. It outputs a probability for each possible next token, picks one, adds it to the input and repeats. Training happens in stages: **pre-training** on large text datasets, then **fine-tuning** and human feedback to make it helpful and follow instructions.

::where
- Chat assistants and coding assistants
- Summarising documents, meetings and support tickets
- Extracting structured data from emails, invoices and contracts
- Search and Q&A over company documents, usually with RAG
- Agents that call tools and APIs to complete tasks

::know
- **It predicts tokens; it doesn't look things up.** That's why it can sound confident and be wrong (hallucination).
- **Context window:** the maximum tokens it can consider at once, including your prompt and its answer.
- **Knowledge cutoff:** it only knows what was in its training data, unless you give it more in the prompt.
- **Temperature** controls randomness. Low is more predictable, high is more varied.
- **Cost and speed scale with tokens.** Long prompts cost more and take longer.

::analogy
An LLM is like an extremely well-read improviser. It has absorbed patterns from a vast library and can continue almost any text convincingly. It isn't reading from the library while it speaks, so it can misremember a fact as fluently as it recalls one.

::talk10
An LLM is a model trained on huge amounts of text to predict the next token. Doing that well turns out to let it write, summarise, translate and answer questions, though it can confidently get facts wrong.

::talk30
Large language models are neural networks, mostly transformers, trained to predict the next token in a piece of text. They're trained on huge datasets and then fine-tuned to follow instructions, which makes them useful for writing, summarising, coding and extracting information. The important limitation is that they generate plausible text rather than looking facts up, so they can hallucinate, and they only know what was in their training data. That's why products often add retrieval, like RAG, or tools, to ground the answers in real data.

::comebacks
- Does it understand what it's saying? || That's debated. Practically, it's very good at using language in context, but it has no built-in way to check facts against reality.
- Why does it make things up? || It's trained to produce likely text, not true text. When it doesn't know, a fluent guess is often the most likely continuation.
- How do companies use it on their own data? || Usually by retrieving relevant documents and putting them in the prompt (RAG), not by retraining the model.

::facts
- The transformer architecture comes from Google's 2017 paper "Attention Is All You Need".
- A token is roughly three-quarters of an English word on average, and languages like Hindi often use more tokens per word.
- Models don't see letters directly, which is why they used to struggle counting letters in a word.

::deeper
### Attention, simply
For each token, attention computes how relevant every other token in the context is, and mixes in their information accordingly. In "the animal didn't cross the street because it was tired", attention helps the model link "it" to "animal". Stacking many attention layers lets the model build up increasingly abstract relationships.

### Training stages
1. **Pre-training:** predict the next token over a huge corpus. This is where general knowledge and language skill come from.
2. **Instruction tuning:** train on examples of prompts and good responses.
3. **Preference tuning:** methods like RLHF use human or AI feedback to prefer helpful, honest, harmless responses.

### Trade-offs when building with LLMs
- **Accuracy vs cost:** bigger models are usually better and slower and more expensive.
- **Prompting vs RAG vs fine-tuning:** prompting is cheapest to try, RAG adds fresh or private knowledge, fine-tuning changes style or behaviour.
- **Evaluation is hard:** you need test sets and checks, not just a few good-looking demos.

::sources
- [Vaswani et al., Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762)
- [OpenAI: What are tokens?](https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them)
- [Anthropic: Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

::check
A model confidently cites a policy document that doesn't exist. What's the best description of why?
- [ ] The model's database was corrupted
- [x] It generates likely-sounding text and has no built-in fact lookup
- [ ] The temperature was set to zero
- [ ] The context window was too large
> LLMs generate plausible continuations. Unless the real document is in the prompt (for example via RAG), a convincing fake is a likely output. That's hallucination.

::interview
=== q: What is a large language model? | level: beginner | pro: false
#answer
1. A neural network, usually a transformer, trained to predict the next token in text.
2. Trained on huge text datasets, then fine-tuned to follow instructions.
3. Generates output one token at a time.
4. Limits: hallucination, knowledge cutoff, context window, cost per token.
#short
An LLM is a model trained on a huge amount of text to predict the next token. That simple objective, at scale, gives it the ability to write, summarise and answer questions. The catch is that it predicts plausible text rather than checking facts.
#detail
Mention a concrete limitation and how you'd handle it: "For a support bot, I wouldn't trust the model's memory of our policies. I'd retrieve the actual policy text and ask it to answer only from that." That shows you can build with it, not just describe it.
#followups
- What's a token? || A chunk of text, often part of a word. Models read and write tokens, and pricing and context limits are measured in them.
- What's a context window? || The maximum number of tokens the model can take into account at once, prompt plus output.
#mistakes
- Saying the model searches the internet by default
- Ignoring hallucination entirely

=== q: How would you reduce hallucinations in an LLM feature? | level: intermediate | pro: false
#answer
1. Ground it: put real source content in the prompt (RAG) and ask it to answer only from that.
2. Ask for citations, and let it say "I don't know".
3. Lower the temperature for factual tasks.
4. Validate structured output and check claims where possible.
5. Evaluate with a test set of real questions.
#short
The main fix is grounding: retrieve the actual documents and tell the model to answer only from them, with citations, and to say when it doesn't know. Then I'd measure it with a set of real questions rather than trusting a demo.
#detail
Interviewers like to hear that this is an engineering problem with measurement, not just a prompt trick. Mention retrieval quality as the usual bottleneck, and human review for high-stakes outputs.
#followups
- Would fine-tuning fix hallucinations? || Not reliably. Fine-tuning shapes behaviour and style. Grounding with retrieval is the better tool for factual accuracy.
#mistakes
- Claiming hallucinations can be eliminated entirely

=== q: When would you fine-tune instead of using RAG? | level: advanced | pro: true
#answer
1. RAG: when the model needs fresh, private or frequently changing knowledge.
2. Fine-tuning: when you need a consistent style, format or behaviour, or a narrow task done cheaply by a smaller model.
3. Often both: fine-tune for behaviour, RAG for knowledge.
4. Start with prompting, then RAG, then fine-tuning, in increasing cost.
#short
RAG is for knowledge: it gives the model the right facts at question time, and you can update them without retraining. Fine-tuning is for behaviour: a consistent format, tone or a narrow task. I'd start with prompting, add RAG for knowledge, and fine-tune only when there's a clear behavioural gap.
#detail
Mention cost and maintenance: fine-tuned models need retraining when data changes, and you need good training examples. RAG needs a retrieval pipeline and evaluation of search quality.
#followups
- What data do you need to fine-tune? || Many high-quality example inputs and ideal outputs for the exact task.
#mistakes
- Treating fine-tuning as the way to "add documents" to a model
