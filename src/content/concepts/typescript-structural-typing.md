---
slug: typescript-structural-typing
title: TypeScript checks shapes, not names
topic: languages
difficulty: intermediate
minutes: 5
pro: false
related: js-event-loop, rest-idempotency
---
::dek
If it has the right properties, it fits. Structural typing is why TypeScript feels flexible — and why a UserId can quietly become an OrderId.

::hook
In Java or C#, a `Dog` is only a `Dog` if you declared it so. TypeScript doesn't care what you called something; it cares what it *has*. This one design decision explains half of TypeScript's ergonomics and most of its surprises.

::yap
TypeScript doesn't ask "what is this?", it asks "what can this do?". Two types with the same shape are the same type — whatever you named them.

::basics
TypeScript compares types by their **structure** — their properties and methods — not by their names.

```ts
interface Point { x: number; y: number }

function print(p: Point) { console.log(p.x, p.y) }

const location = { x: 10, y: 20, label: 'office' }
print(location) // ✅ fine — it has x and y
```

`location` was never declared as a `Point`. It doesn't matter. It has `x: number` and `y: number`, so it fits. Extra properties are allowed when you pass a variable.

This matches how JavaScript is actually written: objects are created ad hoc, passed around, and used for what they contain. It's sometimes called "duck typing, checked at compile time": if it walks like a duck…

The flip side:

```ts
type Email = string
type Password = string
function login(email: Email, password: Password) {}
login(password, email) // ✅ compiles. Oops.
```

Both are just `string`. The names are aliases, not new types.

::hood
### Excess property checks: the one exception

```ts
print({ x: 1, y: 2, label: 'x' })
// ❌ Object literal may only specify known properties
```

Fresh object literals get an extra check, because a property that doesn't exist on the target is probably a typo (`colour` vs `color`). Assign it to a variable first and the check disappears — the object is no longer "fresh".

### Assignability goes one way

A type with *more* properties is assignable to one with *fewer* (it's a subtype). Not the other way round. `{ x, y, z }` fits where `{ x, y }` is expected; `{ x }` doesn't.

### Functions are compared structurally too

```ts
type Handler = (e: MouseEvent) => void
const log: Handler = () => console.log('clicked') // ✅ fewer params is fine
```

Ignoring parameters is always safe, so a function that takes fewer arguments is assignable. That's why `array.forEach(x => …)` works even though `forEach` passes three arguments.

### Classes are structural as well

Two classes with identical public members are interchangeable to the type checker — unless they have `private` or `#private` members, which make the class effectively nominal.

::deep
### Branded types: opting into nominal typing

When mixing up IDs would be a real bug, add a phantom property that no plain string has:

```ts
type UserId = string & { readonly __brand: 'UserId' }
type OrderId = string & { readonly __brand: 'OrderId' }

const UserId = (s: string) => s as UserId

function cancel(id: OrderId) {}
cancel(UserId('u_1')) // ❌ Type 'UserId' is not assignable to 'OrderId'
```

There's no runtime cost — the brand exists only in the type system. Libraries like zod and Effect offer brand helpers; validation at the boundary is the natural place to mint branded values.

### Variance and the method bivariance hole

TypeScript checks function parameters contravariantly under `strictFunctionTypes` — but **methods** declared with method syntax are still checked bivariantly for compatibility with existing JS patterns. That's a deliberate soundness gap. TypeScript's design goals explicitly do not include a provably sound type system; usefulness for real JavaScript wins.

### Why structural?

TypeScript had to describe existing JavaScript, where objects are open and created everywhere without classes. A nominal system would have forced declarations everywhere and broken interop with untyped code. Go chose structural interfaces for a similar reason: decoupling. A type satisfies an interface without importing it.

### Practical consequences

- Mocks in tests are easy: any object with the right shape works.
- API response types must be validated at runtime — the compiler trusts your `as User`, it doesn't check the JSON.
- Refactors that rename types don't break anything; refactors that change shapes do.

::myths
- Declaring `type UserId = string` makes a new type || It's an alias. It's interchangeable with every other string.
- TypeScript checks your API responses || Types are erased at runtime. `res.json() as User` is a promise you make, not a check TypeScript does.
- Extra properties are always errors || Only on fresh object literals. Variables with extra properties are fine.

::facts
- TypeScript's official design goals list "apply a sound or provably correct type system" as a **non-goal**.
- Go, OCaml's object system and Elm records are also structurally typed; Java, C# and Rust are nominal.

::realworld
- Branded IDs in large codebases to stop cross-entity ID bugs.
- Validating external data with zod/valibot and inferring types from the schema.
- Writing lightweight test doubles without mocking frameworks.

::check
```ts
interface Named { name: string }
const p = { name: 'Asha', age: 31 }
const n: Named = p
```
Does this compile?
- [x] Yes — `p` has a `name: string`, and extra properties are fine for a non-literal
- [ ] No — `age` is an excess property
- [ ] No — `p` was never declared as `Named`
- [ ] Only with `strict: false`
> Structural typing: `p`'s shape includes everything `Named` needs. Excess property checks only apply to object literals written directly at the assignment.
