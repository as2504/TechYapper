---
slug: js-event-loop
title: The JavaScript event loop
topic: languages
difficulty: intermediate
minutes: 6
pro: false
related: nodejs-event-loop, react-useeffect, python-gil
---
::dek
One thread, one call stack, and a very disciplined queue. How JavaScript does "many things at once" without doing two things at once.

::hook
JavaScript runs your code on a single thread. Yet a browser tab can animate, fetch, listen for clicks and run timers all at the same time. The trick isn't parallelism — it's a loop with strict rules about what goes next. Once you know the rules, puzzles like "why did my `setTimeout(0)` run late?" stop being puzzles.

::yap
JavaScript isn't async because it's multi-threaded. It's async because it never waits — it hands slow work to the runtime and picks up the callback when the stack is empty.

::basics
Think of a single chef in a kitchen. The chef can only chop one thing at a time — that's the **call stack**. But the chef doesn't stand watching water boil. They set a timer, start something else, and come back when it rings.

In JavaScript:

- The **call stack** runs your code, one function at a time.
- Slow things — timers, network requests, file reads — are handed to the **runtime** (the browser or Node), which does them outside your thread.
- When they finish, their callbacks wait in a **queue**.
- The **event loop** keeps checking: *is the stack empty?* If yes, it takes the next callback from the queue and runs it.

```js
console.log('order placed')
setTimeout(() => console.log('food ready'), 2000)
console.log('taking next order')
```

This logs "order placed", "taking next order", then two seconds later "food ready". The timer didn't block anything.

The flip side: if your own code takes 3 seconds to run (a giant loop), *nothing* else happens for those 3 seconds. No clicks, no rendering. The chef is busy.

::hood
### Two queues, not one

There are actually (at least) two kinds of queued work:

- **Macrotasks** (often just called tasks): `setTimeout`, `setInterval`, I/O callbacks, UI events like clicks.
- **Microtasks**: promise callbacks (`.then`, `await` continuations) and `queueMicrotask`.

The rule: after each macrotask finishes, the engine **drains the entire microtask queue** before doing anything else — including rendering.

```js
setTimeout(() => console.log('timeout'), 0)
Promise.resolve().then(() => console.log('promise'))
console.log('sync')
// sync → promise → timeout
```

### Where rendering fits

In browsers, between macrotasks the event loop may run a **rendering step**: `requestAnimationFrame` callbacks, style, layout, paint — roughly every 16ms on a 60Hz screen. A long task delays that step, which is what users perceive as jank. Chrome flags any task over 50ms as a "long task".

### `await` is sugar over microtasks

```js
async function save() {
  console.log(1)
  await db.write()
  console.log(2) // runs later, as a microtask
}
```

Everything after `await` is scheduled as a continuation. The function returns a promise immediately; the stack unwinds; other work proceeds.

### setTimeout(fn, 0) isn't zero

It means "queue this as a macrotask, at the earliest after 0ms". It still waits for the current stack and all microtasks. Browsers also clamp nested timers to at least 4ms after a few levels.

::deep
### Starving the loop with microtasks

Because microtasks are drained completely, a microtask that queues another microtask forever will freeze the page just as effectively as a `while(true)` — rendering never gets a turn:

```js
function forever() { Promise.resolve().then(forever) }
```

### Breaking up long work

For CPU-heavy work on the main thread you have options, roughly in order of preference:

1. **Move it off the main thread** with a Web Worker (true parallelism, message passing, no DOM access).
2. **Yield** periodically so input and rendering get a turn: `await scheduler.yield()` where supported, or `await new Promise(r => setTimeout(r))`.
3. **Schedule by priority** with `scheduler.postTask` (user-blocking, user-visible, background).

React's concurrent rendering is built on exactly this idea: it renders in small slices and yields back to the browser, so typing stays responsive while a big list renders.

### Interaction to Next Paint

Google's Core Web Vital **INP** measures how long it takes from user input until the next frame is painted. Long tasks, heavy event handlers and big synchronous re-renders are the usual culprits. Event-loop literacy is now a performance metric, not trivia.

### The spec reality

The HTML spec defines multiple task sources (timers, networking, user interaction, …) and lets browsers prioritise between them. So "macrotasks run in FIFO order" is a useful model, not a guarantee across sources. Microtask ordering, however, is strictly specified.

::myths
- `setTimeout(fn, 0)` runs immediately || It runs after the current code and all pending microtasks — and possibly after rendering.
- `async` functions run on another thread || They run on the same thread; `await` just splits the function into continuations scheduled as microtasks.
- Promises make CPU-heavy code non-blocking || Wrapping a heavy loop in a promise still runs it on the main thread. Only workers give you another thread.

::facts
- The term "event loop" predates JavaScript — GUI toolkits and network servers used the pattern long before browsers did.
- Philip Roberts' 2014 talk "What the heck is the event loop anyway?" remains one of the most-watched JS conference talks ever.

::realworld
- Debugging a frozen UI: Chrome DevTools' Performance panel shows long tasks as red-flagged blocks.
- Animation libraries rely on `requestAnimationFrame` to sync with the rendering step.
- Interview classic: "predict the log order" questions mixing promises and timers.

::check
What is logged?
```js
setTimeout(() => console.log('A'), 0)
queueMicrotask(() => console.log('B'))
console.log('C')
```
- [ ] A B C
- [ ] C A B
- [x] C B A
- [ ] B C A
> Synchronous `C` first. Then microtasks drain: `B`. Then the next macrotask, the timer: `A`.
