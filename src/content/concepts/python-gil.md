---
slug: python-gil
title: Python's GIL, and why it's finally optional
topic: languages
difficulty: advanced
minutes: 6
pro: false
related: nodejs-event-loop, js-event-loop, llm-tokens
---
::dek
For thirty years one lock decided that Python threads take turns. Here's what it protects, when it hurts, and what changed in 3.13.

::hook
Ask why Python threads don't speed up number-crunching and someone will say "the GIL" like it's a curse. It's actually a pragmatic engineering trade-off that made CPython simple, fast for single-threaded code, and easy to extend in C. The interesting question isn't "why does it exist?" but "why was it so hard to remove?"

::yap
The GIL doesn't stop Python from doing many things at once — it stops it from *computing* many things at once. For I/O, threads are fine; for CPU, use processes or the new free-threaded build.

::basics
The **Global Interpreter Lock** is a lock inside CPython (the standard Python interpreter). Only the thread holding it can run Python code. Threads take turns.

What that means in practice:

- **I/O-bound work** (web requests, database calls, reading files): threads work well. While one thread waits for the network, it releases the GIL and another runs.
- **CPU-bound work** (parsing, maths, image processing in pure Python): threads don't help. Eight threads still execute one at a time.

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Good: downloading 50 URLs — mostly waiting
with ThreadPoolExecutor(10) as ex:
    pages = list(ex.map(fetch, urls))

# Good: CPU-heavy work — separate processes, separate GILs
with ProcessPoolExecutor() as ex:
    results = list(ex.map(crunch, chunks))
```

Processes each have their own interpreter and their own GIL, so they truly run in parallel — at the cost of more memory and data copying between them.

::hood
### What the GIL actually protects

CPython manages memory with **reference counting**: every object tracks how many references point to it, and is freed when the count hits zero. Incrementing and decrementing those counts from multiple threads without coordination would corrupt memory. One big lock is the simplest way to make every refcount change safe — and it's cheaper than locking each object individually.

It also made C extensions easy: extension authors could assume no other Python code runs while they hold the GIL.

### When it's released

- During blocking I/O (sockets, files, `time.sleep`).
- Periodically: the interpreter asks the running thread to drop the GIL every 5ms by default (`sys.getswitchinterval()`), so other threads get a turn.
- By C extensions doing long computations. NumPy releases it inside many array operations, which is why NumPy-heavy code *can* benefit from threads.

### It doesn't make your code thread-safe

The GIL protects the interpreter's internals, not your logic. `counter += 1` is several bytecode operations; a thread switch can happen between them. You still need `threading.Lock` for shared mutable state.

::deep
### PEP 703 and free-threaded Python

Python 3.13 (October 2024) shipped an experimental **free-threaded build** (`python3.13t`) with the GIL removed, the result of PEP 703 by Sam Gross. In 3.14 the free-threaded build became officially supported (no longer experimental), though the default build still has the GIL. Making it work required:

- **Biased reference counting**: the owning thread updates refcounts cheaply; other threads use atomic operations.
- **Immortal objects** (PEP 683): objects like `None` and small ints never get refcounted, removing contention on the hottest objects.
- **Per-object locks** for built-in containers like `dict` and `list`.
- A new memory allocator (mimalloc) that's thread-safe.

The cost: single-threaded code runs somewhat slower in the free-threaded build, and C extensions must be rebuilt and audited for thread safety. The ecosystem is migrating gradually.

### Other routes around the GIL

- **Subinterpreters** (PEP 734, `concurrent.interpreters` in 3.14): multiple interpreters in one process, each with its own GIL.
- **asyncio**: one thread, cooperative concurrency — excellent for many concurrent I/O operations, no help for CPU.
- **Native code**: Rust (via PyO3), Cython, or Numba releasing the GIL for hot loops.

### Why removal took 30 years

Earlier attempts (Greg Stein's 1999 patch, Larry Hastings' "Gilectomy") made single-threaded Python significantly slower. Guido van Rossum's long-standing condition was that removing the GIL must not slow down single-threaded code much. PEP 703's techniques finally got the penalty low enough to be acceptable.

::myths
- Python threads are fake || They're real OS threads. They just can't execute Python bytecode simultaneously in the default build.
- The GIL makes my code thread-safe || It protects interpreter internals. Your read-modify-write operations can still race.
- asyncio removes the GIL problem || asyncio is single-threaded concurrency. It's great for I/O but doesn't parallelise CPU work.

::facts
- PyPy and CPython both have a GIL; Jython and IronPython never did.
- Ruby's main interpreter has an equivalent lock, called the GVL.

::realworld
- Web servers like Gunicorn run multiple worker *processes* precisely to use every core.
- Data pipelines use `multiprocessing` or Dask/Ray for CPU-heavy transforms.
- ML training loops spend their time in C/CUDA code that releases the GIL, which is why Python dominates ML despite it.

::check
A Python script resizes 1,000 images using a pure-Python library. Which change is most likely to make it use all 8 cores (default CPython build)?
- [ ] Use `threading` with 8 threads
- [x] Use `ProcessPoolExecutor`
- [ ] Rewrite it with `asyncio`
- [ ] Increase `sys.setswitchinterval`
> CPU-bound pure-Python work needs separate interpreters to run in parallel. Processes each have their own GIL. Threads and asyncio would still execute the resizing one step at a time.
