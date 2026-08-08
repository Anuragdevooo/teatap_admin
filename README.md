# Teatap · Admin Console

The web admin console for **Teatap** — the tea management system whose Flutter app
lives in `d:/new_project/teashop`. This repository is **UI/UX only**: there is no
backend, no Firebase and no network call. Data comes from a seeded fixture module,
but every action in the console is wired to a real in-memory store, so blocking a
vendor or changing a plan actually changes the numbers everywhere else.

```bash
npm install
npm run dev        # http://localhost:5175 (next free port if taken)
npm run build      # type-check + production bundle
npm run typecheck
```

---

## Scope

This console manages the **platform**, not the tea. What a vendor sells is the
vendor's business; the admin's questions are *who is on the platform, how fast is
that growing, and what does it earn us.* So there is no catalogue, no order entry
and no customer invoicing here — those live in the vendor's own app.

| Screen | Route | What it does |
|---|---|---|
| Dashboard | `/` | Users, vendor growth, MRR, blocked accounts, activity |
| Vendors | `/vendors` | Tenant list + detail drawer; add, edit, block, delete |
| Customers | `/customers` | Add, edit, block, settle dues, filter by vendor |
| All users | `/users` | Admins, vendors, customers; edit, block, flag, reset password |
| Vendor growth | `/leaderboard` | Vendors ranked by customer base, growth or revenue |
| Subscriptions | `/subscriptions` | Billing cycles, per-vendor plan management, revenue by period |
| Plans | `/plans` | The plan catalogue — add and edit tiers, price, seats, features |
| Device seats | `/devices` | Seat usage against each plan's allowance |
| Platform billing | `/billing` | Subscription invoices + receipts, weekly/monthly/yearly totals |
| Chat | `/chat` | Message vendors and customers directly |
| Notifications | `/notifications` | Broadcast history + compose with a live preview |
| Support | `/support` | Tickets raised by vendors |
| Releases | `/releases` | App version control — rollout, adoption, force-update floor |
| Settings | `/settings` | Profile, appearance, alerts, security |
| Sign in | `/login` | Split-screen auth (pre-filled, verifies nothing) |

<kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> opens the command palette anywhere.
<kbd>/</kbd> jumps to the search box on any list.

---

## Architecture

```
src/
├─ app/               theme provider, navigation config
├─ store/             the mutable store + every action the console can perform
├─ components/
│  ├─ ui/             primitives — Button, Card, Modal, Drawer, Tabs, Toast, …
│  ├─ data/           DataTable + useDataTable, Toolbar, Pagination, StatTile
│  ├─ charts/         hand-rolled SVG: Area, Bar, Donut, Sparkline
│  └─ layout/         AppShell, Sidebar, Topbar, CommandPalette, PageHeader
├─ features/          one folder per screen; pages compose, they don't define UI
├─ lib/               cn, formatters, hooks
├─ mocks/seed.ts      deterministic fixtures
├─ types/domain.ts    the domain model
└─ styles/index.css   the entire design system
```

**Four rules hold the structure together.**

1. **Features never define visual primitives.** A page composes `@/components/ui`
   and `@/components/data`. If a page needs a new visual element, it belongs in the
   primitive layer, where every other page gets it too.
2. **Everything imports through a barrel** (`@/components/ui`), never a deep path,
   so primitives can be split or renamed without touching a feature file.
3. **One store, one set of actions.** Screens read via `useStore()`; mutations go
   through `store/actions.ts`. Nothing owns a private copy of a vendor.
4. **Actions keep derived state consistent.** Blocking a vendor also moves its
   subscription to past due and blocks its operator login — because that is what
   the platform would really do. Editing the Pro plan re-prices every vendor on it
   and re-issues their device seats. That logic lives in one action, not spread
   across three screens that can drift apart.

### State

A hand-rolled observable read through `useSyncExternalStore` — not Redux, not
Zustand. The surface needed is one object and a notify loop, and
`useSyncExternalStore` already gives tearing-free reads. Hydration is deliberately
delayed ~400 ms so skeleton and empty states stay exercised instead of rotting
behind synchronous data.

### Design system

All colour, type, radius, shadow and motion tokens live in
[`src/styles/index.css`](src/styles/index.css) — nothing else in the codebase
contains a literal colour.

- **Raw palette → semantic tokens → Tailwind utilities.** `--brand-600` feeds
  `--primary`, exposed as `bg-primary`. Re-skinning is one block, not a grep.
- **Dark mode is a token swap, not variant sprawl.** `@theme inline` keeps the
  `var()` reference live, so `bg-surface` re-resolves when `.dark` flips. Almost no
  component carries a `dark:` class.
- **Theme is applied pre-paint** by an inline script in `index.html`, so dark-mode
  users never see a white flash.
- The brand palette is taken from the Teatap logo — the forest green of the
  wordmark, the terracotta of the cup.

### Motion

Staggered list and tile entrances (`--i` drives the delay), animated KPI counters
that tween between values so you can see *which* number moved, a route transition
keyed on the pathname, charts that draw themselves on, and a 2px hover lift on
interactive surfaces. All of it collapses under `prefers-reduced-motion`.

### Charts

Hand-rolled SVG rather than a charting library: the surface needed is small (four
forms), and owning the markup means every mark inherits the CSS theme tokens and
repaints instantly on a theme flip — something a canvas library can't do.

They draw in **measured pixels** (`useElementWidth`), not a stretched `viewBox`, so
corner radii stay square and hover markers stay circular at any width.

The categorical palette was validated with the `dataviz` checker and passes all six
checks — lightness band, chroma floor, CVD separation, normal-vision separation and
contrast — in **both** modes:

| | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| light (on `#fcfcfb`) | `#1b7a2e` | `#2563eb` | `#c4651e` | `#b3308c` | `#8a8f14` |
| dark (on `#131818`) | `#35a349` | `#5b8def` | `#d4783a` | `#d75aa8` | `#8f9430` |

Series order is fixed and never cycled. Two or more series always get a legend; a
single series gets none (the card title names it). Every chart ships a screen-reader
`<table>` alternative.

Two form choices worth calling out, because the obvious option was wrong:

- **Never two scales on one axis.** Customers run in the thousands and vendors in
  the tens; plotting both against a shared axis flattens the vendor line onto zero.
  Those are **small multiples** — two charts, each with its own scale, sharing an
  x-axis.
- **No donut for lopsided splits.** At 99 / 1 / 0 every segment but one collapses to
  a hairline and the ring says nothing. `CompositionBar` renders a stacked bar with
  a minimum segment width and puts the real numbers in rows beneath it.

Axis labels thin themselves to fit the measured width, and bar labels are centred
on their band rather than spread edge-to-edge, so a label always sits under the
mark it names.

Every chart carries a **Weekly / Monthly / Yearly** control, and the revenue views
add a **year** picker. These re-bucket the underlying records (`src/lib/period.ts`)
rather than relabelling a fixed array — growth series are cumulative, revenue
series are per-bucket sums, and buckets are calendar-aligned so "this month" means
the month on the wall.

### Accessibility

Keyboard-only focus rings, `aria-sort` on sortable headers, labelled icon-only
buttons, `role="switch"`/`role="dialog"` semantics, `prefers-reduced-motion`
honoured globally, and status never carried by colour alone — every badge pairs its
colour with a word.

---

## Swapping in a real backend

Replace the body of `src/store/store.ts`'s `hydrate()` with `fetch` calls, and make
each action in `src/store/actions.ts` `POST`/`PATCH` before it patches state.
Nothing above those two files changes — no component imports a fixture directly.

---

*UI preview build. The data is fixtures, not a database, and nothing survives a page
reload. But the actions are real: block a vendor and its subscription, its operator
login, the dashboard counts and the device table all move together.*
#   t e a t a p _ a d m i n  
 #   t e a t a p _ a d m i n  
 