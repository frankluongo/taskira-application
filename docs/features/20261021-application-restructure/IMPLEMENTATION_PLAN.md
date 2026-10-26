# Application Restructure — Implementation Plan

Step-by-step plan for the [Feature Spec](./FEATURE_SPECS.md). Section references (§) point to the spec.

## How to work through this

- **One PR per row in the tracker below.** Each PR leaves `main` building, linting, testing, and working.
- **Branch naming:** `refactor/<phase>-<slug>` (e.g. `refactor/p1-shared-extraction`); bug fixes use `fix/<slug>`.
- **Move with `git mv`** and keep moves in their own commits, separate from edits, so `git log --follow` and review diffs stay readable.
- **Behavior-preserving by default.** If a step would change behavior, stop, log it in spec §8, and fix it separately. The only planned exceptions are the bugs called out in the tracker.
- **Every PR runs the verification checklist** at the [bottom of this doc](#verification-checklist-every-pr).

## Tracker

| # | PR | Depends on | Visible change? |
| --- | --- | --- | --- |
| pre | `fix/login-missing-useauth`: fix bug §8 #7 | — | Yes: login works |
| 0 | Tooling: Prettier, ESLint, Vitest, CI | pre | No |
| 1 | Shared extraction: date, recurrence, reorder, dnd | 0 | No |
| 1b | `fix/recurrence-timezone`: fix bug §8 #8 | 1 | Yes: correct next due dates |
| 2 | Services + app shell + page-header fix | 1 | Yes: page headers appear |
| 3 | Store slices + bootstrap | 2 | No |
| 4a | Habits feature folder | 3 | No |
| 4b | Chores feature folder | 3 | No |
| 4c | Tasks feature folder | 3 | No |
| 4d | Projects feature folder | 4c | No |
| 4e | Checklists feature folder | 3 | No |
| 5 | Today, Auth, KitchenSink; delete `pages/`, `lib/`, global barrel | 4a–4e | No |
| 6 | Enforce boundaries, update scaffold + README | 5 | No |

PRs 4a, 4b, 4c, and 4e are independent of each other; 4d needs 4c because Projects imports Tasks' public API.

---

## Pre-work — fix the login crash (§8 #7)

1. Add `import { useAuth } from "@/lib/auth";` to [LoginRoute.jsx](../../../apps/web/src/pages/LoginRoute/LoginRoute.jsx).
2. Verify: sign out → the login form renders → sign in works.

---

## Phase 0 — Tooling

### 0.1 Prettier

1. Add `prettier` as a root devDependency.
2. Add a root `.prettierrc.json` containing `{}`. Prettier's defaults (double quotes, semicolons, trailing commas) already match most of `src/`; only `lib/`, `scripts/`, and `vite.config.js` change.
3. Add `.prettierignore`: `node_modules`, `dist`, `apps/ios/ios`, `apps/ios/android`, `apps/tauri/src-tauri`, `package-lock.json`, `storybook-static`.
4. Add root scripts: `"format": "prettier --write ."` and `"format:check": "prettier --check ."`.
5. **Commit A:** config only. **Commit B:** `npm run format` and nothing else.
6. Add commit B's hash to a new `.git-blame-ignore-revs` (**Commit C**).

### 0.2 ESLint

1. Add root devDependencies: `eslint`, `@eslint/js`, `globals`, `eslint-plugin-react`, `eslint-plugin-react-hooks`.
2. Add a root `eslint.config.js` (flat config):
   - `@eslint/js` recommended, `react` recommended + `jsx-runtime`, `react-hooks` recommended
   - Browser globals for `apps/web/src` and `packages/ui/src`; Node globals for `scripts/` and config files
   - `react/prop-types: off`
   - `react-hooks/exhaustive-deps: warn` (the existing effects in `Taskira.jsx` will warn; leave them, Phase 3 rewrites them)
   - `no-restricted-imports: warn` for `@taskira/ui/components` and `@taskira/ui/icons` (Phase 6 adds the full boundary rules)
   - Ignore `dist`, `storybook-static`, and the native folders
3. Add root script `"lint": "eslint ."`.
4. Fix **errors** only, and only where the fix can't change behavior: unused imports and unused variables. Leave the unused `pageHeader` state in `Taskira.jsx` with an `// eslint-disable-next-line` and a comment pointing to Phase 2. Don't touch warnings.

### 0.3 Vitest

1. Add `vitest` as a devDependency of `apps/web`.
2. In [vite.config.js](../../../apps/web/vite.config.js), add:
   ```js
   test: {
     include: ["src/**/*.test.js"],
     environment: "node",
   },
   ```
3. Scripts:
   - `apps/web`: `"test": "TZ=America/New_York vitest run"`, `"test:watch": "TZ=America/New_York vitest"`. Pinning a US timezone makes date bugs like §8 #8 reproducible on any machine or CI runner.
   - root: `"test": "npm run test -w apps/web"`.
4. Prove the wiring with one test: `src/lib/date.test.js` for `formatTime` (`"00:05"` → `"12:05 AM"`, `"12:00"` → `"12:00 PM"`, `"23:59"` → `"11:59 PM"`). It moves with the file in Phase 1.
5. **Conventions:** tests sit next to the file under test as `<file>.test.js`. Pure functions that depend on "now" take a `now` parameter (defaulting to `new Date()`) instead of mocking timers.

### 0.4 CI

Add `.github/workflows/ci.yml`, run on `pull_request` and on `push` to `main`, using `ubuntu-latest` and Node 20:
`npm ci` → `npm run format:check` → `npm run lint` → `npm test` → `npm run build`.

The build doesn't need the Supabase secrets, because `createClient` only runs in the browser.

---

## Phase 1 — Shared extraction

All new modules go in `apps/web/src/shared/`. Each step replaces its duplicates in place. Nothing moves between folders yet, apart from the `shared/` additions.

### 1.1 `shared/date.js`

1. `git mv src/lib/date.js src/shared/date.js` (and its test).
2. Its API:
   ```js
   toISODate(date)                         // format(date, "yyyy-MM-dd")
   todayISO(now = new Date())
   tomorrowISO(now = new Date())
   formatDisplayDate(date, pattern)        // replaces getTodayString("EEEE, MMM d")
   formatTime(hhmm)                        // unchanged
   ```
3. Replace:
   - the `today()` helper in `store.js`
   - `fmt`/`todayStr`/`tomorrowStr` in `Chores.jsx`
   - every `getTodayString` call (`Today.jsx`, `Tasks.jsx`)
   - inline `format(addDays(new Date(), 1), "yyyy-MM-dd")` in `store.js`
4. Tests: `toISODate` across a DST boundary; `tomorrowISO` on Dec 31.

### 1.2 `shared/recurrence.js`

1. Its API:
   ```js
   RECURRENCE_UNITS                        // ["days", "weeks", "months", "years"]
   parseRecurrence(value)                  // → { recurrence, customInterval, customUnit } (form state)
   serializeRecurrence({ recurrence, customInterval, customUnit })  // → "custom:3:months" | "weekly" | null
   supportsRepeatFrom(recurrence)          // weekly | monthly | yearly | custom
   recurrenceLabel(value)                  // "Every 3 months", "Weekly", …
   nextRecurrenceDate(item, now = new Date())  // handles "daily" too
   ```
2. `nextRecurrenceDate` must copy today's behavior exactly, including the `new Date(item.due_date)` parse. For `daily` it returns `tomorrowISO(now)`, which is what `completeChore`/`completeTask` do now.
3. Replace:
   - `parseRecurrence` and the custom-string building in `ChoreForm.jsx` and `TaskForm.jsx`
   - the inline `["weekly","monthly","yearly","custom"].includes(...)` checks in both forms
   - `RECURRENCE_LABELS` + `recurrenceLabel` in `ChoreItem.jsx` and `TaskItem.jsx`
   - `nextRecurrenceDate` in `store.js`. Collapse the duplicated "daily" and "recurring" branches of `completeChore` and `completeTask` into one branch each, since they differ only in the date calculation.
4. Tests:
   - `parseRecurrence` ↔ `serializeRecurrence` round-trip for every option, plus `custom` with `0` or empty input (→ `null`)
   - `recurrenceLabel` for every value, `null`, and an unknown string
   - `nextRecurrenceDate` with `repeat_from: "completion_date"` for each unit, with a fixed `now`
   - `nextRecurrenceDate` with `repeat_from: "due_date"`, written as the **correct** expectation (`2026-10-21` weekly → `2026-10-28`) and marked `it.fails` with a comment linking §8 #8

### 1.3 `shared/reorder.js`

1. Its API:
   ```js
   moveWithin(list, activeId, overId)          // arrayMove + sort_order = index; returns null on no-op
   reorderSubset(all, subset, activeId, overId)  // moveWithin(subset) merged back into all by id
   ```
2. Replace the `handleDragEnd` bodies in `Habits.jsx`, `Chores.jsx`, `Tasks.jsx`, and `Projects.jsx` with `reorderSubset`, and `handleSectionDragEnd` in `ChecklistDetailRoute.jsx` with `moveWithin`. Each handler shrinks to:
   ```js
   const next = reorderSubset(tasks, topLevelTasks, active.id, over?.id);
   if (next) reorderTasks(next);
   ```
3. **Habits:** pass the same `groupHabits` list it uses today, even though that's bug §8 #4. Add a `// TODO(§8 #4)` comment.
4. Leave the checklist item drag (moving items between sections) alone; Phase 4e extracts it.
5. Tests: move down, move up, `over` null, `active === over`, subset ordering differs from `all`, items outside the subset untouched.

### 1.4 `shared/dnd/`

1. `git mv src/features/DragAndDrop src/shared/dnd`, then delete `useDragMode.js` (unused; §8 #5).
2. Split the current component into two:
   - `DndProvider({ onDragEnd, children })`: sensors + `DndContext` with `closestCenter` (today's settings)
   - `DragContext({ items, onDragEnd, strategy = "vertical", children })`: `DndProvider` + one `SortableContext`
3. Add `useSortableItem(id)` → `{ setNodeRef, style, handleProps, isDragging }`, where `style` is today's transform/transition/opacity-0.4 object and `handleProps` is `{ ...attributes, ...listeners }`.
4. Replace:
   - the `useSortable` + style boilerplate in `HabitItem`, `ChoreItem`, `TaskItem`, and `ChecklistDetailRoute`'s `SectionChip` and `ChecklistItemRow`
   - the inline `DndContext` in `Chores.jsx`'s `ChoreSection` with `DragContext`, and drop its `sensors` prop
   - the section-chip `DndContext` in `ChecklistDetailRoute.jsx` with `DragContext strategy="horizontal"`
   - the item-level `DndContext` in `ChecklistDetailRoute.jsx` with `DndProvider`, because it holds several `SortableContext`s
5. Update `features/index.js` to stop re-exporting `DragAndDrop`; import from `@/shared/dnd` instead.

### 1.5 Small dedupes

- In `Habits.jsx`, delete the local `GROUPS` and import `HABIT_GROUPS`.
- Delete the empty `features/Habits/functions/`.

---

## Phase 1b — Fix recurrence timezone (§8 #8)

1. In `shared/recurrence.js`, parse the base date with `parseISO(item.due_date)` from date-fns, which gives local midnight, instead of `new Date(item.due_date)`.
2. Change the `it.fails` test to `it`. Add cases for monthly (Jan 31 → Feb 28), yearly (Feb 29), and custom.
3. In the PR description, note that chores and tasks completed before this fix may already have due dates that are a day early. The fix doesn't correct existing data.

---

## Phase 2 — Services, app shell, page-header fix

### 2.1 Move services

```
git mv src/lib/supabase.js       src/services/supabase.js
git mv src/lib/auth.jsx          src/services/auth.jsx
git mv src/lib/notifications.js  src/services/notifications.js
```

Update imports. `lib/` now holds only `store.js`.

### 2.2 Generic reminders

1. Rewrite `services/notifications.js` so it knows nothing about habits, chores, or tasks:
   ```js
   requestNotificationPermission()
   scheduleReminder(reminder)             // { id: uuid, title, body, at } | null → no-op on null
   cancelReminder(uuid)
   rescheduleReminders(items, toReminder) // cancels every item with alarm_time, schedules non-null reminders
   ```
   `notifId` (the UUID → integer hash) stays private to this file.
2. Create the first rules files with the reminder builders. Phase 4 adds to them.
   - `features/Habits/habits.rules.js`: `isHabitScheduledOn(habit, date)` (the shared day-of-week check), `nextHabitOccurrence(habit, now)`, `habitReminder(habit, now)`
   - `features/Chores/chores.rules.js`: `choreReminder(chore, now)`
   - `features/Tasks/tasks.rules.js`: `taskReminder(task, now)` (returns `null` for completed tasks, as today)
3. In `store.js`, replace each `scheduleXNotification(row)` with `scheduleReminder(xReminder(row))` and each `cancelXNotification(id)` with `cancelReminder(id)`.
4. Tests for each `*Reminder` and for `isHabitScheduledOn`, covering every habit recurrence type, `start_date`/`end_date` edges, and an alarm time already passed today.

### 2.3 App shell

1. Moves:
   ```
   git mv src/App.jsx                         src/app/App.jsx
   git mv src/routes.jsx                      src/app/router.jsx
   git mv src/features/Taskira                src/app/AppLayout        # rename files + component to AppLayout
   git mv src/features/AppNavigation          src/app/AppNavigation
   git mv src/features/Taskira/PageHeaderContext.js  src/app/PageHeader/PageHeaderContext.js
   ```
   Update `main.jsx` and remove the moved entries from `features/index.js`. Export `usePageHeader` from `src/app/PageHeader/index.js`; pages import it from `@/app/PageHeader`.
2. **Bug §8 #1:** add `app/PageHeader/PageHeader.jsx`, which renders `<Header variant="page"><Heading>{title}</Heading>{action}</Header>`. This is the markup `Habits.jsx` uses today; move its `.actions` styles into `PageHeader.module.css`. `AppLayout` renders `<PageHeader {...pageHeader} />` above `<Outlet />` inside `<Main>`.
3. **Bug §8 #2:** wrap `AppLayout`'s whole return in a single `PageHeaderContext.Provider` and delete the duplicate `outlet` variable.
4. **Habits:** replace its own `<Header>`/`<Heading>` with `usePageHeader({ title: "Habits", action: … })`, and drop the outer `FlexColumn`/`Container` only if the layout looks the same.
5. **Watch for render loops.** `action` is a new element on every render. This is safe today because `<Outlet>`'s element is stable, so a page doesn't re-render when `AppLayout`'s header state changes. Confirm with React DevTools' "highlight updates" that switching tabs doesn't re-render endlessly. If it does, compare `title` only and store `action` in a ref.
6. **Visual check:** every tab shows the right title and actions. Tasks shows its today-filter and drag toggles; ChecklistDetail shows Back/Edit/Reset. Take before/after screenshots for the PR, and title the PR to flag the visible change.

---

## Phase 3 — Store slices + bootstrap

### 3.1 Split the store

1. Create the slices, moving code **verbatim** apart from imports:
   ```
   features/Habits/habits.slice.js           createHabitsSlice      habits, habit_completions
   features/Chores/chores.slice.js           createChoresSlice      chore_lists, chores
   features/Tasks/tasks.slice.js             createTasksSlice       tasks
   features/Projects/projects.slice.js       createProjectsSlice    projects (+ deleteProject/completeProject, which also update tasks)
   features/Checklists/checklists.slice.js   createChecklistsSlice  checklists, checklist_sections, checklist_items
   ```
   Each slice is `(set, get) => ({ …state, …actions })`.
2. Create `src/store/index.js`:
   ```js
   export const useStore = create((...a) => ({
     initialized: false,
     ...createHabitsSlice(...a),
     ...createChoresSlice(...a),
     ...createTasksSlice(...a),
     ...createProjectsSlice(...a),
     ...createChecklistsSlice(...a),
   }));
   ```
3. Constants:
   - `INBOX_PROJECT_ID`, `PRIORITY_LABELS` → `features/Tasks/tasks.constants.js`. They belong to Tasks, not Projects, so dependencies stay one-way (Projects → Tasks). Putting them in Projects would create an import cycle.
   - `HABIT_GROUPS` → `features/Habits/habits.constants.js` (replacing `constants/index.js`).
4. Turn `lib/store.js` into a **temporary shim** so no call site changes in this PR:
   ```js
   export { useStore } from "@/store";
   export { INBOX_PROJECT_ID, PRIORITY_LABELS } from "@/features/Tasks/tasks.constants";
   ```
   It's deleted in Phase 5.

### 3.2 Bootstrap

1. Create `*.api.js` files containing only the fetch functions bootstrap needs, e.g. `fetchHabits()` and `fetchTodayCompletions(today)`. Phase 4 adds the write functions.
2. Add pure startup-cleanup rules, with tests:
   - `habits.rules.js`: `partitionExpiredHabits(habits, today)` → `{ live, expired }`
   - `shared/recurrence.js`: `rollDailyForward(items, today)` → `{ items, stale }` (same function for chores and tasks)
3. Create `app/bootstrap.js` with `export async function bootstrap()`, keeping today's order:
   fetch everything in parallel → run the cleanup rules → `useStore.setState({ …, initialized: true })` → write the cleanup results (delete expired habits, roll stale daily items forward) → `requestNotificationPermission()` → `rescheduleReminders` for habits, chores, and tasks.
4. `AppLayout`: replace both effects with one, `useEffect(() => { if (user) bootstrap(); }, [user])`. Remove `initialize` from the store.
5. Guard against double runs: track an in-flight promise in `bootstrap.js` so `StrictMode`'s double effect call in dev doesn't fetch twice. The double fetch only happens in dev today, and it's harmless, but the guard makes logs readable.

---

## Phase 4 — Feature folders (one PR per feature)

### Standard steps for each feature

1. **API:** move every `supabase.from(...)` call out of the slice into named functions in `<x>.api.js` (`insertX`, `updateX`, `deleteX`, `updateSortOrders`). A slice action should then read: optimistic `set` → `await api…` → reminder.
2. **Rules:** move business decisions into pure functions in `<x>.rules.js` with a `now` parameter.
3. **Selectors:** put derived data in `<x>.selectors.js` as pure functions over plain arrays, plus a small hook for components:
   ```js
   export const getHabitsDueToday = (habits, completions, now) => …;
   export function useHabitsDueToday() {
     const { habits, completions } = useStore(useShallow((s) => ({ habits: s.habits, completions: s.habit_completions })));
     return useMemo(() => getHabitsDueToday(habits, completions, new Date()), [habits, completions]);
   }
   ```
   > ⚠️ **Zustand v5 gotcha:** never write `useStore((s) => s.items.filter(…))`. A selector that returns a new array on every call causes an infinite render loop in v5. Select raw state with `useShallow`, then derive with `useMemo`.
4. **Store usage:** replace every bare `useStore()` in the feature with `useStore((s) => s.addX)` or `useStore(useShallow(…))`. Delete method-style selectors (`isHabitDoneToday()`, `habitsDueToday()`) from the slice.
5. **Constants:** move labels, option lists, and magic values into `<x>.constants.js`.
6. **Layout:** move components into `components/<Name>/`. Move the page to `<X>Page/<X>Page.jsx` with a named export and rename its CSS module to match. Move any sub-components defined inside the page file into `components/`.
7. **Public API:** write `index.js` exporting the page(s), the components other features use, hooks/selectors, and constants. Remove the feature from `features/index.js`. Point `app/router.jsx` at `@/features/<X>`.
8. **Tests:** cover every function in `rules` and `selectors`.

### 4a — Habits

- `habits.constants.js`: `HABIT_GROUPS`, `HABIT_RECURRENCE_OPTIONS` (from `HabitForm`), `HABIT_RECURRENCE_LABELS` (from `HabitItem`). Build both from one list so they can't drift.
- `getHabitsDueToday` reuses `isHabitScheduledOn` from Phase 2, which removes the last duplicate of the day-matching rule.
- `isHabitDone(completions, habitId, today)` replaces `isHabitDoneToday`.
- `HabitsPage`: move the per-group rendering into `components/HabitGroup/`. Keep the `// TODO(§8 #4)` reorder behavior.

### 4b — Chores

- `chores.rules.js`:
  - `groupChoresByDue(chores, { listId, today, tomorrow })` → `{ overdue, today, tomorrow, later, someday }`, lifting the bucketing out of `Chores.jsx` exactly, including `later`'s `.slice(0, 5)`
  - `choreCompletionOutcome(chore, now)` → `{ type: "reschedule", due_date } | { type: "delete" }`
- `completeChore` becomes: compute the outcome → apply it.
- Move `ChoreSection` and `ListTab` (renamed `ChoreListTabs`) into `components/`.
- Test `groupChoresByDue`: overdue excludes daily chores, list filtering, each bucket's sort order, and the `later` cap.

### 4c — Tasks

- `tasks.constants.js`: `INBOX_PROJECT_ID`, `PRIORITY_LABELS`, `PRIORITIES = [5, 4, 3, 2, 1]`, `DEFAULT_PRIORITY = 3`.
- `tasks.rules.js`: `taskCompletionOutcome(task, now)` → `delete` (inbox) | `reschedule` | `complete`.
- `tasks.selectors.js`: `getInboxTasks(tasks, { todayOnly, today })`, `getSubtasks(tasks, parentId)`, `getTasksDueOn(tasks, date)`, `getProjectTasks(tasks, { projectId, includeCompleted })` (Projects uses this one).
- Move `PrioritySelect` out of `TaskItem.jsx` into `components/`. Leave `TaskItem` ignoring `dragMode` (§8 #3), with a TODO.
- The public API exports `TaskItem`, `TaskForm`, `PriorityBadge`, and the constants and selectors above.

### 4d — Projects

- Import `TaskItem`, `TaskForm`, `INBOX_PROJECT_ID`, and `getProjectTasks` from `@/features/Tasks`.
- Split `Projects.jsx` (245 lines) into `ProjectsPage` plus `components/ProjectTabs` and `components/ProjectRenameForm`, and anything else needed to get each file under ~200 lines.
- `projects.selectors.js`: `getVisibleProjects(projects, { showArchived })`.

### 4e — Checklists

- `checklists.rules.js`, lifted from `ChecklistDetailRoute.jsx`:
  - `containerKey(sectionId)`, `sectionIdFromContainerKey(key)`
  - `moveChecklistItem(items, activeId, overId)` → patch list, the body of `handleItemDragEnd`
- `checklists.selectors.js`: `getChecklistView(state, id)` → `{ checklist, sections, ungroupedItems, itemsBySection }`.
- Split `ChecklistDetailRoute.jsx` (428 lines) into:
  - `ChecklistDetailPage/`: header actions, mode state, and composition, about 100 lines
  - `components/SectionChips/`, `components/ChecklistSection/` (header with rename/delete), `components/ItemContainer/`, `components/ChecklistItemRow/`, `components/AddItemForm/`
- Move `Checklists.jsx` → `ChecklistsPage/`.
- Test `moveChecklistItem` for reorder within a section, a move between sections, a drop onto an empty section container, a move into and out of the ungrouped list, and `over` null.

---

## Phase 5 — Composition pages and cleanup

1. **Today:** move it to `features/Today/TodayPage/`. Replace its inline filters with `useHabitsDueToday()`, `getTasksDueOn`, and a new `getChoresDueOn` in Chores. It imports only from the Habits, Chores, and Tasks `index.js` files.
2. **Auth:** move `pages/LoginRoute` → `features/Auth/LoginPage/` and `pages/ProtectedRoute` → `features/Auth/ProtectedRoute/`. Login keeps using `supabase.auth` through `@/services/supabase`.
3. **KitchenSink:** move it to `features/KitchenSink/KitchenSinkPage/`. Don't change its routing (§8 #6).
4. **Delete:** `src/pages/`, `src/lib/` (including the store shim, after pointing the remaining imports at `@/store` and `@/features/Tasks`), and `src/features/index.js`.
5. `grep -r "@/lib\|@/pages\|from \"@/features\"" src` returns nothing.

---

## Phase 6 — Enforce, scaffold, document

### 6.1 Lint boundaries (error level)

Use `no-restricted-imports` overrides in `eslint.config.js`:

| Files | Forbidden import patterns |
| --- | --- |
| `apps/web/src/**` | `@/features/*/*` (deep imports; use the feature's `index.js`), `@/lib/*`, `@/pages/*`, `@taskira/ui/*` |
| `apps/web/src/shared/**` | `@/features/*`, `@/store*`, `@/app/*` |
| `apps/web/src/services/**` | `@/features/*`, `@/store*`, `@/app/*`, `@/shared/*` |
| `apps/web/src/store/**` | `@/app/*` |

Within a feature, use relative imports (`./components/HabitItem/HabitItem`).

Also add `max-lines: ["warn", { max: 200, skipBlankLines: true, skipComments: true }]` for `src/**`.

### 6.2 Scaffold script

Update [scripts/scaffold.js](../../../scripts/scaffold.js):

- `component <Name>`: unchanged (`packages/ui`).
- `feature <Name>`: creates
  ```
  features/<Name>/index.js
  features/<Name>/<name>.api.js
  features/<Name>/<name>.slice.js
  features/<Name>/<name>.selectors.js
  features/<Name>/<name>.rules.js
  features/<Name>/<name>.rules.test.js
  features/<Name>/<name>.constants.js
  features/<Name>/components/
  features/<Name>/<Name>Page/<Name>Page.jsx + .module.css
  ```
  It doesn't touch any barrel. It prints next steps: register the slice in `store/index.js` and the route in `app/router.jsx`.
- `page <Feature> <Name>`: creates `features/<Feature>/<Name>Page/` and adds the export to that feature's `index.js`. It fails if the feature doesn't exist.
- `feature-component <Feature> <Name>`: creates `features/<Feature>/components/<Name>/`.
- Update the usage text.

### 6.3 Docs

- README: replace the scaffolding table and add an "App structure" section summarizing spec §5.1–5.2, linking to the spec for detail.
- Set the spec's status to **Done** and check off its §7 acceptance criteria.

---

## Verification checklist (every PR)

**Automated** (CI runs these from Phase 0 on):

- [ ] `npm run format:check`
- [ ] `npm run lint` (no errors)
- [ ] `npm test`
- [ ] `npm run build`

**Manual** in `npm run dev`:

- [ ] Sign out → login form → sign in
- [ ] **Today:** complete a habit, a chore, and a task
- [ ] **Habits:** add, edit, complete/uncomplete, drag to reorder in drag mode, delete; toggle the today and completed filters
- [ ] **Chores:** add with a list, switch list tabs, complete a one-off (removed), a daily (moves to tomorrow), and a weekly (moves a week), reorder, delete
- [ ] **Tasks:** add, add a subtask, change priority, edit, reorder, complete an inbox task (deleted), delete
- [ ] **Projects:** add, rename, add a task, complete a project task, complete the project, toggle archived
- [ ] **Checklists:** create, open, add a section and items, move an item between sections, reorder sections, check items, reset, delete
- [ ] Reload: all changes persisted

**Platforms** (Phases 2, 3, and 6 at minimum):

- [ ] `npm run tauri:dev` launches and passes the checks above
- [ ] `npm run cap:sync` succeeds; on a device, a chore with an alarm time schedules a notification
