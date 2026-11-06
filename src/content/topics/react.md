---
slug: react
title: React
category: development
aliases: ReactJS, React.js, JSX, hooks, virtual DOM, components
tagline: A JavaScript library for building user interfaces out of small, reusable components.
level: beginner
minutes: 5
concepts: react-useeffect, js-event-loop, typescript-structural-typing
related: javascript, typescript, rest-apis
popular: true
---
::what
React is a JavaScript library, made at Meta and open-sourced in 2013, for building user interfaces. You describe what the screen should look like for a given piece of data, and React works out how to update the page when that data changes.

::why
Before React, most interactive pages were built by manually poking the DOM: find this element, change its text, hide that one, add a class. That works for a button. It falls apart for a feed, a chat window or a dashboard, where dozens of things depend on the same data and it's easy to forget one. React flips it around: you stop writing *how* to change the page and start writing *what* the page should be.

::how
You build the UI out of **components**: functions that take inputs (**props**) and return markup, usually written in **JSX**. A component can hold its own **state**. When state changes, React calls the component again to get the new markup, compares it with the previous version, and applies only the differences to the real DOM. That comparison step is called **reconciliation**.

::where
- Web apps at Meta (Facebook, Instagram web), Netflix, Airbnb, Atlassian and many more
- React Native, which uses the same model to build iOS and Android apps
- Frameworks built on top of it: Next.js, Remix, Gatsby
- Internal dashboards and admin tools, where component libraries save a lot of time

::know
- **Components** are the unit of everything. A page is a tree of components.
- **Props** flow down from parent to child and are read-only. **State** is owned by a component and changes over time.
- **UI is a function of state.** Change the state, and React re-renders. Don't edit the DOM yourself.
- **Hooks** (`useState`, `useEffect`, `useMemo`…) let function components hold state and run side effects. They must be called in the same order on every render.
- React is a **library, not a full framework**. Routing, data fetching and builds usually come from other tools or from a framework like Next.js.

::analogy
Think of React like a set designer working from a script. You hand over the script ("in this scene, the cart has 3 items"). The designer looks at the current stage, works out what's different and moves only the props that need moving. You never tell them which chair to carry.

::talk10
React is a JavaScript library for building UIs out of components. You describe what the screen should look like for the current data, and React efficiently updates the page when that data changes.

::talk30
React lets you build an interface as a tree of components, small functions that take props and return what should be on screen. Each component can hold state, and when state changes React re-runs the component, compares the new output with the old one and updates only the parts of the DOM that actually changed. The big idea is that UI becomes a function of state, so you stop manually syncing the page with your data. It's a library rather than a full framework, which is why people often pair it with something like Next.js for routing and server rendering.

::comebacks
- Isn't React a framework? || It's usually called a library. It handles the view layer, and you pick or get routing, data fetching and builds from elsewhere, often from a framework like Next.js.
- Is the virtual DOM what makes React fast? || Partly. It's more that it lets React batch and minimise real DOM updates. The real performance win is that you don't write that diffing logic by hand.
- React vs Angular? || Angular is a full framework with opinions on everything. React is smaller and leaves more choices to you. Both are fine; teams pick based on how much structure they want out of the box.

::facts
- React was first deployed on Facebook's News Feed in 2011 and open-sourced in May 2013.
- JSX isn't required. It compiles to plain function calls, which is why it looks like HTML but behaves like JavaScript.
- Hooks arrived in React 16.8 (2019) and made class components mostly optional.

::deeper
### Reconciliation in one paragraph
When state changes, React builds a new tree of elements and compares it to the previous one. If an element's type changes (a `div` becomes a `section`), React throws away that subtree and rebuilds it. If the type is the same, it updates the changed attributes and recurses. For lists, the `key` prop tells React which item is which, so it can move items instead of recreating them. That's why using an array index as a key causes bugs when items get reordered.

### Rendering is not painting
"Re-render" means React called your component function again. It does not mean the browser repainted the screen. If the output is identical, nothing touches the DOM. Unnecessary re-renders cost CPU, which is when `memo`, `useMemo` and `useCallback` help. Most apps don't need them everywhere.

### A component, end to end
```jsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
}
```
Clicking calls `setCount`, React schedules a re-render, `Counter` runs again with the new `count`, and only the button text changes in the DOM.

### Trade-offs
- **Flexibility vs decisions:** you choose your own router, state library and styling, which is freeing and also means more decisions.
- **Client-side cost:** a large React bundle can slow first load. Server rendering and React Server Components exist largely to address this.
- **Effects are easy to misuse:** many bugs come from using `useEffect` for things that could be derived during render.

::sources
- [React docs: Thinking in React](https://react.dev/learn/thinking-in-react)
- [React docs: Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state)
- [React docs: You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect)

::check
A list renders items with `key={index}`. You insert a new item at the top. What's the most likely problem?
- [ ] React throws an error about duplicate keys
- [x] State inside list items (like an input's text) shifts to the wrong row
- [ ] The list doesn't re-render at all
- [ ] Nothing, index keys are the recommended default
> Keys tell React which item is which between renders. With index keys, the old item 0 and the new item 0 look like the same component, so per-item state stays at that position while the data moves. Use a stable id from your data instead.

::interview
=== q: What is React and why would you use it? | level: beginner | pro: false
#answer
1. A JavaScript library for building user interfaces, maintained by Meta.
2. You build the UI from reusable components that take props and hold state.
3. It's declarative: you describe the UI for a given state, and React handles the DOM updates.
4. Benefits: predictable UI, reusable components, a huge ecosystem, and React Native for mobile.
#short
React is a library for building UIs out of components. Instead of manually updating the page, I describe what it should look like for the current state and React updates the DOM for me. That makes complex interfaces much easier to reason about.
#detail
Interviewers usually want three things here: that you know it's a *library* focused on the view layer, that you understand the *component model*, and that you can explain *declarative* UI. A good concrete example helps: "In a todo app I don't write code to add an `li` to the list. I add the item to state and React renders the new list."
#followups
- Library or framework? || A library for the view layer. Frameworks like Next.js add routing, data fetching and server rendering on top.
- What is JSX? || A syntax extension that compiles to `React.createElement` (or the newer JSX runtime) calls. It looks like HTML but it's JavaScript.
#mistakes
- Saying React is a framework without qualification
- Listing features without explaining the declarative idea
- Claiming the virtual DOM is the only reason it's fast

=== q: What is the virtual DOM and what is reconciliation? | level: intermediate | pro: false
#answer
1. The virtual DOM is a lightweight JavaScript description of what the UI should look like.
2. On each render, React produces a new description and compares it with the previous one.
3. That comparison is reconciliation. It applies only the necessary changes to the real DOM.
4. Keys help React match list items between renders.
#short
The virtual DOM is just React's in-memory description of the UI. When state changes, React builds a new one, diffs it against the old one, and only patches what changed in the real DOM. That diffing process is called reconciliation.
#detail
React's diff isn't a perfect tree comparison, which would be too slow. It uses two heuristics: elements of different types produce different trees, so React rebuilds that subtree; and for lists, the `key` prop identifies items across renders. Mention that the virtual DOM is not magic speed. It's a way to keep a declarative model while keeping DOM work small.
#followups
- Why are keys important? || They let React match items across renders. Without stable keys, it may reuse the wrong component and its state.
- Is the virtual DOM faster than the real DOM? || Not inherently. It avoids unnecessary real DOM work, which is the expensive part.
#mistakes
- Saying the virtual DOM is a copy of the real DOM that renders to the screen
- Forgetting to mention keys
- Using "re-render" and "repaint" as if they mean the same thing

=== q: What's the difference between props and state? | level: beginner | pro: false
#answer
1. Props are inputs passed from a parent. The child treats them as read-only.
2. State is data a component owns and can change over time.
3. Changing either one causes a re-render.
4. If two components need the same data, lift the state up to their common parent and pass it down as props.
#short
Props are what a parent gives a component, like function arguments, and the component shouldn't change them. State is the component's own memory that it can update. When either changes, the component re-renders.
#detail
A good answer includes "lifting state up": if a filter box and a list both care about the search text, the text lives in their parent as state and is passed to both as props. That shows you understand data flowing one way, which is central to React.
#followups
- Can a child change its props? || Not directly. The parent can pass a callback, and the child calls it to ask the parent to change its state.
- When would you use context? || When many components at different depths need the same data, like a theme or the current user, and passing props through every level becomes noisy.
#mistakes
- Mutating props or state directly instead of using the setter
- Putting everything in global state by default

=== q: How does useEffect work, and when should you not use it? | level: intermediate | pro: true
#answer
1. `useEffect` runs a side effect after React commits the render to the screen.
2. The dependency array controls when it re-runs: no array means every render, `[]` means once after mount, `[a, b]` means when a or b changes.
3. The returned function is cleanup. It runs before the effect re-runs and on unmount.
4. Don't use it to derive data from props or state. Compute that during render.
#short
useEffect is for syncing a component with something outside React, like a subscription, a timer or a network request. It runs after render, re-runs when its dependencies change, and can return a cleanup function. If I'm just calculating a value from state, I don't need an effect at all.
#detail
In development with Strict Mode, React mounts, unmounts and mounts again, so effects run twice. That surfaces missing cleanup. Common bugs are stale closures from missing dependencies, and race conditions when a slow fetch resolves after a newer one. The fix for the race is a cleanup flag or an `AbortController`.
#followups
- Why does my effect run twice in development? || Strict Mode remounts components to check that effects clean up properly. It doesn't happen in production.
- How do you avoid fetch race conditions? || Set an `ignore` flag or abort the request in the cleanup function, so a stale response doesn't overwrite newer data.
#mistakes
- Using an effect plus state to compute derived values
- Leaving out dependencies to "stop it re-running"
- Forgetting cleanup for intervals and subscriptions

=== q: What happens when a React component re-renders? | level: advanced | pro: true
#answer
1. A re-render is triggered by a state change, a parent re-rendering or a context value changing.
2. React calls the component function again and gets new elements.
3. It reconciles them against the previous output (the render phase).
4. It applies DOM changes and then runs effects (the commit phase).
5. By default, children re-render when their parent does, unless memoised.
#short
When state changes, React calls the component again, which re-renders its children too by default. It compares the new output with the old, then commits only the real DOM changes and runs effects. A re-render doesn't necessarily mean the DOM changed.
#detail
Split it into the render phase (pure, can be paused or restarted in concurrent rendering) and the commit phase (DOM mutations, layout effects, then effects). Mention that `React.memo` skips a child's re-render if its props are shallow-equal, and that `useMemo` and `useCallback` help keep those props stable. Mention batching: several state updates in one event produce one re-render.
#followups
- Does setState update immediately? || No. It schedules a re-render, and the new value is visible on the next render.
- How do you find unnecessary re-renders? || The React DevTools Profiler shows what rendered and why.
#mistakes
- Thinking a re-render always touches the DOM
- Wrapping everything in memo without measuring
