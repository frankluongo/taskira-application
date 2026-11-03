# Remove Chores and Projects — Implementation Plan

Step-by-step plan for the [Feature Spec](./FEATURE_SPEC.md). Section references (§) point to the spec.

## How to work through this

- **One PR, one branch:** `refactor/remove-chores-and-projects`, cut from an up-to-date `main`.
- **Run every command from the repo root** (`taskira-application/`) unless a step says otherwise.
- **Commit after each numbered step.** Each step leaves the app building and lint-clean, so any commit can be checked out on its own. The suggested commit messages appear in each step.
- **Don't edit anything in `docs/features/`** except this plan's checkboxes and the spec's status. Older specs mention Chores and Projects on purpose (§3).
- **If anything doesn't match what's described** (an extra file, a reference not listed here), stop and add it to spec §4 before you continue.

---

## Step 0 — Prepare

1. Start from a clean, current `main`:
   ```sh
   git checkout main
   git pull
   git status          # must be clean (ignore untracked docs/ if present)
   git checkout -b refactor/remove-chores-and-projects
   ```
2. Record a baseline:
   ```sh
   npm run lint && npm test && npm run build
   ```
   All three must pass **before** you change anything. If they don't, stop. The failure isn't caused by this work.

---

## Step 1 — Back up and move data (Supabase dashboard)

This step is safe to do first. The current app already shows Inbox tasks on the Tasks tab, so moving open project tasks there changes nothing that breaks.

1. In **Table Editor**, export `chores`, `chore_lists`, `projects`, and `tasks` to CSV. Keep the files outside the repo.
2. In **SQL Editor**, see what you're about to move:
   ```sql
   select t.name, t.due_date, t.recurrence, p.name as project
   from tasks t
   join projects p on p.id = t.project_id
   where t.project_id <> '00000000-0000-0000-0000-000000000001'
     and t.completed_at is null
   order by p.name, t.sort_order;
   ```
   Note any recurring tasks you still care about. You'll recreate them as Habits after the release.
3. Move them to the Inbox (spec §4.5):
   ```sql
   update tasks
   set project_id = '00000000-0000-0000-0000-000000000001',
       recurrence = null
   where project_id <> '00000000-0000-0000-0000-000000000001'
     and completed_at is null;
   ```
4. Confirm the count is now zero:
   ```sql
   select count(*) from tasks
   where project_id <> '00000000-0000-0000-0000-000000000001'
     and completed_at is null;
   ```

No commit for this step.

> **Don't** drop or truncate any table. That's the optional follow-up in spec §7.

---

## Step 2 — Remove the pages, routes, and tabs

1. Delete both feature folders:
   ```sh
   git rm -r apps/web/src/features/Chores apps/web/src/features/Projects
   ```
2. **`apps/web/src/routes.jsx`**: delete these four lines:
   ```js
   import { ChoresPage } from "@/features/Chores/ChoresPage";
   import { ProjectsPage } from "@/features/Projects/ProjectsPage";
   { path: "chores", element: <ChoresPage /> },
   { path: "projects", element: <ProjectsPage /> },
   ```
3. **`apps/web/src/features/Taskira/AppNavigation.jsx`**:
   - Delete the `/chores` and `/projects` entries from `tabs`.
   - Delete `IconFolder` and `IconList` from the `@/base` import.
4. Check:
   ```sh
   npm run lint && npm run build
   ```
5. Commit: `refactor: remove chores and projects pages`

---

## Step 3 — Remove Chores from Today

In **`apps/web/src/features/Today/TodayPage.jsx`**:

1. Remove `chores` and `completeChore` from the `useStore()` destructure.
2. Delete the `todayChores` line.
3. Change the empty check to:
   ```js
   const hasAnything = habits.length + todayTasks.length > 0;
   ```
4. Delete the whole `{todayChores.length > 0 && ( <Section title="Chores"> … )}` block.
5. If `Section` is still used by the Tasks block, leave its import. Lint will tell you otherwise.
6. Check: `npm run lint`
7. Commit: `refactor: remove chores from today page`

---

## Step 4 — Remove Chores and Projects from the store and notifications

These go together because `store.js` imports the chore notification helpers.

1. **`apps/web/src/lib/notifications.js`**: delete `scheduleChoreNotification`, `cancelChoreNotification`, and `rescheduleAllChoreNotifications`.
2. **`apps/web/src/features/Taskira/Taskira.jsx`**:
   - Remove `rescheduleAllChoreNotifications` from the import and its call in the `useEffect`.
   - Remove `chores` from the `useStore()` destructure.
3. **`apps/web/src/lib/store.js`**:
   - Remove `scheduleChoreNotification` and `cancelChoreNotification` from the `./notifications` import.
   - In the initial state, delete `chore_lists: []`, `chores: []`, and `projects: []`.
   - In `initialize`:
     - Delete the `chore_lists`, `chores`, and `projects` entries from **both** the destructured array and the `Promise.all` list. Keep the two lists in the same order; they're matched by position.
     - Delete `staleDailyChores` and `freshChores`.
     - Delete `chore_lists`, `chores`, and `projects` from the `set({ … })` call.
     - Delete the `if (staleDailyChores.length > 0) { … }` block.
   - Delete the whole **Chore Lists**, **Chores**, and **Projects** sections (from `// ── Chore Lists` down to just above `// ── Tasks`).
   - Leave `nextRecurrenceDate` for now. `completeTask` still calls it until Step 6.
4. Check:
   ```sh
   grep -n -i 'chore\|projects' apps/web/src/lib/store.js apps/web/src/lib/notifications.js apps/web/src/features/Taskira/Taskira.jsx
   ```
   Only comments inside `nextRecurrenceDate` (its `chore` parameter) should match. Then `npm run lint && npm test && npm run build`.
5. Commit: `refactor: remove chores and projects from store`

---

## Step 5 — Clear stale reminders on launch

Spec §4.4. Phones that had chore reminders scheduled keep them until something cancels them.

1. In **`apps/web/src/lib/notifications.js`**, add after `requestNotificationPermission`:
   ```js
   export async function cancelAllPendingNotifications() {
     if (!Capacitor.isNativePlatform()) return;
     const { notifications } = await LocalNotifications.getPending();
     if (notifications.length > 0)
       await LocalNotifications.cancel({ notifications });
   }
   ```
2. In **`apps/web/src/features/Taskira/Taskira.jsx`**, import it and call it before the reschedules, so the effect reads:
   ```js
   requestNotificationPermission()
     .then(cancelAllPendingNotifications)
     .then(() => {
       rescheduleAllHabitNotifications(habits);
       rescheduleAllTaskNotifications(tasks);
     });
   ```
   Cancelling first matters. If it ran after or alongside the reschedules, it could wipe the reminders they just set.
3. Check: `npm run lint`
4. Commit: `fix: clear stale notifications before rescheduling`

---

## Step 6 — Remove task recurrence and project-only task code

Spec §4.3. Once Projects are gone, every task is an Inbox task, so these paths can't run.

1. **`apps/web/src/lib/store.js`**
   - In `initialize`, load only Inbox tasks:
     ```js
     supabase
       .from("tasks")
       .select("*")
       .eq("project_id", INBOX_PROJECT_ID)
       .order("sort_order"),
     ```
   - Delete `staleDailyTasks`, `freshTasks`, and the `if (staleDailyTasks.length > 0) { … }` block. Set `tasks: tasks || []` in the `set({ … })` call.
   - Replace `completeTask` with the Inbox behavior only:
     ```js
     completeTask: async (id) => {
       set((s) => ({
         tasks: s.tasks.filter((t) => t.id !== id && t.parent_task_id !== id),
       }));
       await supabase.from("tasks").delete().eq("id", id);
       cancelTaskNotification(id);
     },
     ```
   - Delete `nextRecurrenceDate`.
   - Trim the `date-fns` import to `import { format } from "date-fns";`.
   - Keep `INBOX_PROJECT_ID`. `TaskForm` and `TasksPage` still use it.
2. **`apps/web/src/features/Tasks/TaskForm.jsx`**
   - Delete `parseRecurrence` and the `allowRecurrence` prop.
   - Delete the `recurrence`, `customInterval`, `customUnit`, and `repeatFrom` state, and `showRepeatFrom`.
   - In `handleSubmit`, delete `recurrenceValue` and the `recurrence` and `repeat_from` keys from the `onSubmit` payload, and delete `setRecurrence(parsed.recurrence)` from the reset.
   - Delete the recurrence `<Select>` and the two `{allowRecurrence && …}` field rows. The priority `<Select>` is left alone in its `<FieldsRow>`.
3. **`apps/web/src/features/Tasks/TaskItem.jsx`**
   - Delete `RECURRENCE_LABELS` and `recurrenceLabel`.
   - Delete the `{task.recurrence && ( … )}` span in the meta row.
   - Delete the `allowRecurrence={…}` prop on `<TaskForm>`.
   - Remove `INBOX_PROJECT_ID` from the `@/lib/store` import.
4. Check:
   ```sh
   grep -rn 'recurrence\|repeat_from\|allowRecurrence' apps/web/src/features/Tasks   # expect no output
   npm run lint && npm test && npm run build
   ```
5. Commit: `refactor: remove recurrence from tasks`

---

## Step 7 — Final sweep

1. Look for leftovers:
   ```sh
   grep -rniE 'chore|project' apps/web/src
   ```
   Allowed matches: `INBOX_PROJECT_ID`, `project_id`, and the "All the colors for this project" comment in `index.css`. Anything else gets removed and added to spec §4.
2. Check that nothing outside `apps/web/src` points at the old routes:
   ```sh
   grep -rIn -i '#/chores\|#/projects\|/chores\|/projects' . \
     --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs --exclude-dir=target
   ```
3. `npm run format` and commit any changes as `style: format`.

---

## Step 8 — Verify

Run the CI pipeline locally:

```sh
npm run format:check
npm run lint
npm test
npm run build
```

Then check by hand with `npm run dev`, signed in:

1. The footer shows Today, Habits, Tasks, Checklists, in that order, and nothing looks squeezed or misaligned.
2. Opening `#/chores` or `#/projects` directly doesn't crash the app.
3. **Today** shows due Habits and Tasks only. With nothing due, it shows "You're all caught up for today."
4. **Tasks**: add a task with a due date and time, edit it, add a subtask, reorder, toggle the Today filter, then complete it. The form has no recurrence fields, and completing removes the task and its subtasks.
5. Any task moved in Step 1 shows on the Tasks tab.
6. **Habits** and **Checklists** work as before.

Then on iOS (`npm run cap:sync`, run from Xcode on a device that had chore reminders):

7. After launch, no "Chore Reminder" notifications are pending, and a habit or task with a reminder a couple of minutes out still fires.

Then `npm run tauri:dev`. The desktop app starts and loads.

Tick the acceptance criteria in spec §6 and set the spec's **Status** to `Done`.

---

## Step 9 — Open the PR and release

1. Push the branch and open a PR to `main`:
   ```sh
   git push -u origin refactor/remove-chores-and-projects
   gh pr create --base main --title "refactor: remove Chores and Projects" \
     --body "Removes the Chores and Projects features per docs/features/20261103-remove-unused-features/FEATURE_SPEC.md. Open project tasks were moved to the Inbox beforehand; no tables were dropped."
   ```
2. Wait for CI to pass, then merge.
3. From `main`, release a minor version: `npm run deploy feat` (0.4.x → 0.5.0).
4. Install the new build on every device (desktop `.dmg`, iOS via Xcode). Older builds keep working against the untouched tables until then.
5. Recreate any recurring project tasks you noted in Step 1 as Habits.

## Rollback

All code changes are in this one PR, and no table was dropped. `git revert <merge commit>` brings both features back with their data. The only change that a revert doesn't undo is Step 1's data move. To undo it, restore `project_id` and `recurrence` on the moved rows from the `tasks` CSV backup.
