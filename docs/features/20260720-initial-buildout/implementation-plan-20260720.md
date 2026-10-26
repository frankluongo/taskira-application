# Implementation Plan — 2026-07-20

Based on [product-requirements.md](./product-requirements.md). Organized by feature, in the recommended build order. Each section lists schema changes, store changes, and UI changes. Flagged **Decisions I'm making** are places the requirements doc didn't spell out an exact mechanism — read those before I start, since they're my calls to fill gaps, not yours.

**Infrastructure note:** this repo has no SQL migration files — the schema lives directly in Supabase. Every "Schema" subsection below needs to be applied by hand in the Supabase dashboard/SQL editor before the corresponding code will work. I'll call these out explicitly as I go.

---

## Build order

1. Habits (small, self-contained cleanup)
2. Chores (moderate — new recurrence semantics)
3. Tasks (simplification, unblocks Projects)
4. Projects (new feature, depends on Tasks simplification)
5. Checklists (new feature, fully independent — could also go first if you'd rather see a new feature land before the cleanup work)

---

## 1. Habits

**Schema:** none needed. `end_date` already exists; no new column required since expiry will be enforced by deletion, not a flag (see decision below).

**Decisions I'm making:**
- "Auto-archive, not recoverable" → implemented as a straight delete, not a soft `archived` flag. On `initialize()`, sweep and delete any habit whose `end_date` is in the past. This matches how Chores/Tasks already treat "done" (hard delete, no history) rather than introducing a new archive concept just for Habits.
- The "PM" label typo was only in the requirements doc — the code already stores the group as `"PM"` with no wording baked in, so there's no code change there.

**Store (`src/lib/store.js`):**
- Remove the `every_other_day` case from `habitsDueToday()`.
- Add an expiry sweep in `initialize()`: delete habits where `end_date < today` (client + Supabase).

**Notifications (`src/lib/notifications.js`):**
- Remove the `every_other_day` branch from `nextHabitOccurrence()`. (Already correctly skips non-due days for daily/weekdays/weekends/specific_days — no other changes needed here, since notifications already only fire on due days.)

**UI:**
- `HabitForm.jsx`: remove `"every_other_day"` from `RECURRENCE_OPTIONS`.
- `HabitItem.jsx`: remove `every_other_day` from `RECURRENCE_LABELS`.

---

## 2. Chores

**Schema:** add two columns to `chores`:
- `repeat_from` (text, default `'due_date'`, values `'due_date' | 'completion_date'`)
- Recurrence values need a new `'daily'` option supported (no schema change — `recurrence` is already a free-text column, just a new value the app writes/reads).

**Decisions I'm making:**
- Chores currently has **no "Daily" recurrence option in the UI at all** (`ChoreForm.jsx` only offers weekly/monthly/yearly/custom) even though the original Highlights describe "once a day" as a valid cadence. I'm adding it as part of this pass, since the "daily chores behave like Habits" answer only makes sense if daily chores are actually a selectable option.
- "Filter by category" (from the original Chores Highlights) was never revisited in the Q&A and isn't built yet — `Chores.jsx` has no list/category filter today, only the "Today" toggle. I'm treating this as still in scope since it was never walked back, and adding a list-filter control (same pill-row pattern as the old Tasks project tabs) to the Chores page.

**Store (`src/lib/store.js`):**
- `nextRecurrenceDate(chore)`: accept a `base` date instead of always reading `chore.due_date` — when `chore.repeat_from === 'completion_date'`, base off *today* (the completion date) instead of the stored `due_date`.
- `completeChore(id)`: for `recurrence === 'daily'`, skip the recurrence-math path entirely — just set `due_date` to tomorrow, unconditionally, every time (habit-like refresh, no overdue tracking).
- Add a sweep (in `initialize()` or on Chores page load) that resets any `daily` chore's `due_date` to today if it's stuck in the past, so a skipped daily chore never lingers as "overdue."

**UI:**
- `ChoreForm.jsx`:
  - Add `"Daily"` to the recurrence `<Select>`.
  - Add a "Repeat from" `<Select>` (Due date / Completion date), shown for weekly/monthly/yearly/custom but not for daily (daily has no anchor to choose).
- `ChoreItem.jsx`: add `daily: "Daily"` to `RECURRENCE_LABELS`.
- `Chores.jsx`:
  - Exclude `recurrence === 'daily'` chores from the `overdueChores` filter (they should never appear in the Overdue section).
  - Add a list/category filter row (pills, one per `chore_list`, plus "All") above the existing sections, following the same interaction pattern as the project tabs that are being removed from Tasks.

---

## 3. Tasks

**Schema:** none needed — this is a simplification pass, no new columns.

**Decisions I'm making:**
- Removing the project `<Select>` from `TaskForm.jsx` means a task's `project_id` is fixed at creation time based on *where* it was created (Tasks page → always Inbox; Projects page → whatever project you're viewing), with no way to move a task between projects afterward via the UI. This wasn't explicitly discussed — flagging it now in case you want a lightweight "move to project" action kept somewhere (e.g., in the edit modal) rather than dropping reassignment entirely.

**Store:** no changes needed — `project_id` defaulting to `INBOX_PROJECT_ID` already works as-is.

**UI:**
- `Tasks.jsx`: remove the project-tab `<Scroller>`, `activeProject` state, `ProjectTab` component usage, and the rename-project modal — all of that moves to the new Projects page (see below). `topLevelTasks` filters down to just `project_id === INBOX_PROJECT_ID`.
- `TaskForm.jsx`: remove the "Project" `<Select>` and the `projects` prop; project assignment happens implicitly via whatever `project_id` the caller passes into `initialValues`.
- `TaskItem.jsx`: drop the now-unused `projects` prop passed to the edit-mode `TaskForm`.

---

## 4. Projects (new feature)

**Schema:**
- `projects`: add `completed_at` (timestamp, nullable) — set when a project is archived.
- `tasks`: add `completed_at` (timestamp, nullable), `recurrence` (text, nullable — same format as chores), `repeat_from` (text, default `'due_date'`).

**Decisions I'm making — read this one carefully:**
- Standalone/Inbox tasks keep today's behavior: `completeTask` hard-deletes the row (nothing in the Tasks Q&A asked to change that).
- **Project tasks are different.** For "completed projects stay archived and viewable" to work, a project's tasks can't be hard-deleted when checked off individually — otherwise there'd be nothing left to archive later. So project tasks (any task where `project_id !== INBOX_PROJECT_ID`) use the new `completed_at` field instead of deletion: completing one sets `completed_at = now`, it disappears from the active project view, but the row survives.
- When a project itself is marked complete: set `projects.completed_at = now`, bulk-set `completed_at = now` on every remaining incomplete task under it, and clear `recurrence` on any recurring task under it (so it stops generating future occurrences — matches "recurring tasks get swept up and stop recurring").
- Archived projects need to stay reachable ("refer back to them") — I'm adding a "Show archived" toggle on the Projects page (same pattern as the "show completed" toggle already on the Habits page) rather than a separate route.
- There is currently **no UI anywhere to create a project** — `addProject`/`deleteProject` exist in the store but are unused; only rename (`updateProject`, via long-press) is wired up in `Tasks.jsx`. The new Projects page needs full create/rename/archive, not just the rename piece that already exists.

**Store (`src/lib/store.js`):**
- `completeTask`: branch on `project_id === INBOX_PROJECT_ID` — Inbox tasks delete as today; project tasks set `completed_at` instead.
- New `completeProject(id)`: sets the project's `completed_at`, bulk-completes its remaining tasks, clears recurrence on its recurring tasks.
- New `addProject`/`deleteProject` wiring stays as-is (already implemented) — just needs UI.
- Reuse the chore `nextRecurrenceDate`-style logic (now generalized with the `repeat_from` base-date parameter from the Chores work) for project task recurrence, per the "same engine as Chores" decision.

**UI (new `src/pages/Projects.jsx` + `src/features/Projects/`):**
- Horizontal project-pill scroller at the top (the piece removed from `Tasks.jsx` moves here), "All" + one pill per active project, selecting one filters the task list below to just that project.
- "Show archived" toggle to reveal completed projects and their completed tasks.
- Add-project affordance (name only) and the existing long-press-to-rename pattern carried over from `Tasks.jsx`.
- A "complete project" action (e.g., a checkmark on the project pill or in a project detail area).
- Project tasks reuse `TaskItem`/`TaskForm`, extended with the recurrence + repeat-from fields (same controls added to `ChoreForm` in the Chores work — consider extracting a shared `RecurrenceFields` component rather than duplicating the due-date/completion-date picker in two forms).

**Navigation:** add a "Projects" tab to `AppNavigation.jsx` (new icon needed — nothing suitable in `src/base/icons` currently, e.g. a folder icon) and a `/projects` route in `App.jsx`.

---

## 5. Checklists (new feature)

**Schema — three new tables:**
- `checklists` (id, name, sort_order)
- `checklist_sections` (id, checklist_id, name, sort_order)
- `checklist_items` (id, checklist_id, section_id **nullable**, name, checked boolean, sort_order)

**Decisions I'm making:**
- Routing uses `id`, not name, for the detail URL (`/checklists/:id`), so renaming a checklist doesn't break bookmarks — the name still displays as the page title. (You described `/checklists/name-of-checklist/`; functionally identical, just avoids slug-collision/rename edge cases.)
- `checked` state lives on the item row directly rather than a separate completions table (unlike Habits) — checklists explicitly don't need history, and "reset" just needs to flip every `checked` back to `false` in place.
- Sections and items share one continuous drag-and-drop surface conceptually, but are separate sortable containers technically: items can be dragged within a section, moved to a different section, or dragged out to the ungrouped/top-level area; sections themselves reorder independently of item drags. This is the one genuinely new UI pattern in this whole plan — everywhere else in the app, drag-and-drop is a single flat list (`dnd-kit`'s `SortableContext` used once per page). Multi-container drag-and-drop (items crossing section boundaries) needs `dnd-kit`'s multi-container pattern, which nothing in the codebase does yet — worth budgeting extra time here.

**Store (`src/lib/store.js`):**
- `checklists`, `checklist_sections`, `checklist_items` arrays + `initialize()` fetch.
- `addChecklist`, `deleteChecklist`, `renameChecklist`.
- `addSection`, `renameSection`, `deleteSection`, `reorderSections`.
- `addItem`, `deleteItem`, `toggleItem`, `moveItem` (change `section_id` + `sort_order`, covers both same-section reorder and cross-section drag), `resetChecklist` (bulk-set `checked = false` for every item in a checklist).

**UI (new `src/pages/Checklists.jsx`, `src/pages/ChecklistDetail.jsx` + `src/features/Checklists/`):**
- `/checklists`: list of checklists, tap to open, "+ Checklist" to create (name only).
- `/checklists/:id`: the detail page, with an explicit mode toggle (edit vs. check-off), matching the requirement that editing and checking-off never happen accidentally in the same interaction mode.
  - **Check-off mode:** sections render as visual headers; items underneath are tap-to-check only, no drag handles, no delete buttons visible.
  - **Edit mode:** add/rename/delete sections, add/rename/delete items, drag items within/between sections, drag sections to reorder, "Reset" action (uncheck everything).

**Navigation:** add a "Checklists" tab to `AppNavigation.jsx` (new icon needed) and `/checklists` + `/checklists/:id` routes in `App.jsx`.

---

## Cross-cutting cleanup

- `TaskForm.jsx` and `ChoreForm.jsx` will both grow a due-date/completion-date "repeat from" control once Projects reuses the Chores recurrence engine — worth factoring that into a shared component instead of copy-pasting it a second time.
- `notifications.js` will need `scheduleProjectTaskNotification` / cancel / reschedule-all wiring, mirroring the existing per-feature functions, once project tasks support due dates + alarms.
