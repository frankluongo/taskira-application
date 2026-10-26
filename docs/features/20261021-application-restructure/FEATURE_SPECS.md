# Application Restructure — Feature Spec

**Status:** Done · **Date:** 2026-10-21 · **Scope:** `apps/web` (plus `scripts/scaffold.js` and docs)

## 1. Summary

Reorganize `apps/web/src` so that each domain (Habits, Chores, Tasks, Projects, Checklists) is a self-contained folder owning its data access, state, business rules, components, and route. Shared logic that is currently copy-pasted (recurrence, dates, drag-and-drop, notifications) moves into a single place each.

This is a **refactor, not a feature**. No schema changes, and no new dependencies beyond dev tooling (Vitest, Prettier, ESLint). The only user-visible change is fixing the missing page headers (§8 #1, done in Phase 2).

## 2. Goals

1. **Find things by domain.** Everything about Chores lives under one folder.
2. **One source of truth per rule.** Recurrence, "is due today", date formatting, and reorder logic exist exactly once.
3. **Separate the layers.** Supabase calls, Zustand state, pure rules, and React components are distinct files with one job each.
4. **Thin route components.** Pages compose; they don't hold business logic.
5. **Consistent conventions.** One way to export components, import UI, name files, and build page headers.
6. **Testable core.** Domain rules are pure functions that can be unit-tested without React or Supabase.

## 3. Non-goals

- Changing the UI, styling, or any user-facing behavior.
- Changing the Supabase schema, RLS, or auth flow.
- Migrating to TypeScript (the structure here should make that easier later, but it's a separate effort).
- Restructuring `packages/ui`, `apps/tauri`, or `apps/ios`. `@taskira/ui` is already in good shape.
- Fixing the bugs listed in §8, except #1 and #2, which are fixed in Phase 2 (see §9). The rest get separate, deliberate fixes.

## 4. Current state — what makes it hard to reason about

### 4.1 One 439-line store does everything

[apps/web/src/lib/store.js](../../../apps/web/src/lib/store.js) contains, for all five domains at once:

- Zustand state and optimistic updates
- Raw Supabase queries
- Notification scheduling side effects
- Business rules (recurrence advancement, "habits due today", inbox-task deletion on completion)
- Startup data hygiene (deleting expired habits, rolling stale daily chores/tasks forward)
- UI constants (`PRIORITY_LABELS`, `INBOX_PROJECT_ID`)

Every component calls `useStore()` with no selector, so every store change re-renders every subscribed component, and it's impossible to see from a component which slice of state it actually depends on.

### 4.2 The same logic is written several times

| Logic                                                       | Copies                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Recurrence label (`"custom:3:months"` → `"Every 3 months"`) | `ChoreItem.jsx`, `TaskItem.jsx`                                                            |
| Recurrence parsing for forms                                | `ChoreForm.jsx`, `TaskForm.jsx`                                                            |
| Next recurrence date                                        | `store.js` (`nextRecurrenceDate`), duplicated branches in `completeChore` / `completeTask` |
| "Is this habit scheduled on day X"                          | `store.js` (`habitsDueToday`), `notifications.js` (`nextHabitOccurrence`)                  |
| Today as `yyyy-MM-dd`                                       | `store.js` (`today`), `Chores.jsx` (`todayStr`), `lib/date.js` (`getTodayString`)          |
| Habit groups `["AM","Misc","PM"]`                           | `Habits.jsx` (`GROUPS`), `features/Habits/constants` (`HABIT_GROUPS`)                      |
| Drag-end → `arrayMove` → reassign `sort_order` → merge back | `Habits.jsx`, `Chores.jsx`, `Tasks.jsx`, `Projects.jsx`, `ChecklistDetailRoute.jsx`        |
| `DndContext` + sensors setup                                | `DragContext.jsx` exists, but `Chores.jsx` and `ChecklistDetailRoute.jsx` inline their own |
| `useSortable` → style object boilerplate                    | `HabitItem`, `ChoreItem`, `TaskItem`, `ChecklistDetailRoute` (×2)                          |
| Schedule / cancel / reschedule-all notifications            | Three near-identical copies in `notifications.js`                                          |

### 4.3 Inconsistent folder and export conventions

- `features/Habits/` uses `components/`, `constants/`, `functions/` (empty) subfolders; `features/Tasks/` and `features/Chores/` are flat.
- `pages/` mixes flat files with default exports (`Habits.jsx`, `Tasks.jsx`, …) and folders with named exports (`LoginRoute/`, `ChecklistDetailRoute/`). `routes.jsx` imports them two different ways.
- `features/` holds things that aren't features: the app shell (`Taskira/`), navigation (`AppNavigation/`), and a generic DnD utility (`DragAndDrop/`).
- `@/features` is one barrel re-exporting everything, so any feature can reach into any other and import cycles are a matter of time.
- UI imports use three entry points interchangeably: `@taskira/ui`, `@taskira/ui/components`, `@taskira/ui/icons`.
- Code style differs between `lib/` (single quotes, no semicolons) and everything else.

### 4.4 Pages carry domain logic

`Chores.jsx` (206 lines) contains the overdue/today/tomorrow/later/someday bucketing. `ChecklistDetailRoute.jsx` (428 lines) contains cross-section drag-and-drop algorithms plus three sub-components. `Today.jsx` re-derives "today's chores" and "today's tasks" itself.

### 4.5 Page headers have two competing patterns

Most pages call `usePageHeader({ title, action })`, but `Taskira.jsx` stores that state and never renders it. `Habits.jsx` instead renders its own `<Header>`. See §8.

## 5. Target architecture

### 5.1 Directory layout

```
apps/web/src/
├── main.jsx                      # entry: mounts <App/>
├── app/                          # application shell — wiring only, no domain logic
│   ├── App.jsx                   # providers + router
│   ├── router.jsx                # route table; imports each feature's route component
│   ├── AppLayout/                # was features/Taskira (header, <Outlet/>, nav, bootstrap)
│   ├── AppNavigation/
│   ├── PageHeader/               # PageHeaderContext + usePageHeader + <PageHeader/> renderer
│   └── bootstrap.js              # initial load + startup hygiene + notification reschedule
│
├── services/                     # talks to the outside world; no React
│   ├── supabase.js
│   ├── auth.jsx                  # AuthProvider / useAuth
│   └── notifications.js          # generic schedule/cancel/rescheduleAll over Capacitor
│
├── shared/                       # domain-agnostic helpers used by 2+ features
│   ├── date.js                   # todayISO(), toISODate(), formatTime(), …
│   ├── recurrence.js             # parse / serialize / label / nextDate
│   ├── reorder.js                # reorderSubset(all, subset, activeId, overId)
│   └── dnd/                      # DragContext, useSortableItem (returns ref/style/handle props)
│
├── store/
│   └── index.js                  # composes feature slices into one Zustand store
│
└── features/
    ├── Habits/
    │   ├── index.js              # PUBLIC API — the only file other folders may import
    │   ├── habits.api.js         # Supabase reads/writes for habits + habit_completions
    │   ├── habits.slice.js       # Zustand slice: state + actions (optimistic update → api → notify)
    │   ├── habits.selectors.js   # selectHabitsDueToday(state), selectIsHabitDone(state, id), …
    │   ├── habits.rules.js       # pure: isHabitScheduledOn(habit, date), nextHabitOccurrence(habit, now)
    │   ├── habits.constants.js   # HABIT_GROUPS, RECURRENCE_OPTIONS, labels
    │   ├── components/
    │   │   ├── HabitForm/
    │   │   └── HabitItem/
    │   └── HabitsPage/           # route component
    ├── Chores/                   # same shape (+ chore lists)
    ├── Tasks/                    # same shape (+ PriorityBadge, PrioritySelect, priority constants)
    ├── Projects/                 # same shape; reuses Tasks' public API for task rows
    ├── Checklists/               # same shape; ChecklistsPage + ChecklistDetailPage, DnD split into components/
    ├── Today/                    # TodayPage — composes selectors from Habits/Chores/Tasks
    ├── Auth/                     # LoginPage, ProtectedRoute
    └── KitchenSink/              # dev-only page
```

### 5.2 Layer responsibilities

| Layer           | May import from                                                                      | Must not                                     |
| --------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| `app/`          | everything                                                                           | contain domain rules                         |
| `features/<X>/` | `shared/`, `services/`, `store/`, `@taskira/ui`, **other features' `index.js` only** | reach into another feature's internal files  |
| `store/`        | feature slices                                                                       | contain logic of its own beyond composition  |
| `shared/`       | npm packages, `@taskira/ui`                                                          | import from `features/`, `store/`, or `app/` |
| `services/`     | npm packages                                                                         | import React components, features, or store  |

Within a feature, the flow is one-directional:

```
component ──► selector / action (slice) ──► rules (pure)
                       │
                       └──► api (Supabase) ──► services/supabase
                       └──► notifications ──► services/notifications
```

### 5.3 Store design

- **One Zustand store, composed from slices** (`createHabitsSlice`, `createChoresSlice`, …) using the standard Zustand slices pattern. A single store keeps cross-domain actions simple: `deleteProject` moving tasks to the Inbox and `completeProject` completing its tasks stay atomic.
- **Slices own state and actions only.** Derived data moves to selector functions (`habits.selectors.js`); "is due"/"next date" math moves to `*.rules.js`.
- **Components subscribe with selectors:** `useStore(selectHabitsDueToday)` or `useStore(useShallow((s) => ({ addHabit: s.addHabit })))`. No bare `useStore()`.
- **Supabase calls live in `*.api.js`** with small, named functions (`insertHabit(row)`, `updateHabit(id, patch)`, `updateSortOrders(rows)`), so slices read as "update local state, persist, reschedule notification".
- **Startup work moves to `app/bootstrap.js`**: fetch all tables, run hygiene (expired habits, stale daily chores/tasks), hydrate the store, request notification permission, reschedule. Each feature exposes its own `load()` and `hygiene()` so bootstrap is a short list of calls.

### 5.4 Shared modules

- **`shared/recurrence.js`** — single definition of the recurrence string format (`daily | weekly | monthly | yearly | custom:<n>:<unit>`) with `parseRecurrence`, `serializeRecurrence`, `recurrenceLabel`, and `nextRecurrenceDate(item, now)`. Chores and Tasks both use it; the daily case collapses into the general function.
- **`shared/date.js`** — `todayISO()`, `toISODate(date)`, `formatTime(hhmm)`, `formatDisplayDate(date, pattern)`. No other file calls `format(new Date(), 'yyyy-MM-dd')`.
- **`shared/reorder.js`** — one function for "move item within a filtered subset and write `sort_order` back onto the full list". Checklist's cross-container move stays in the Checklists feature but is extracted to a pure function there.
- **`shared/dnd/`** — `DragContext` (already exists; becomes the only `DndContext` wrapper, with an optional `strategy` prop) and `useSortableItem(id)` returning `{ ref, style, handleProps }`.
- **`services/notifications.js`** — generic `scheduleReminder({ id, title, body, at })`, `cancelReminder(id)`, `rescheduleReminders(items, toReminder)`. Each feature supplies its own `toReminder(item)` (in its rules file), which removes the three copy-pasted variants.

### 5.5 Conventions

- **Named exports everywhere**, including route components (`export function HabitsPage()`). No default exports in `src/`.
- **Route components are named `<Thing>Page`** and live in `features/<X>/<Thing>Page/`.
- **Every component gets a folder** (`Name/Name.jsx` + `Name.module.css`), matching `@taskira/ui` and the scaffold script.
- **Each feature's `index.js` is its public API.** It exports the page(s), any components other features use, selectors, and constants. Nothing else is imported across features. `features/index.js` (the global barrel) is removed.
- **UI imports use `@taskira/ui` only** (the root entry re-exports components and icons).
- **One code style.** Add Prettier with a single config and format once in a dedicated commit so the reformat doesn't pollute review of real changes. Add ESLint with `eslint-plugin-import` `no-restricted-paths` (or `boundaries`) to enforce §5.2.
- **One page header pattern.** Pages call `usePageHeader({ title, action })`; `AppLayout` renders it. Pages do not render their own `<Header>`.

## 6. Delivery plan

Each phase is a separate PR that leaves the app working. Phases 1–3 are low-risk groundwork; Phase 4 is the bulk and is done one feature per PR. Detailed steps belong in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

| #    | Phase                    | Contents                                                                                                                                                                                                                                                                                                     | Risk                                 |
| ---- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| 0    | **Tooling**              | Prettier + one-time format commit; ESLint (boundary rule in warn mode); Vitest in `apps/web`                                                                                                                                                                                                                 | Low                                  |
| 1    | **Shared extraction**    | `shared/date`, `shared/recurrence`, `shared/reorder`, `shared/dnd`; replace duplicates in place; unit tests for recurrence, dates, reorder                                                                                                                                                                   | Low                                  |
| 2    | **Services + app shell** | Move `supabase`, `auth`, `notifications` → `services/` (generic reminder API); move `Taskira` → `app/AppLayout`, `AppNavigation`, `PageHeader` → `app/`; `routes.jsx` → `app/router.jsx`; **fix §8 bugs #1 and #2** (`AppLayout` renders the page header; Habits uses `usePageHeader`; one context provider) | Low (one intentional visible change) |
| 3    | **Store slices**         | Split `store.js` into per-domain slices composed in `store/index.js` without changing action names, so call sites keep working; move initialize/hygiene to `app/bootstrap.js`                                                                                                                                | Medium                               |
| 4a–e | **Feature folders**      | One PR each: Habits → Chores → Tasks → Projects → Checklists. Per feature: add `api`/`rules`/`selectors`/`constants`, move page into feature as `<X>Page`, switch components to selector subscriptions, write `index.js` public API, add rules/selectors tests                                               | Medium                               |
| 5    | **Composition pages**    | `Today`, `Auth`, `KitchenSink` into `features/`; delete `pages/`, `lib/`, and `features/index.js`                                                                                                                                                                                                            | Low                                  |
| 6    | **Enforce + document**   | Flip boundary lint rule to error; update `scripts/scaffold.js` (`feature` creates the §5.1 skeleton, `page` creates `features/<X>/<Name>Page/`); update README structure section                                                                                                                             | Low                                  |

### Verification for every phase

- `npm run build` succeeds.
- `npm test` passes (from Phase 0 onward).
- Manual smoke test in `npm run dev`: log in; on each tab add, edit, complete, reorder, and delete one item; complete a recurring chore and task and check the next due date; open a checklist, move an item between sections, reset it.
- Desktop: `npm run tauri:dev` launches. iOS: `npm run cap:sync` succeeds (notifications can only be checked on device).

## 7. Acceptance criteria

- [x] `apps/web/src` matches the layout in §5.1; `lib/` and `pages/` no longer exist.
- [x] No file in `src/` exceeds ~200 lines (`ChecklistDetailPage` is split into components).
- [x] Each item in the §4.2 duplication table is defined once.
- [x] No component calls `useStore()` without a selector.
- [x] No file outside `services/` and `features/*/*.api.js` imports the Supabase client (except `app/bootstrap.js` via feature `load()` functions).
- [x] The lint boundary rule passes with no cross-feature deep imports.
- [x] Vitest covers `shared/recurrence`, `shared/date`, `shared/reorder`, and every `*.rules.js` / `*.selectors.js`.
- [x] `npm run scaffold feature X` produces the new feature skeleton.
- [x] README describes the new structure.
- [x] Every page shows its title and header actions through `usePageHeader`; no page renders its own `<Header>`.
- [ ] Manual smoke test (§6) passes on web and desktop, with no behavior differences other than the bug fixes scheduled in §8 (#1, #2, #7, #8). _(Not yet run against the real backend or desktop. An automated browser smoke test against an in-memory Supabase stand-in passed on every phase.)_

## 8. Issues found during the audit (out of scope; fix separately)

Logged here so the restructure doesn't silently change them. Each should be its own small PR, ideally before or right after the phase that touches the file.

1. **Page headers aren't rendered.** `Taskira.jsx` stores `pageHeader` from `usePageHeader` but never renders it, so the titles and actions set by Today, Chores, Tasks, Projects, Checklists, and ChecklistDetail (e.g. the Tasks "today" filter and drag toggles) don't appear. Habits works around this by rendering its own `<Header>`. _(Phase 2 makes `AppLayout` render the header, which fixes this. It's a visible change, so call it out in that PR.)_
2. **`Taskira.jsx` wraps `<Outlet/>` in `PageHeaderContext.Provider` twice** (the `outlet` variable and again inside `<Main>`).
3. **`dragMode` is ignored by `TaskItem`.** Tasks and Projects pass it, but the grip handle always renders. `HabitItem` honors it.
4. **The Habits reorder uses the wrong list.** `handleDragEnd` computes indices against the unsorted, unfiltered `groupHabits`, while the user is dragging within the sorted, filtered `visibleHabits`. Reordering with the today filter or hidden completed habits can move the wrong item.
5. **`useDragMode` is exported but unused**, and **`features/Habits/functions/index.js` is empty**.
6. **`KitchenSink` is a production route.** Consider gating it behind `import.meta.env.DEV`.
7. **The login page crashes.** `LoginRoute.jsx` calls `useAuth()` but never imports it. The build passes, but a logged-out user gets a `ReferenceError` instead of the login form. _(Fixed in a one-line PR before Phase 0; the Phase 0 lint setup would flag it anyway.)_
8. **Recurrence dates land a day early west of UTC.** `nextRecurrenceDate` does `new Date(item.due_date)`, which parses `yyyy-MM-dd` as UTC midnight. In US timezones that's the previous local day, so a weekly chore due 2026-10-21 that repeats from its due date rolls to 2026-10-27 instead of 2026-10-28. This applies to weekly, monthly, yearly, and custom recurrences with `repeat_from = due_date`. _(Phase 1 captures it as a failing test; a standalone PR right after Phase 1 fixes it.)_
9. **The checklist detail page has no styles.** Commit `b9f6066` (the react-router migration) deleted `src/pages/ChecklistDetail.module.css` (137 lines) and replaced it with an empty scaffold module, so every `css.*` class on the page is `undefined`. One visible effect: the item drag grips render at 0×0, so items can't be dragged in edit mode. Phase 4e kept this as-is; each split-out component's CSS module points at `b9f6066^:src/pages/ChecklistDetail.module.css` for the restore. _(Found during Phase 4e.)_
10. **A checklist item disappears after being dragged.** `reorderItems` receives `{ id, section_id, sort_order }` patches from `moveChecklistItem` and replaces the stored rows with them outright, so moved items lose `name` and `checklist_id` and drop out of the view until the next reload. The database write is correct. The fix is to merge each patch into the existing row. _(Found during Phase 4e; marked with a `TODO(§8 #10)` in `checklists.slice.js`.)_

## 9. Decisions

Resolved 2026-10-21.

1. **Folder casing:** keep PascalCase feature folders (`features/Habits/`), matching the current code and the scaffold script.
2. **Store shape:** a single Zustand store composed from per-feature slices (§5.3). Cross-domain actions such as `deleteProject` and `completeProject` stay in one place.
3. **Tests:** add Vitest in Phase 0. Every extraction in Phases 1–4 lands with unit tests for the pure functions it creates.
4. **Page-header bug (§8, #1):** fix it in Phase 2, as part of building `app/AppLayout` and `app/PageHeader`. Habits switches to `usePageHeader` in the same PR. The PR description must call this out as an intentional visible change.
