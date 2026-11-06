# Design system — Editorial minimalism

Tokens live in `src/styles/index.css` (`@theme`).

## Colour
| Token | Hex | Use |
|---|---|---|
| paper | #F3EFE6 | page background |
| paper-2 | #EAE5D9 | wells, inline code, banners |
| card | #FBF9F4 | interactive surfaces (options, forms) |
| ink | #16140F | text, rules, primary buttons, inverted panels |
| ink-2 / muted / faint | #3B372E / #6E685B / #9C9585 | secondary text tiers |
| line / line-2 | #D8D1C1 / #C5BCA8 | hairlines, input borders |
| accent | #E5482A (vermilion) | the one colour: kickers, active states, streak, CTAs |
| good / bad | #2F7A4F / #B8321A | answer feedback only |

## Type
- **Fraunces** (display): headlines and numbers; tight tracking, opsz 144.
- **Newsreader** (serif): long-form reading and deks. 20px/1.6 desktop, 18px mobile.
- **Geist** (sans): UI, buttons, labels.
- **JetBrains Mono**: code, kickers (11px, uppercase, 0.14em), metadata.

## Layout
- Max content 1180px; reading column ≤720px with a margin column on desktop.
- Structure by **rules, not boxes**: 1px ink rules under section heads, hairlines between rows. Bordered surfaces only for interactive units (options, plan cards, locks).
- Radius 3px (buttons/inputs), 6px code blocks. Hard offset shadows (`4px 4px 0 ink`) only for selected or featured elements.

## Components
`btn-primary` (ink), `btn-accent` (vermilion), `btn-ghost` (outline), `btn-quiet`; `chip`; `pro-tag`; `option` with correct/wrong/dim states; `codeblock` (dark, copy button, lightweight highlighter); `ProLock`; `PageHead` masthead.

## Navigation
Desktop: numbered sidebar (01–06) with streak and plan. Mobile: sticky top bar (logo, Pro, tracks, streak) and a 5-item bottom nav with an accent bar on the active item; the level switcher sticks under the top bar while reading.

## Motion
One 350ms rise on reveals, a blinking caret in the logo, the topic ticker. All disabled under `prefers-reduced-motion`.
