---
slug: nodejs-event-loop
title: Node.js is single-threaded. Mostly.
topic: backend
difficulty: intermediate
minutes: 6
pro: false
related: js-event-loop, python-gil, docker-containers
---
::dek
Your JavaScript gets one thread. Node itself uses several. Knowing which is which is the difference between a fast API and one that falls over at 50 users.

::hook
"Node is single-threaded" is the first thing people learn and the first thing that misleads them. Your JavaScript runs on one thread, yes. But behind it sits libuv, a C library with its own thread pool and a direct line to the operating system's async I/O machinery. Node's speed comes from that split — and its classic failure mode comes from forgetting it.

::yap
Node is fast at waiting, not at thinking. It can juggle ten thousand open connections, but one heavy synchronous loop stops all of them.

::basics
Picture a restaurant with one waiter and a big kitchen. The waiter (your JavaScript) takes orders and serves dishes. They never cook. The kitchen (the operating system and Node's helpers) does the slow work.

That's why Node is great for **I/O-heavy** apps: APIs that mostly talk to databases, other services and files. While one request waits for the database, the single thread happily handles other requests.

```js
app.get('/user/:id', async (req, res) => {
  const user = await db.findUser(req.params.id) // thread is free while waiting
  res.json(user)
})
```

But if the waiter starts cooking — say, resizing an image or hashing 10MB of data synchronously — everyone else waits.

```js
app.get('/report', (req, res) => {
  const pdf = buildHugePdfSync() // every other request is now stuck
  res.send(pdf)
})
```

The rule of thumb: **never block the event loop**.

::hood
### libuv: the engine room

Node = V8 (runs JavaScript) + libuv (does async I/O) + bindings. libuv uses two strategies:

- **OS-level async I/O** for network sockets: `epoll` on Linux, `kqueue` on macOS, IOCP on Windows. No extra threads needed — the kernel notifies Node when data arrives.
- **A thread pool** (default 4 threads, `UV_THREADPOOL_SIZE` up to 1024) for work the OS can't do asynchronously well: most file system calls, DNS `lookup`, and CPU-heavy built-ins like `crypto.pbkdf2` and `zlib`.

So `fs.readFile` and `bcrypt` hashing really do run on other threads. Your callback still comes back to the one JavaScript thread.

### The phases

Node's loop runs in phases: **timers** (`setTimeout`), **pending callbacks**, **poll** (wait for I/O), **check** (`setImmediate`), **close callbacks**. Between each callback, Node drains `process.nextTick` callbacks first, then promise microtasks.

```js
setImmediate(() => console.log('immediate'))
process.nextTick(() => console.log('nextTick'))
Promise.resolve().then(() => console.log('promise'))
// nextTick → promise → immediate
```

### The thread-pool bottleneck

With only 4 pool threads, five concurrent `pbkdf2` calls means one waits. A login endpoint under load can look "slow" while CPU sits idle at 25%. Raising `UV_THREADPOOL_SIZE` is a legitimate fix.

::deep
### Scaling past one thread

Options, from simplest:

1. **More processes.** Run one Node process per core — the `cluster` module, PM2, or simply more containers behind a load balancer. Processes share nothing, which is a feature.
2. **Worker threads.** `worker_threads` gives real threads with their own V8 isolates, communicating via messages (and optionally `SharedArrayBuffer`). Good for CPU-bound tasks like parsing, image processing, or crypto that must stay in-process.
3. **Offload.** Push heavy work to a queue (BullMQ, SQS) and let separate workers process it. The API stays snappy; the user polls or gets notified.

### Measuring blockage

`perf_hooks.monitorEventLoopDelay()` reports event-loop lag. If p99 delay climbs to hundreds of milliseconds, something is blocking. Common culprits: `JSON.parse` on huge payloads, synchronous `fs` calls, catastrophic regex backtracking, and big `Array.sort`s in hot paths.

### Why this design won

The thread-per-request model (classic Apache, older Java servers) costs memory per connection and context-switching overhead. Node's model, inspired by nginx and earlier evented servers, handles huge numbers of mostly-idle connections — exactly what chat, streaming and API gateways need. The trade-off is that CPU work must be treated as a special case.

::myths
- Node can't use multiple cores || It can — via multiple processes or worker threads. A single process's JavaScript just runs on one thread.
- All async functions in Node use the thread pool || Network I/O uses the OS's async notifications; the pool handles mainly file system, DNS lookup and some crypto/zlib work.
- `async` makes CPU work non-blocking || An `async` function full of synchronous computation blocks exactly as much as a normal one.

::facts
- Ryan Dahl introduced Node.js at JSConf EU in 2009, demonstrating it with a simple, fast evented HTTP server.
- Since Node 15, unhandled promise rejections crash the process by default instead of printing a warning.

::realworld
- API servers and BFFs (backend-for-frontend) that mostly orchestrate other services.
- Real-time apps: chat, collaborative editing, WebSocket gateways.
- Build tooling — though many modern tools (esbuild, SWC, Rolldown) moved hot paths to Go or Rust precisely for CPU-bound speed.

::check
A Node login endpoint hashes passwords with `crypto.pbkdf2` (async). Under load, logins queue up even though CPU usage is only ~25% on an 8-core machine. What's the most likely cause?
- [ ] The event loop is blocked by `pbkdf2`
- [x] The libuv thread pool (4 threads by default) is saturated
- [ ] Node can only use one CPU core for crypto
- [ ] The database is slow
> Async `pbkdf2` runs on the libuv thread pool. With the default of 4 threads, only four hashes run at once; the rest queue. Four busy cores out of eight-plus is roughly that 25%. Raising `UV_THREADPOOL_SIZE` or adding processes fixes it.
