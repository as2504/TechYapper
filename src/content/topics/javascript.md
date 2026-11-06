---
slug: javascript
title: JavaScript
category: development
aliases: JS, ECMAScript, ES6, promises, async await, event loop
tagline: The programming language of the web, running in every browser and, through Node.js, on servers too.
level: beginner
minutes: 5
concepts: js-event-loop, nodejs-event-loop
related: typescript, react
popular: true
---
::what
JavaScript is a dynamically typed programming language that every web browser can run. It started as a way to make web pages interactive. Today it also runs servers (Node.js, Deno, Bun), mobile apps and desktop apps. Its official standard is called ECMAScript, which is why you hear "ES6" or "ES2024".

::why
In 1995 the web was static documents. Netscape wanted a lightweight language inside the browser so pages could react to clicks and forms without a round trip to the server. Brendan Eich wrote the first version in about ten days. It stuck because it was the only language every browser shipped.

::how
JavaScript runs on a single thread with an **event loop**. Your code runs to completion; slow things like timers, network requests and file reads are handed off to the environment (the browser or Node), and when they finish their callbacks are queued. The event loop picks up the next callback when the call stack is empty. **Promises** and `async/await` are a nicer way to write that same callback-based flow.

::where
- Every interactive website: forms, menus, maps, editors
- Front-end frameworks: React, Vue, Angular, Svelte
- Back ends and APIs with Node.js
- Tooling: bundlers, linters and build scripts are mostly JavaScript or TypeScript

::know
- **Single-threaded, non-blocking.** One thing runs at a time, but waiting doesn't block. That's the event loop.
- **Dynamic types.** Variables don't have fixed types, which is flexible and also why TypeScript exists.
- **Functions are values.** You can pass them around, return them and store them. Closures come from this.
- **`==` vs `===`.** `===` compares without type conversion. Use it by default.
- **`let` and `const`** replaced `var` for most code because they're block-scoped.

::analogy
The event loop is like a single barista who never stands and waits for the milk to steam. They start the milk, take the next order, and when the steamer beeps they finish that drink. One person, many drinks in progress.

::talk10
JavaScript is the language of the web. It runs in every browser, and with Node.js on servers too. It's single-threaded but handles lots of waiting work at once through the event loop.

::talk30
JavaScript started as a small scripting language for browsers and became the one language every web page can run. It's dynamically typed and single-threaded, but it doesn't block on slow work: network calls and timers are handed off, and their results come back through the event loop as callbacks, promises or async/await. Node.js took the same engine to servers, which is why you can now write a whole product, front end and back end, in JavaScript. TypeScript adds static types on top for larger codebases.

::comebacks
- Is JavaScript related to Java? || Only by name. It was a marketing decision in 1995. The languages are very different.
- If it's single-threaded, how does it handle many requests? || It doesn't wait on I/O. While a database call is in flight, it serves other work, and the callback runs when the result arrives.
- Why do people complain about it? || Odd type coercion and some early design decisions. Modern JavaScript and TypeScript fix most of the day-to-day pain.

::facts
- The language was named Mocha, then LiveScript, before becoming JavaScript in 1995.
- `typeof null` returns `"object"`. It's a bug from the first version that can't be fixed without breaking the web.
- ECMAScript has had a new edition every year since 2015.

::deeper
### Microtasks vs macrotasks
Promise callbacks go into the **microtask** queue, which drains completely before the next **macrotask** (timers, I/O events). That's why this prints `sync`, `micro`, `macro`:
```js
setTimeout(() => console.log('macro'), 0)
Promise.resolve().then(() => console.log('micro'))
console.log('sync')
```

### Closures
A function remembers the variables in scope where it was created. That's how private state, callbacks and React hooks work.
```js
function counter() { let n = 0; return () => ++n }
const next = counter(); next(); next() // 2
```

### Trade-offs
- CPU-heavy work blocks the single thread. Move it to Web Workers or worker threads.
- Dynamic typing speeds up small scripts and slows down large teams. That gap is where TypeScript fits.

::sources
- [MDN: JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [MDN: The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- [ECMAScript specification](https://tc39.es/ecma262/)

::check
What does this log, in order? `setTimeout(() => log('A'), 0); Promise.resolve().then(() => log('B')); log('C')`
- [ ] A, B, C
- [x] C, B, A
- [ ] C, A, B
- [ ] B, C, A
> Synchronous code runs first (C). Then the microtask queue drains (the promise callback, B). Only then does the event loop take the next macrotask, the timer (A).

::interview
=== q: Explain the JavaScript event loop. | level: intermediate | pro: false
#answer
1. JavaScript runs on one thread with a call stack.
2. Async work (timers, network, I/O) is handled by the browser or Node outside the stack.
3. When that work finishes, its callback is queued.
4. When the stack is empty, the event loop runs all microtasks (promises) first, then the next macrotask (timers, events).
#short
JavaScript runs one thing at a time on a call stack. Slow work like a fetch is handed off to the browser, and when it's done the callback gets queued. When the stack is empty, the event loop runs queued promise callbacks first, then things like timers.
#detail
Draw it if you can: call stack, Web APIs, microtask queue, macrotask queue. The classic follow-up is the `setTimeout` vs `Promise.then` ordering puzzle. Saying that `setTimeout(fn, 0)` means "as soon as possible after the current work and microtasks", not "immediately", shows real understanding.
#followups
- What's the difference between microtasks and macrotasks? || Microtasks (promise callbacks, queueMicrotask) all run before the next macrotask (timers, I/O, UI events).
- What blocks the event loop? || Long synchronous work, like a big loop or heavy JSON parsing. Nothing else runs until it finishes.
#mistakes
- Saying JavaScript is multi-threaded
- Not distinguishing microtasks from macrotasks

=== q: What is a closure? | level: beginner | pro: false
#answer
1. A closure is a function together with the variables from the scope where it was defined.
2. The function can still read and update those variables after the outer function returns.
3. Uses: private state, factories, callbacks, memoisation, React hooks.
#short
A closure is when a function remembers the variables around it from where it was created, even after that outer function has finished. It's how you get private state in JavaScript.
#detail
Show a small counter example. A common trap is the old `var` in a loop: every callback shares the same `i`. With `let`, each iteration gets its own binding, so each closure sees its own value.
#followups
- Why does `var` in a loop with setTimeout print the same number? || `var` is function-scoped, so every callback closes over the same variable, which has its final value by the time they run.
#mistakes
- Defining closures only as "a function inside a function"

=== q: What's the difference between == and ===, and between null and undefined? | level: beginner | pro: true
#answer
1. `===` checks value and type without conversion. `==` converts types first.
2. `undefined` means a value was never assigned. `null` means it was intentionally set to "no value".
3. `null == undefined` is true; `null === undefined` is false.
4. Default to `===`.
#short
Triple equals compares without type conversion, so `'1' === 1` is false. Double equals converts first, which leads to surprises. Undefined means nothing was assigned, null means someone explicitly said "empty".
#detail
One accepted use of `==` is `x == null`, which checks for both null and undefined at once. Mention optional chaining (`a?.b`) and nullish coalescing (`a ?? b`) as modern ways to handle missing values.
#followups
- What does `??` do differently from `||`? || `??` only falls back for null or undefined. `||` also falls back for 0, empty string and false.
#mistakes
- Saying `typeof null` is "null"
