---
slug: typescript
title: TypeScript
category: development
aliases: TS, types, static typing, tsc
tagline: JavaScript with static types, checked before your code runs and erased when it ships.
level: beginner
minutes: 4
concepts: typescript-structural-typing
related: javascript, react
popular: true
---
::what
TypeScript is a superset of JavaScript, made by Microsoft in 2012, that adds static types. You write `.ts` files with type annotations, the TypeScript compiler checks them, and then the types are removed to produce plain JavaScript. Browsers and Node never see the types.

::why
JavaScript lets you pass anything anywhere. In a 200-line script that's fine. In a codebase with 50 developers it means renaming a field breaks something three folders away and nobody finds out until production. TypeScript catches that class of mistake in the editor.

::how
You describe the shape of your data with types and interfaces. The compiler checks every use against those shapes. A lot of it is **inferred**, so you don't annotate everything. TypeScript's typing is **structural**: if an object has the right properties, it fits the type, regardless of what it's called.

::where
- Most new front-end projects (React, Angular, Vue, Svelte)
- Node.js back ends and serverless functions
- Library type definitions, which power editor autocomplete even for JavaScript users
- Large codebases at companies like Microsoft, Google, Airbnb and Slack

::know
- **Types exist only at compile time.** At runtime it's just JavaScript, so it doesn't validate API responses for you.
- **Structural typing:** shape matters, not names.
- **`any` turns checking off.** `unknown` is the safe alternative; you have to narrow it before use.
- **Union types and narrowing** (`string | null`, then `if (x)`) handle most real-world cases.
- **Generics** let you write reusable functions that keep type information, like `Array<T>`.

::analogy
TypeScript is a spell-checker for your code's data. It underlines the mistake while you type, and it isn't part of the printed document.

::talk10
TypeScript is JavaScript with types. It catches mistakes like wrong property names or missing null checks while you're writing code, and then it compiles down to normal JavaScript.

::talk30
TypeScript adds a static type system on top of JavaScript. You describe what your data looks like, the compiler checks every use, and your editor gets much better autocomplete and refactoring. The types are erased at build time, so there's no runtime cost, but that also means it can't validate data coming from outside, like API responses. You still need runtime validation for that, often with a library like Zod. Its typing is structural, so anything with the right shape fits.

::comebacks
- Doesn't it slow you down? || A little at the start. On a team or a big codebase, it usually saves more time than it costs, mainly on refactors.
- Does TypeScript make code faster? || No. Types are removed, so runtime performance is the same as JavaScript.
- Is it a different language? || It's JavaScript plus types. Valid JavaScript is very close to valid TypeScript.

::facts
- Anders Hejlsberg, who led TypeScript, also designed C# and Turbo Pascal.
- TypeScript's type system is Turing-complete, which is why people build games out of types for fun.
- Node.js can now run TypeScript files directly by stripping the types.

::deeper
### Structural typing in practice
```ts
interface Point { x: number; y: number }
const p = { x: 1, y: 2, label: 'a' }
const q: Point = p // OK: it has x and y
```
Assigning an object literal directly with an extra property is flagged ("excess property check"), but a variable is not. That catches typos without breaking structural typing.

### Narrowing
```ts
function len(x: string | string[]) {
  return typeof x === 'string' ? x.length : x.join('').length
}
```
The compiler follows your `if`, `typeof`, `in` and discriminant checks to know the type in each branch.

### Trade-offs
- Complex generic types can become hard to read. Prefer simple types that people can maintain.
- Types can lie if data comes from outside. Validate at the boundaries.

::sources
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript handbook: Type compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

::check
Your API returns JSON, and you type it as `User` with `as User`. The server sends a field as `null` when the type says `string`. What happens?
- [ ] TypeScript throws a runtime error
- [ ] The build fails
- [x] Nothing at first; you get a runtime bug when code uses it as a string
- [ ] TypeScript converts null to an empty string
> Types are erased at runtime, and `as` tells the compiler to trust you. Nothing checks the real data. Validate external data at runtime if it matters.

::interview
=== q: What is TypeScript and why use it over JavaScript? | level: beginner | pro: false
#answer
1. A typed superset of JavaScript that compiles to JavaScript.
2. Catches type errors at compile time, before the code runs.
3. Better editor support: autocomplete, safe refactoring, inline docs.
4. Types are erased, so there's no runtime cost and no runtime checking.
#short
TypeScript is JavaScript with static types. It catches a whole class of bugs in the editor and makes refactoring safer, and it compiles away to plain JavaScript, so there's no runtime cost.
#detail
Strong answers mention the trade-off: it's a compile-time tool. Data from APIs, forms or local storage still needs runtime validation. Mentioning `strict` mode and avoiding `any` shows you've used it seriously.
#followups
- What's the difference between `any` and `unknown`? || Both accept anything. `any` turns off checking; `unknown` forces you to narrow the type before using it.
- Interface vs type alias? || They overlap a lot. Interfaces can be extended and merged; type aliases can express unions and mapped types. Pick one convention per codebase.
#mistakes
- Claiming TypeScript validates data at runtime

=== q: What is structural typing? | level: intermediate | pro: false
#answer
1. Types are compatible if their shapes match, regardless of their names.
2. Opposite of nominal typing (Java, C#), where the declared type name matters.
3. Makes JavaScript patterns like plain objects work naturally.
#short
In TypeScript, if something has the properties a type needs, it fits that type. The name doesn't matter, only the shape. Java is the opposite: it checks declared names.
#detail
Mention the practical consequence: two different types with the same shape are interchangeable, which can hide mistakes, like passing a `UserId` where an `OrderId` is expected if both are just strings. "Branded types" are the common workaround.
#followups
- How do you get nominal-style safety? || Branded types: add a fake unique property like `string & { __brand: 'UserId' }`.
#mistakes
- Confusing structural typing with dynamic typing

=== q: Explain generics with an example. | level: intermediate | pro: true
#answer
1. Generics let a function or type work with many types while keeping the type information.
2. Example: `function first<T>(xs: T[]): T | undefined`.
3. Constraints (`T extends { id: string }`) restrict what T can be.
#short
Generics are type parameters. A function like `first<T>` takes an array of T and returns a T, so if you pass numbers you get a number back, not `any`.
#detail
Real examples help: `useState<T>`, `Promise<T>`, `Array<T>`, or an API helper `get<T>(url): Promise<T>`. Mention that generics should be inferred from arguments most of the time rather than passed explicitly.
#followups
- What does `keyof` do? || It gives a union of an object type's property names, used with generics to type-safe property access.
#mistakes
- Using generics where a plain union type would be simpler
