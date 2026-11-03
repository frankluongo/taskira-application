# Simplify the Repo — Feature Spec

**Status:** Accepted · **Date:** 2026-11-03 · **Scope:** `apps/web` (base, features, lib), plus small cleanups in repo config, `apps/tauri`, and CI · **Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

## 1. Summary

The last few PRs removed Chores, Projects, task recurrence, Storybook, and the `packages/` folder. That left behind code nothing calls, and the same logic copied in several places. Some of the copies have already drifted apart. This spec lists both problems, found by reading every file in `apps/web/src` and checking each export for imports. It also lists what to do about each one.

There are three kinds of work:

1. **Fix what's broken.** CI on `main` has failed since PR #25 (§4.1).
2. **Delete dead code.** Files, exports, props, branches, and config that nothing reaches (§4.2).
3. **Make one place own each rule.** Habit recurrence, priorities, "today", habit groups, notification building, and drag-and-drop row setup are each written two to four times. Each should live in one place (§4.3).

This is a **refactor**. The app should behave the same before and after, with three exceptions (§6):

- The Tasks drag-mode toggle starts working.
- The developer-only Kitchen Sink page goes away.
- Reminders start firing for legacy habits that have no recurrence value (§4.3.1).

## 2. Goals

1. **CI is green**, and `npm run lint` reports no errors or warnings.
2. **No dead code.** Every file in `apps/web/src` is imported by something, and every export is used outside its own file.
3. **One source of truth** for each rule listed in §4.3. Changing what "weekdays" means, or renaming a priority, touches one file.
4. **Smaller files where it helps.** `ChecklistDetailPage.jsx` (428 lines) and `notifications.js` (151 lines) get easier to read.

## 3. Non-goals

- **Changing what users see.** No visual or flow changes, except the Tasks drag-mode fix (§6, decision 1).
- **Database changes.** The Supabase schema stays the same. The `projects` table, `INBOX_PROJECT_ID`, and `tasks.project_id` stay, as in the [previous spec](../20261103-remove-unused-features/FEATURE_SPEC.md) §3.
- **Store architecture.** Components keep calling `useStore()` without selectors. That re-renders more than it needs to, but the app is small and switching is a separate decision.
- **TypeScript, new dependencies, or a new test framework.** Vitest is already set up and gets a few more tests (§4.3.1).
- **Rewriting older docs** in `docs/features/`.

## 4. Findings and changes

### 4.1 Broken: CI fails on `main`

`gh run list` shows CI failing on `main` since PR #25 (`fix/update-ui`). `format:check` passes, and `lint` fails:

| File                                          | Problem                                                                                                                      | Fix               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `apps/web/src/features/Habits/HabitsPage.jsx` | `Container` is imported but never used (`no-unused-vars`, **error**)                                                         | Remove the import |
| `apps/web/src/features/Taskira/Taskira.jsx`   | Two `react-hooks/exhaustive-deps` **warnings**: the effects at lines 22 and 26 leave out `initialize`, `habits`, and `tasks` | See §4.4.2        |

Land this first, as its own small commit, so the rest of the work starts from a green build.

### 4.2 Dead code to delete

#### 4.2.1 Files

| Path                                                | Why it's dead                                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/base/icons/IconSun.jsx`               | Empty file, and not exported from `base/icons/index.js`                                                                                                                                  |
| `apps/web/src/features/Habits/functions.js`         | Empty file. §4.3.1 may reuse the idea, but in `lib/`                                                                                                                                     |
| `apps/web/src/features/DragAndDrop/useDragMode.js`  | Never imported. Each page uses its own `useState(false)`. §4.3.6 replaces it with a hook that is used                                                                                    |
| `apps/web/src/base/components/Header/` (2 files)    | Never imported. PR #25 copied its `site` and `page` styles into `Taskira.module.css`, and `Taskira.jsx` renders plain `<header>` elements instead. Delete it and drop it from the barrel |
| `apps/web/src/base/components/Scroller/` (2 files)  | Never imported since Chores was removed                                                                                                                                                  |
| `apps/web/src/base/components/Container/` (2 files) | Its only import is the unused one in §4.1                                                                                                                                                |
| `apps/web/public/_redirects`                        | Netlify-style rewrite file. The app deploys to Render (`render.yaml`), which doesn't read it. The app also uses `createHashRouter`, so the server only ever sees `/`                     |

Drop each deleted component from `apps/web/src/base/components/index.js`.

#### 4.2.2 The Kitchen Sink and what only it uses (§6, decision 2)

The Kitchen Sink is a developer-only page that shows the base components. Delete the page, and everything that exists only so it can show it. None of these is used by a real feature. I checked each `@/base` export against `features/`, `lib/`, and `routes.jsx`, leaving out `KitchenSink/`.

| Item                                                                                                           | Where                         |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `features/KitchenSink/` (2 files) and its `kitchen-sink` route                                                 | `routes.jsx`                  |
| The "browse the base components" line                                                                          | `README.md`                   |
| `Disclosure` component (2 files)                                                                               | `base/components/Disclosure/` |
| `IconList`, `IconFolder`                                                                                       | `base/icons/`                 |
| Button `pill` variant                                                                                          | `Button.module.css`           |
| `ToggleButton` `square` variant                                                                                | `Button.module.css`           |
| `FlexColumn` `lg` and `xl` variants (unused anywhere)                                                          | `FlexColumn.module.css`       |
| `:root[data-theme="light"]` and `[data-theme="dark"]` overrides. Only the Kitchen Sink's theme switch set them | `index.css`                   |
| `--color-platinum`. Only the Kitchen Sink's palette swatches used it                                           | `index.css`                   |
| `.pt-safe` and `.pb-safe` utility classes (unused anywhere)                                                    | `index.css`                   |

`IconChevronDown` and `IconClose` look unused from `features/`, but `Details`, `Select`, and `Modal` use them, so they stay.

#### 4.2.3 Dead code paths inside live files

| Where                                                                      | Dead code                                                                                                                                                                                                 | Change                                                                                                                                                                         |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/notifications.js:105,139`, `features/Today/TodayPage.jsx:15`          | `completed_at` checks. Completing a task deletes it (`completeTask`), and no form or action sets `completed_at`. Only Project tasks ever did, and they're gone                                            | Remove the checks                                                                                                                                                              |
| `lib/notifications.js:83-86,132-135`                                       | `rescheduleAllHabitNotifications` and `rescheduleAllTaskNotifications` each cancel their own IDs first. Their only caller, `Taskira.jsx`, already calls `cancelAllPendingNotifications` right before them | Remove the per-function cancel                                                                                                                                                 |
| `features/Tasks/TasksPage.jsx:27`                                          | `t.project_id === INBOX_PROJECT_ID` filter. The store only loads Inbox tasks (`store.js:41`), and every task it adds is an Inbox task                                                                     | Remove the filter                                                                                                                                                              |
| `features/Tasks/TaskForm.jsx:12,23`, `TasksPage.jsx:96`, `TaskItem.jsx:46` | `project_id` gets passed through the form, the page, and subtask creation, but it's always `INBOX_PROJECT_ID`                                                                                             | Have `addTask` in the store set `project_id: INBOX_PROJECT_ID`. Remove it from `TaskForm`, `TasksPage`, and `TaskItem`. `INBOX_PROJECT_ID` is then only used inside `store.js` |
| `features/Tasks/TasksPage.jsx:24,60-68,82`                                 | Tasks has a drag-mode toggle button and passes `dragMode` to `TaskItem`. `TaskItem` ignores the prop and always shows the grip, so the button does nothing                                                | `TaskItem` shows the grip only when `dragMode` is on, like `HabitItem` (§6, decision 1)                                                                                        |
| `features/Taskira/Taskira.jsx:42-48,66-68`                                 | `PageHeaderContext.Provider` is rendered twice, once for logged-out users and once for logged-in users                                                                                                    | Wrap the whole return in one provider                                                                                                                                          |

#### 4.2.4 Repo and app-shell config

| File                                                                          | Dead config                                                                                                                                                                                                                                                          | Change                                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/package.json`, `apps/tauri/package.json`, `apps/ios/package.json`   | Each says `"version": "0.3.0"`. The real version is `0.4.0` in the root `package.json` and `tauri.conf.json`. `scripts/deploy.js` only bumps those two, so the workspace versions are stale and will stay stale                                                      | Remove `version` from the three workspace `package.json` files. They're `private`, so npm doesn't need it                                                                                |
| `eslint.config.js`, `.prettierignore`                                         | Both ignore `apps/ios/android/**`, which doesn't exist                                                                                                                                                                                                               | Remove the entry                                                                                                                                                                         |
| `apps/tauri/src-tauri/tauri.conf.json`                                        | `bundle.android` block. There's no Android target                                                                                                                                                                                                                    | Remove it                                                                                                                                                                                |
| `apps/tauri/src-tauri/` (`lib.rs`, `Cargo.toml`, `capabilities/default.json`) | `tauri-plugin-opener` is registered and allowed (`opener:default`), but the frontend doesn't depend on `@tauri-apps/plugin-opener` and never calls it. `Cargo.toml` still has template metadata (`name = "app"`, `description = "A Tauri App"`, `authors = ["you"]`) | Remove the plugin from all three files. Set `name = "taskira"`, a real `description`, and `authors`. Drop the empty `license` and `repository` and the template comment (§6, decision 3) |
| `.github/workflows/release.yml`                                               | Builds on Node 20. CI builds on Node 22                                                                                                                                                                                                                              | Use Node 22 in both, and enable the npm cache in `release.yml` to match CI                                                                                                               |
| `.gitignore`                                                                  | `yarn.lock`, `.next/`, and the `yarn-*` log patterns are left over from older setups. The project uses npm and Vite                                                                                                                                                  | Remove them                                                                                                                                                                              |

### 4.3 One place for each rule

#### 4.3.1 Habit recurrence (two copies)

`store.js` `habitsDueToday` (lines 166-171) and `notifications.js` `nextHabitOccurrence` (lines 23-32) each decide whether a habit happens on a given weekday, with the same four branches. If one changes and the other doesn't, the Today page and the reminders will disagree.

The two copies have already drifted. `habitsDueToday` ends with `return true`, so a habit with no `recurrence` value shows up every day. `nextHabitOccurrence` matches none of its branches for that habit, so it never schedules a reminder. `HabitForm` always sets a recurrence, so only older rows can hit this. The shared function treats a missing value as `daily`, which matches what Today already shows.

**Change:** Add `apps/web/src/lib/habits.js` with `occursOn(habit, dayOfWeek)`, and call it from both places. Add `lib/habits.test.js` covering `daily`, `weekdays`, `weekends`, and `specific_days`, including Sunday (0) and Saturday (6). It goes in `lib/` rather than `features/Habits/` because `lib/` never imports from `features/`, and `notifications.js` needs it.

#### 4.3.2 Habit groups and recurrence labels (three copies and two copies)

- The group list `["AM", "Misc", "PM"]` is defined in `Habits/constants.js` (`HABIT_GROUPS`), `HabitForm.jsx:5`, and `HabitsPage.jsx:25`. Only `TodayPage` uses the constant.
- The recurrence labels are defined twice: `RECURRENCE_OPTIONS` in `HabitForm.jsx:7` and `RECURRENCE_LABELS` in `HabitItem.jsx:19`.

**Change:** Put `HABIT_GROUPS` and one `RECURRENCE_LABELS` map in `Habits/constants.js`. `HabitForm` builds its options with `Object.entries(RECURRENCE_LABELS)`, and the other files import from there. `DAY_LABELS` can move into the same file.

#### 4.3.3 Priorities (three copies)

- `PRIORITY_LABELS` lives in `lib/store.js:382`, even though only Tasks code uses it, and it nests each label for no reason (`{ 5: { label: "Critical" } }`).
- `TaskForm.jsx:54` doesn't use it and hard-codes its own `["", "Someday", "Low", "Medium", "High", "Critical"][p]`.
- `TaskForm` and `TaskItem`'s `PrioritySelect` each hard-code `[5, 4, 3, 2, 1]`.

**Change:** Move the labels to `features/Tasks/constants.js` as a flat map (`{ 5: "Critical", … }`) plus the ordered `PRIORITIES = [5, 4, 3, 2, 1]`. Use them in `TaskForm`, `TaskItem`, and `PriorityBadge`.

#### 4.3.4 "Today" (two copies)

`store.js:13` defines `today = () => format(new Date(), "yyyy-MM-dd")`. `lib/date.js` already has `getTodayString()`, which returns the same value and is used by the pages.

**Change:** The store imports `getTodayString` and drops its own `today` helper and its direct `date-fns` import.

#### 4.3.5 Building notifications (two copies each)

`scheduleHabitNotification` and `rescheduleAllHabitNotifications` each build the same `{ id, title: "Habit Reminder", body, schedule }` object and run the same platform and permission checks. The task versions do the same thing. That's about 100 lines of near-copies.

**Change:** Add two private builders, `habitNotification(habit)` and `taskNotification(task)`, that return a notification or `null`. Add one private `schedule(notifications)` that checks the platform and permission. Then the single and bulk functions each become one line that builds and schedules. Combined with the removals in §4.2.3, `notifications.js` should shrink by about half. The single-item exports keep their names, so `store.js` doesn't change. The bulk ones no longer cancel anything first, so they're renamed from `rescheduleAll…` to `scheduleAllHabitNotifications` and `scheduleAllTaskNotifications`. `Taskira.jsx` is their only caller.

#### 4.3.6 Drag-and-drop row setup (four copies)

`HabitItem`, `TaskItem`, and `ChecklistDetailPage`'s `SectionChip` and `ChecklistItemRow` each repeat the same 13 lines: `useSortable({ id })`, then build `{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }`. `ChecklistDetailPage` also sets up its own `useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))`, which matches `DragContext`.

**Change:** In `features/DragAndDrop/`, replace the dead `useDragMode.js` with:

- `useSortableItem(id)`, which returns `{ setNodeRef, style, handleProps }`. `handleProps` is `attributes` and `listeners`, spread onto the grip.
- `useDragSensors()`, used by `DragContext` and `ChecklistDetailPage`.

`ChecklistDetailPage` keeps its own `DndContext`, because one item context spans several `SortableContext`s (one per section). `DragContext` doesn't handle that.

### 4.4 Easier to follow

#### 4.4.1 Split `ChecklistDetailPage.jsx`

At 428 lines, it's the biggest file in the app. It holds four components and two helper functions. The [README](../../../README.md) says each feature folder holds "its page(s), components, constants, and helpers, one file each".

**Change:** Move `SectionChip`, `ItemContainer`, and `ChecklistItemRow` into their own files in `features/Checklists/`. Each one gets its own `.module.css`, holding the rules for the classes it uses. The page keeps the data loading, header, drag handlers, and the `containerKey` helpers those handlers use. This is a pure move, with no logic changes.

`TaskItem.jsx`'s `PrioritySelect` is small and only used there, so it can stay. After §4.3.3 it's only a few lines.

#### 4.4.2 `Taskira.jsx` effects

The two effects at lines 22-34 trigger the lint warnings because they read values they don't list as dependencies. Adding `habits` and `tasks` as dependencies would be wrong: it would reschedule every notification on every edit, which the store actions already handle one at a time.

**Change:** Add `initialize` to the first effect's dependencies (Zustand actions keep the same identity, so this is safe). In the second effect, read `useStore.getState()` instead of the values from the render. That says what it means: run once, using whatever the store holds at that moment.

#### 4.4.3 Remove unused CSS module classes

These classes are defined but never used. I found them by checking each `.module.css` against the `.jsx` file next to it. Re-check before deleting.

| File                                                 | Unused classes                             |
| ---------------------------------------------------- | ------------------------------------------ |
| `features/Today/TodayPage.module.css`                | `.habitGroup`, `.habitGroupTitle`, `.meta` |
| `features/Tasks/TasksPage.module.css`                | `.renameForm`                              |
| `features/Habits/HabitsPage.module.css`              | `.empty`                                   |
| `features/Checklists/ChecklistDetailPage.module.css` | `.checklistDetailRoute`                    |

## 5. Order

The step-by-step order, with commands and code, is in the [implementation plan](./IMPLEMENTATION_PLAN.md). In short: fix CI first, then delete code, then deduplicate it, then restructure, then clean up config. Each step leaves `format:check`, `lint`, `test`, and `build` passing.

## 6. Decisions

1. **Tasks drag mode works like Habits.** `TaskItem` shows the grip only when the toggle is on. This is the only change users will notice.
2. **The Kitchen Sink is removed,** along with every component, variant, icon, and style that only it used (§4.2.2).
3. **The Tauri opener plugin is removed, and `Cargo.toml` gets real metadata** (§4.2.4). This is part of this work, verified with `npm run tauri:build` and a manual launch of the built app.

## 7. Risks

| Risk                                                                        | Mitigation                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refactoring the notifications changes when or whether reminders fire on iOS | Keep the exported function names. Test on an iOS device or simulator: create a habit and a task with alarms, then relaunch, and check that both still show up as pending reminders                                                                                                                |
| `occursOn` gets the weekday math wrong                                      | Unit tests with the same `TZ=America/New_York` setting the existing tests use                                                                                                                                                                                                                     |
| A deleted CSS class was used through a dynamic name                         | The only dynamic lookups are `PriorityBadge`'s `p1`–`p5` classes and the base components' `css[v]` variant lookups. None of the classes in §4.2.2 or §4.4.3 match them, except the variants already checked against every `variant="…"` in `features/`. Click through every page in `npm run dev` |
| Renaming the Cargo package changes the desktop build                        | Tauri names the `.app` after `productName` in `tauri.conf.json`, not the Cargo package. Check the bundle name after `npm run tauri:build`, and launch it                                                                                                                                          |
| Moving files loses `git log` history                                        | Use `git mv` for the `ChecklistDetailPage` split where a file keeps most of its content                                                                                                                                                                                                           |

## 8. Acceptance criteria

- [ ] CI passes on the branch. `npm run lint` reports **0 errors and 0 warnings**.
- [ ] The files in §4.2.1 and §4.2.2 don't exist, and `base/components/index.js` doesn't export `Header`, `Scroller`, `Container`, or `Disclosure`.
- [ ] `grep -rni "kitchen" apps/web/src README.md` returns nothing.
- [ ] `grep -rn "completed_at\|useDragMode" apps/web/src` returns nothing, and `grep -rn "PRIORITY_LABELS" apps/web/src/lib` returns nothing.
- [ ] `grep -rn "INBOX_PROJECT_ID" apps/web/src` only matches `lib/store.js`.
- [ ] `grep -rn '"AM", "Misc", "PM"' apps/web/src` matches only `features/Habits/constants.js`.
- [ ] `grep -rn "CSS.Transform.toString" apps/web/src` matches only `features/DragAndDrop/`.
- [ ] Habit recurrence is decided in one function (`lib/habits.js`), and `lib/habits.test.js` covers all four recurrence types.
- [ ] No `version` field in `apps/*/package.json`. `npm run deploy` still bumps the root `package.json` and `tauri.conf.json` the same way it does today.
- [ ] In `npm run dev`, every route works as before: `/login`, `/`, `/habits`, `/tasks`, `/checklists`, `/checklists/:id`. `#/kitchen-sink` falls through like any unknown route. Adding, editing, completing, reordering, and deleting work for habits, tasks, subtasks, checklist sections, and checklist items.
- [ ] On Tasks, the grip only shows when the drag-mode toggle is on, and dragging still reorders tasks.
- [ ] Nothing in `apps/tauri/src-tauri` mentions `opener`, except generated files. `npm run tauri:build` succeeds, and the built `Taskira.app` launches, signs in, and can be dragged by its title bar.
- [ ] On iOS, habit and task reminders are still scheduled after an add, an edit, and a relaunch.
