# Remove Chores and Projects — Feature Spec

**Status:** Proposed · **Date:** 2026-11-03 · **Scope:** `apps/web` (features, routes, navigation, store, notifications), plus a one-time data check in Supabase

## 1. Summary

Chores and Projects were added in the initial buildout ([product requirements](../20260720-initial-buildout/product-requirements.md)) alongside Habits, Tasks, and Checklists. After a few months of daily use, I don't use either one. Recurring chores ended up as Habits, and project work ended up as plain Tasks. The two tabs take up a third of the footer navigation, and they're the most complex code in the app: a due-date recurrence engine, chore lists, project archiving, and a separate notification type.

Remove both features from the app. Habits, Tasks, Checklists, and Today stay. Today loses only its Chores section.

This is a **feature removal**. Nothing is added, and Habits, Tasks, and Checklists keep working exactly as they do now.

## 2. Goals

1. **Fewer tabs.** The footer goes from six tabs to four: Today, Habits, Tasks, Checklists.
2. **Less code.** Delete everything that exists only for Chores or Projects, including the parts of Tasks that only Project tasks could reach (§4.3).
3. **No lost data.** Any project task still in progress moves to the Inbox so it shows on the Tasks tab. Nothing is deleted from the database.
4. **No ghost reminders.** iOS stops showing "Chore Reminder" notifications once the update is installed.

## 3. Non-goals

- **Dropping database tables or columns.** `chores`, `chore_lists`, and `projects` stay in Supabase, and so do `tasks.project_id`, `tasks.recurrence`, `tasks.repeat_from`, and `tasks.completed_at`. Leaving them makes the change fully reversible. Dropping them is an optional follow-up (§7).
- **Removing the Inbox project.** Tasks still write `project_id = INBOX_PROJECT_ID`, and the Inbox row in `projects` stays. The column is probably a foreign key to `projects` (the schema isn't in the repo, so this is unconfirmed), so removing it is part of the database follow-up, not this change.
- **Removing base components or icons.** `Scroller`, `IconList`, and `IconFolder` become unused by features but stay in `src/base`. They're general building blocks and `KitchenSink` still shows the icons.
- **Changing Habits, Checklists, or the Inbox task flow.** Completing an Inbox task still deletes it, priorities stay the same, and task reminders keep working.
- **Rewriting older docs in `docs/features/`.** They describe past work and stay as written.

## 4. Changes

### 4.1 Files deleted

| Path                                        | Notes                           |
| ------------------------------------------- | ------------------------------- |
| `apps/web/src/features/Chores/` (6 files)   | Page, form, item, and their CSS |
| `apps/web/src/features/Projects/` (2 files) | Page and its CSS                |

### 4.2 App wiring

| File                                              | Change                                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/routes.jsx`                         | Remove the `chores` and `projects` routes and their imports. Old `#/chores` and `#/projects` links fall through like any unknown route. |
| `apps/web/src/features/Taskira/AppNavigation.jsx` | Remove the Chores and Projects tabs and the `IconList` and `IconFolder` imports.                                                        |
| `apps/web/src/features/Today/TodayPage.jsx`       | Remove the Chores section and its share of the "all caught up" check.                                                                   |
| `apps/web/src/features/Taskira/Taskira.jsx`       | Stop rescheduling chore notifications. Clear stale ones on startup (§4.4).                                                              |

### 4.3 Store (`apps/web/src/lib/store.js`) and Tasks

**Chores and Projects state.** Remove the `chore_lists`, `chores`, and `projects` state; their three Supabase queries in `initialize`; the daily-chore rollover; and these actions: `addChoreList`, `deleteChoreList`, `addChore`, `updateChore`, `deleteChore`, `reorderChores`, `completeChore`, `addProject`, `updateProject`, `deleteProject`, and `completeProject`.

**Task loading.** `initialize` loads only Inbox tasks (`.eq("project_id", INBOX_PROJECT_ID)`). Archived project tasks stay in the database but never enter the store, so they can't show up on Today or get reminders.

**Recurring tasks.** Recurrence on tasks only ever worked inside Projects. `TaskForm` only shows the recurrence fields when `allowRecurrence` is set, and only `ProjectsPage` and project tasks in `TaskItem` set it. The original requirements say the same thing: "Recurrence is reserved for Habits/Chores/Project-tasks." With both gone, the code below can never run, so it goes too:

| Where                | Code removed                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `store.js`           | `nextRecurrenceDate`, the daily-task rollover in `initialize`, and the recurrence and archive branches of `completeTask` |
| `Tasks/TaskForm.jsx` | `allowRecurrence` prop, `parseRecurrence`, and the recurrence, repeat-from, and custom-interval fields                   |
| `Tasks/TaskItem.jsx` | `RECURRENCE_LABELS`, `recurrenceLabel`, the recurrence label in the meta row, and the `allowRecurrence` prop it passes   |

After this, `completeTask` always does what it already does for Inbox tasks: delete the task and its subtasks and cancel its reminder.

### 4.4 Notifications (`apps/web/src/lib/notifications.js`)

- Delete `scheduleChoreNotification`, `cancelChoreNotification`, and `rescheduleAllChoreNotifications`.
- Add `cancelAllPendingNotifications()`, which reads `LocalNotifications.getPending()` and cancels everything in it. `Taskira.jsx` calls it before rescheduling habits and tasks.

Without this, chore reminders already scheduled on the phone would keep firing after the update, because nothing would cancel them anymore. Cancelling everything and then rescheduling habits and tasks is simpler than picking out chore reminders, and the result is the same: only reminders the app knows about stay scheduled. The rescheduling already runs on every launch, so this adds no new behavior for habits or tasks.

### 4.5 Data (Supabase, by hand)

The repo has no migrations; the schema is managed in the Supabase dashboard. Before the release:

1. Export `chores`, `chore_lists`, `projects`, and `tasks` to CSV as a backup.
2. Move open project tasks to the Inbox and clear their recurrence, so they show on the Tasks tab and complete like every other task:
   ```sql
   update tasks
   set project_id = '00000000-0000-0000-0000-000000000001',
       recurrence = null
   where project_id <> '00000000-0000-0000-0000-000000000001'
     and completed_at is null;
   ```
   Subtasks are moved along with their parents, since they share the parent's `project_id`.
3. Leave completed (archived) project tasks alone. The store no longer loads them (§4.3).

### 4.6 Unaffected

- `package.json` dependencies. `@dnd-kit/*` and `date-fns` are still used by Habits, Tasks, and Checklists.
- `src/base` components and icons (§3).
- Tauri and iOS shells, CI, and release workflows. None of them mention Chores or Projects.

## 5. Risks

| Risk                                                       | Mitigation                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| An open project task disappears from view                  | §4.5 step 2 moves every open project task to the Inbox before the release.                                        |
| A recurring project task loses its schedule                | It becomes a one-off Inbox task with its current due date. Recreate it as a Habit if it still matters.            |
| Old chore reminders keep firing on iOS                     | `cancelAllPendingNotifications()` clears them on the first launch after the update (§4.4).                        |
| Old desktop or phone builds still show Chores and Projects | They keep working against the untouched tables until they're updated. Nothing is deleted, so there are no errors. |
| I want one of them back                                    | Revert the PR. The tables and data are still there.                                                               |

## 6. Acceptance criteria

- [ ] `apps/web/src/features/Chores/` and `apps/web/src/features/Projects/` are gone.
- [ ] `grep -rniE 'chore|project' apps/web/src` only matches `INBOX_PROJECT_ID`, `project_id`, and the "All the colors for this project" comment in `index.css`.
- [ ] `grep -rn 'recurrence\|allowRecurrence' apps/web/src/features/Tasks` returns nothing.
- [ ] The footer shows four tabs: Today, Habits, Tasks, Checklists.
- [ ] Today shows Habits and Tasks only, and shows "You're all caught up" when both are empty.
- [ ] Adding, editing, completing, deleting, and reordering Inbox tasks and subtasks works as before, and the task form has no recurrence fields.
- [ ] Habits and Checklists work as before.
- [ ] The Supabase query in §4.5 step 2 has been run, and `select count(*) from tasks where project_id <> '…0001' and completed_at is null` returns 0.
- [ ] On iOS, no "Chore Reminder" notifications are pending after launch, and habit and task reminders still fire.
- [ ] `npm run format:check`, `npm run lint`, `npm test`, and `npm run build` pass.

## 7. Follow-up (optional, later)

Once the new build has been on every device for a while and I'm sure I won't want the features back, the database can be trimmed in the Supabase SQL editor:

1. `drop table chores; drop table chore_lists;`
2. Drop the foreign key on `tasks.project_id`, then drop `tasks.project_id`, `tasks.recurrence`, `tasks.repeat_from`, and `tasks.completed_at` (after deleting archived project tasks), then `drop table projects;`. This also removes `INBOX_PROJECT_ID` from the code.

Each of these is irreversible, so each needs its own short spec when the time comes.
