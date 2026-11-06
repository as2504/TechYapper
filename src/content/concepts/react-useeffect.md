---
slug: react-useeffect
title: What useEffect actually does
topic: frontend
difficulty: intermediate
minutes: 7
pro: false
related: js-event-loop, rest-idempotency, caching-strategies
---
::dek
It isn't a lifecycle method. It's a synchronisation contract between your component and the world outside React.

::hook
Most React bugs that "only happen sometimes" trace back to one hook. Not because useEffect is broken, but because most of us learned it as `componentDidMount` with extra steps. It's actually something stranger and more useful: a way to keep something *outside* React in sync with what's *inside* it.

::yap
useEffect isn't "run this on mount". It's "after you paint, make the outside world match this render — and here's how to undo it."

::basics
React's job is to turn your state into UI. Your component function should be *pure*: same props and state in, same JSX out. No network calls, no timers, no touching `document.title`.

But real apps need side effects: fetching data, subscribing to a WebSocket, starting an interval. **useEffect is the escape hatch** where those live.

```jsx
useEffect(() => {
  document.title = `${count} new messages`
}, [count])
```

Read it like a sentence: *"After rendering, make the page title match `count`. Only redo this when `count` changes."*

The second argument — the **dependency array** — controls when it re-runs:

- `[count]` → after the first render, and whenever `count` changes
- `[]` → only after the first render
- no array → after *every* render

### Cleaning up

If your effect starts something, return a function that stops it. React calls it before re-running the effect and when the component unmounts.

```jsx
useEffect(() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)
}, [])
```

Forget the cleanup and you get the classic bug: a timer that keeps firing after you navigated away.

::hood
### When does it actually run?

React works in two phases. In the **render phase** it calls your component and diffs the result. In the **commit phase** it applies changes to the DOM. `useEffect` callbacks run *after* commit — and, crucially, usually after the browser has painted. That's why effects don't block the screen from updating.

If you need to measure the DOM *before* paint (to avoid a flicker), that's `useLayoutEffect`, which runs synchronously after DOM mutation but before paint.

### How dependencies are compared

React stores the previous dependency array and compares each item with `Object.is`. That means:

```jsx
const options = { roomId }        // new object every render
useEffect(() => connect(options), [options]) // runs every render!
```

`{ roomId } !== { roomId }` — two different objects. The fix is to depend on the primitive (`roomId`) or memoise the object.

### Every render has its own effect

Effects capture the props and state of the render they were created in. This is the "stale closure" problem:

```jsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000)
  return () => clearInterval(id)
}, []) // count is frozen at 0 → counter stops at 1
```

Use the updater form `setCount(c => c + 1)` and the effect no longer needs `count` at all.

### Why it runs twice in development

In Strict Mode, React 18+ mounts, unmounts and re-mounts every component once in development. It's a deliberate stress test: if your effect breaks when run twice, your cleanup is missing. Production runs it once.

::deep
### The mental model shift: synchronisation, not lifecycle

The React team's framing: an effect describes **how to start synchronising** an external system with the current props/state and **how to stop**. React decides when. If you think in mount/update/unmount, you'll fight the dependency array. If you think "this effect keeps the chat connection in sync with `roomId`", the array writes itself: whatever the effect reads from the component scope.

### You might not need an effect

A large share of effects in real codebases are unnecessary and cause an extra render each:

- **Derived state** — `useEffect(() => setFullName(first + ' ' + last))` should just be `const fullName = first + ' ' + last` during render.
- **Responding to events** — logic that runs because the user clicked belongs in the event handler, not in an effect watching state that the click changed.
- **Resetting state on prop change** — pass a `key` so React remounts the subtree.

### Data fetching and race conditions

```jsx
useEffect(() => {
  let ignore = false
  fetchUser(id).then(u => { if (!ignore) setUser(u) })
  return () => { ignore = true }
}, [id])
```

Without the `ignore` flag, a slow response for an old `id` can overwrite a fast response for the new one. `AbortController` does the same and also cancels the request. In production apps, libraries like TanStack Query, SWR or framework loaders handle caching, deduplication and races for you — which is why "fetch in useEffect" is increasingly treated as a low-level primitive.

### Trade-offs worth discussing

- `useEffect` runs after paint → good for perceived performance, bad if the user sees a flash of wrong content (then use `useLayoutEffect`, sparingly — it blocks paint).
- Effects don't run during server rendering. Anything in an effect is client-only.
- React 19's `useEffectEvent` (experimental for a long time) lets you read latest values inside an effect without making them dependencies — the official answer to "I want this value but not to re-run on it".

::myths
- `[]` means "componentDidMount" || It means "this effect reads nothing from render scope". If it does read something, you've created a stale closure.
- Effects run during render || They run after React commits to the DOM, typically after the browser paints.
- Running twice in dev is a bug || It's Strict Mode checking your cleanup. Production runs effects once per commit.

::facts
- The ESLint rule `react-hooks/exhaustive-deps` is effectively part of the API — the React team treats disabling it as a code smell.
- Dependencies are compared with `Object.is`, the same check used for `useState` bail-outs. `NaN` equals `NaN` there; `+0` and `-0` don't.

::realworld
- Subscribing to browser APIs: `resize`, `IntersectionObserver`, media queries.
- Connecting to external systems: WebSockets, Supabase realtime channels, analytics SDKs.
- Integrating non-React widgets: maps, charts or editors that manage their own DOM.

::check
A component has `useEffect(() => { socket.connect(roomId); return () => socket.disconnect() }, [roomId])`. The user switches from room "a" to room "b". What happens, in order?
- [ ] connect("b") runs, then disconnect() for "a"
- [x] disconnect() for "a" runs, then connect("b")
- [ ] Nothing — effects with dependencies only run on mount
- [ ] React remounts the whole component
> React runs the previous effect's cleanup before running the effect again with new values. So the old room is disconnected first, then the new one connects. This ordering is what keeps exactly one connection alive at a time.
