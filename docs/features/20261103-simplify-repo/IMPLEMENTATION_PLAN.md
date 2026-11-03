# Simplify the Repo — Implementation Plan

Step-by-step plan for the [Feature Spec](./FEATURE_SPECS.md). Section references (§) point to the spec.

## How to work through this

- **One PR, one branch:** `refactor/simplify-repo`, cut from an up-to-date `main`.
- **Run every command from the repo root** (`taskira-application/`) unless a step says otherwise.
- **Commit after each numbered step.** From Step 1 on, each step leaves `format:check`, `lint`, `test`, and `build` passing, so you can check out any commit on its own. Each step includes a suggested commit message.
- **"Check" means:**
  ```sh
  npm run format:check && npm run lint && npm test && npm run build
  ```
  Run `npm run format` first if `format:check` fails.
- **Don't edit older docs in `docs/features/`.** They describe past work and mention removed things on purpose.
- **If something doesn't match this plan** (an extra file, a reference that isn't listed, or code that looks different), stop and add it to spec §4 before you continue.

---

## Step 0 — Prepare

1. Start from a clean, current `main`:
   ```sh
   git checkout main
   git pull
   git status          # must be clean (ignore untracked docs/ if present)
   git checkout -b refactor/simplify-repo
   ```
2. Record a baseline:
   ```sh
   npm run format:check && npm test && npm run build
   npm run lint
   ```
   `format:check`, `test`, and `build` must pass. `lint` is **expected to fail**, with exactly one error (`'Container' is defined but never used` in `HabitsPage.jsx`) and two `exhaustive-deps` warnings in `Taskira.jsx`. If anything else fails, stop. Something changed on `main` since the spec was written.

---

## Step 1 — Fix CI (§4.1)

1. **`apps/web/src/features/Habits/HabitsPage.jsx`**: delete `Container,` from the `@/base` import.
2. Check. Lint now reports 0 errors and the same 2 warnings, which Step 9 fixes.
3. Commit: `fix: remove unused Container import`

Consider pushing this step as its own PR so `main` goes green right away. The rest of the branch rebases on it cleanly.

---

## Step 2 — Remove the Kitchen Sink and what only it uses (§4.2.2)

1. Delete the page and the showcase-only files:
   ```sh
   git rm -r apps/web/src/features/KitchenSink \
             apps/web/src/base/components/Disclosure \
             apps/web/src/base/icons/IconList.jsx \
             apps/web/src/base/icons/IconFolder.jsx
   ```
2. **`apps/web/src/routes.jsx`**: delete these two lines:
   ```js
   import { KitchenSinkPage } from "@/features/KitchenSink/KitchenSinkPage";
   { path: "kitchen-sink", element: <KitchenSinkPage /> },
   ```
3. **`apps/web/src/base/components/index.js`**: delete `export * from "./Disclosure/Disclosure";`
4. **`apps/web/src/base/icons/index.js`**: delete the `IconFolder` and `IconList` lines.
5. **`apps/web/src/base/components/Button/Button.module.css`**:
   - Delete the whole PILL region, from `/* PILL: START */` through `/* PILL: END */` and the `/* ===… */` divider line after it.
   - Delete the `.button.toggle.square { … }` rule.
6. **`apps/web/src/base/components/FlexColumn/FlexColumn.module.css`**: delete the `.flexColumn.lg` and `.flexColumn.xl` rules.
7. **`apps/web/src/index.css`**:
   - Delete the `/* Manual override for previewing both themes … */` comment and the `:root[data-theme="light"]` and `:root[data-theme="dark"]` blocks under it. Keep the `@media (prefers-color-scheme: dark)` block above them.
   - Delete the `--color-platinum: #edf2f4;` line.
   - Delete the whole `@layer utilities { … }` block (`.pt-safe` and `.pb-safe`).
8. **`README.md`**: delete the line `To browse the base components, run npm run dev and open #/kitchen-sink (requires sign-in).` and the blank line before it.
9. Make sure nothing else still uses them:
   ```sh
   grep -rniE 'kitchen|Disclosure|IconList|IconFolder|data-theme|platinum|pt-safe|pb-safe|"pill"|"square"' apps/web/src README.md
   grep -rnE 'variant="[^"]*\b(lg|xl)\b' apps/web/src
   ```
   Both should return nothing.
10. Check.
11. Commit: `refactor: remove kitchen sink and showcase-only components`

---

## Step 3 — Delete other dead files (§4.2.1)

1. Delete them:
   ```sh
   git rm apps/web/src/base/icons/IconSun.jsx \
          apps/web/src/features/Habits/functions.js \
          apps/web/src/features/DragAndDrop/useDragMode.js \
          apps/web/public/_redirects
   git rm -r apps/web/src/base/components/Header \
             apps/web/src/base/components/Scroller \
             apps/web/src/base/components/Container
   ```
2. **`apps/web/src/base/components/index.js`**: delete the `Container`, `Header`, and `Scroller` lines.
3. Make sure nothing imports them:
   ```sh
   grep -rnwE 'Header|Scroller|Container|IconSun|useDragMode' apps/web/src
   ```
   Should return nothing. `Taskira.jsx` uses a lowercase `<header>` element, which `-w` doesn't match because grep is case-sensitive.
4. Check.
5. Commit: `refactor: delete unused components and files`

---

## Step 4 — Remove dead code paths (§4.2.3, §4.4.3)

### 4a. Tasks are always Inbox tasks

1. **`apps/web/src/lib/store.js`**, in `addTask`: add `project_id: INBOX_PROJECT_ID,` to `row`, above `parent_task_id: null`:
   ```js
   const row = {
     id: crypto.randomUUID(),
     sort_order: get().tasks.length,
     project_id: INBOX_PROJECT_ID,
     parent_task_id: null,
     ...task,
   };
   ```
   Then change `export const INBOX_PROJECT_ID` to `const INBOX_PROJECT_ID`.
2. **`apps/web/src/features/Tasks/TaskForm.jsx`**:
   - Delete the `INBOX_PROJECT_ID` import.
   - Delete `const projectId = initialValues.project_id ?? INBOX_PROJECT_ID;`
   - Delete `project_id: projectId,` from the `onSubmit` object.
3. **`apps/web/src/features/Tasks/TasksPage.jsx`**:
   - Change the import to `import { useStore } from "@/lib/store";`
   - Change the first filter to `.filter((t) => !t.parent_task_id)`.
   - Remove the `initialValues={{ priority: 3, project_id: INBOX_PROJECT_ID }}` prop from `<TaskForm>`. `TaskForm` already defaults `priority` to 3.
4. **`apps/web/src/features/Tasks/TaskItem.jsx`**, in `addSubtask`: delete `project_id: task.project_id,`.

### 4b. No more `completed_at`

1. **`apps/web/src/lib/notifications.js`**:
   - In `scheduleTaskNotification`, change the guard to `if (!task.due_date || !task.alarm_time) return;`
   - In `rescheduleAllTaskNotifications`, change the filter to `.filter((t) => t.due_date && t.alarm_time)`.
2. **`apps/web/src/features/Today/TodayPage.jsx`**: change the filter to `.filter((t) => !t.parent_task_id && t.due_date === today)`.

The rest of `notifications.js`, including the duplicate cancels, is rewritten in Step 6e.

### 4c. One `PageHeaderContext.Provider`

**`apps/web/src/features/Taskira/Taskira.jsx`**: delete the `outlet` constant and the `if (!user) return outlet;` line. Replace the final `return` with:

```jsx
return (
  <PageHeaderContext.Provider value={setPageHeader}>
    {user ? (
      <>
        <header className={css.siteHeader}>
          <h1 className={css.siteTitle}>Taskira</h1>
          <button onClick={handleLogout} className={css.signOut}>
            Sign out
          </button>
        </header>
        <main className={css.main}>
          {pageHeader.title && (
            <header className={css.pageHeader}>
              <h2 className={css.pageTitle}>{pageHeader.title}</h2>
              {pageHeader.action}
            </header>
          )}
          <div className={css.content}>
            <Outlet />
          </div>
        </main>
        <AppNavigation />
      </>
    ) : (
      <Outlet />
    )}
  </PageHeaderContext.Provider>
);
```

### 4d. Unused CSS classes

Delete these rules. Before deleting each one, grep its name across `apps/web/src` to make sure it's really unused:

| File                                                              | Rules                                      |
| ----------------------------------------------------------------- | ------------------------------------------ |
| `apps/web/src/features/Today/TodayPage.module.css`                | `.habitGroup`, `.habitGroupTitle`, `.meta` |
| `apps/web/src/features/Tasks/TasksPage.module.css`                | `.renameForm`                              |
| `apps/web/src/features/Habits/HabitsPage.module.css`              | `.empty`                                   |
| `apps/web/src/features/Checklists/ChecklistDetailPage.module.css` | `.checklistDetailRoute`                    |

### Then

1. Verify:
   ```sh
   grep -rn "completed_at" apps/web/src                  # nothing
   grep -rn "INBOX_PROJECT_ID" apps/web/src              # only lib/store.js
   ```
2. Check.
3. In `npm run dev`, add a task and a subtask, then reload. Both should still show on Tasks, which confirms `project_id` is still written.
4. Commit: `refactor: remove dead task and notification code paths`

---

## Step 5 — Make the Tasks drag-mode toggle work (§6, decision 1)

**`apps/web/src/features/Tasks/TaskItem.jsx`**:

1. Change the signature to `export function TaskItem({ task, subtasks = [], dragMode = false }) {`.
2. Wrap the grip the same way `HabitItem` does:
   ```jsx
   {
     dragMode && (
       <button {...attributes} {...listeners} className={css.grip}>
         <IconGrip />
       </button>
     );
   }
   ```
3. Check.
4. In `npm run dev`, open Tasks:
   - The grip is hidden by default.
   - Turning on the drag toggle shows it, and dragging reorders tasks.
   - Reloading keeps the new order.
   - The rows line up the same with and without the grip, the same as Habits.
5. Commit: `fix: hide task drag handles unless drag mode is on`

---

## Step 6 — One place for each rule (§4.3.1–§4.3.5)

Make one commit per sub-step.

### 6a. Habit recurrence (§4.3.1)

1. Create **`apps/web/src/lib/habits.js`**:

   ```js
   // "daily", and older rows with no recurrence, happen every day
   export function occursOn(habit, dayOfWeek) {
     if (habit.recurrence === "weekdays")
       return dayOfWeek >= 1 && dayOfWeek <= 5;
     if (habit.recurrence === "weekends")
       return dayOfWeek === 0 || dayOfWeek === 6;
     if (habit.recurrence === "specific_days")
       return Boolean(habit.recurrence_days?.includes(dayOfWeek));
     return true;
   }
   ```

2. Create **`apps/web/src/lib/habits.test.js`**:

   ```js
   import { describe, expect, it } from "vitest";
   import { occursOn } from "./habits";

   const SUNDAY = 0;
   const MONDAY = 1;
   const FRIDAY = 5;
   const SATURDAY = 6;

   describe("occursOn", () => {
     it("runs daily habits every day", () => {
       for (let day = 0; day < 7; day++)
         expect(occursOn({ recurrence: "daily" }, day)).toBe(true);
     });

     it("treats a missing recurrence as daily", () => {
       expect(occursOn({ recurrence: null }, SUNDAY)).toBe(true);
     });

     it("runs weekday habits Monday through Friday only", () => {
       const habit = { recurrence: "weekdays" };
       expect(occursOn(habit, MONDAY)).toBe(true);
       expect(occursOn(habit, FRIDAY)).toBe(true);
       expect(occursOn(habit, SATURDAY)).toBe(false);
       expect(occursOn(habit, SUNDAY)).toBe(false);
     });

     it("runs weekend habits Saturday and Sunday only", () => {
       const habit = { recurrence: "weekends" };
       expect(occursOn(habit, SATURDAY)).toBe(true);
       expect(occursOn(habit, SUNDAY)).toBe(true);
       expect(occursOn(habit, MONDAY)).toBe(false);
     });

     it("runs specific-day habits only on the chosen days", () => {
       const habit = { recurrence: "specific_days", recurrence_days: [MONDAY] };
       expect(occursOn(habit, MONDAY)).toBe(true);
       expect(occursOn(habit, FRIDAY)).toBe(false);
     });

     it("never runs specific-day habits with no days chosen", () => {
       expect(occursOn({ recurrence: "specific_days" }, MONDAY)).toBe(false);
     });
   });
   ```

3. **`apps/web/src/lib/store.js`**: import `occursOn` from `"./habits"`. In `habitsDueToday`, replace the four `if (h.recurrence === …)` lines and the final `return true;` with `return occursOn(h, dow);`.
4. **`apps/web/src/lib/notifications.js`**: import `occursOn` from `"./habits"`. In `nextHabitOccurrence`, replace everything after `candidate.setHours(h, m, 0, 0);` inside the loop with:
   ```js
   if (candidate > now && occursOn(habit, candidate.getDay())) return candidate;
   ```
5. Check. The new tests must run and pass.
6. Commit: `refactor: share habit recurrence logic`

### 6b. Habit groups and recurrence labels (§4.3.2)

1. **`apps/web/src/features/Habits/constants.js`** becomes:
   ```js
   export const HABIT_GROUPS = ["AM", "Misc", "PM"];

   export const RECURRENCE_LABELS = {
     daily: "Daily",
     weekdays: "Weekdays",
     weekends: "Weekends",
     specific_days: "Specific days",
   };

   // Indexed by Date#getDay(), so 0 is Sunday
   export const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
   ```
2. **`HabitForm.jsx`**:
   - Delete the local `GROUPS`, `RECURRENCE_OPTIONS`, and `DAY_LABELS`, and import all three names from `./constants`.
   - Use `HABIT_GROUPS` in place of `GROUPS`.
   - Change the recurrence options to:
     ```jsx
     {
       Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
         <option key={value} value={value}>
           {label}
         </option>
       ));
     }
     ```
3. **`HabitsPage.jsx`**: delete the local `GROUPS`, import `HABIT_GROUPS` from `./constants`, and use it.
4. **`HabitItem.jsx`**: delete the local `RECURRENCE_LABELS` and import it from `./constants`.
5. Verify: `grep -rn '"AM", "Misc", "PM"\|"Specific days"' apps/web/src` only matches `constants.js`.
6. Check, then open the Add Habit form and make sure the Group and Recurrence dropdowns are unchanged.
7. Commit: `refactor: define habit groups and labels once`

### 6c. Priorities (§4.3.3)

1. Create **`apps/web/src/features/Tasks/constants.js`**:

   ```js
   export const PRIORITY_LABELS = {
     5: "Critical",
     4: "High",
     3: "Medium",
     2: "Low",
     1: "Someday",
   };

   // Highest first, which is the order every priority picker lists them in
   export const PRIORITIES = [5, 4, 3, 2, 1];
   ```

2. **`apps/web/src/lib/store.js`**: delete `PRIORITY_LABELS` from the bottom of the file.
3. **`PriorityBadge.jsx`**: import from `./constants`. Change the body to use `const label = PRIORITY_LABELS[priority] || PRIORITY_LABELS[1];` and render `{label}`.
4. **`TaskForm.jsx`**: import both from `./constants`, and change the options to:
   ```jsx
   {
     PRIORITIES.map((p) => (
       <option key={p} value={p}>
         {PRIORITY_LABELS[p]}
       </option>
     ));
   }
   ```
5. **`TaskItem.jsx`**: change the store import to `import { useStore } from "@/lib/store";`, import both names from `./constants`, and make `PrioritySelect` use the same `PRIORITIES.map(…)` with `{PRIORITY_LABELS[p]}`.
6. Verify: `grep -rn "PRIORITY_LABELS" apps/web/src/lib` returns nothing, and `grep -rn "5, 4, 3, 2, 1\|Someday" apps/web/src` only matches `Tasks/constants.js`.
7. Check.
8. Commit: `refactor: define task priorities once`

### 6d. "Today" (§4.3.4)

1. **`apps/web/src/lib/store.js`**:
   - Delete `import { format } from "date-fns";` and the `const today = () => …` line.
   - Add `import { getTodayString } from "./date";`.
   - Replace every `today()` call with `getTodayString()`: two in `initialize`, and one each in `completeHabit`, `uncompleteHabit`, `isHabitDoneToday`, and `habitsDueToday`.
2. Verify: `grep -n "today()" apps/web/src/lib/store.js` returns nothing.
3. Check.
4. Commit: `refactor: use getTodayString in the store`

### 6e. Notifications (§4.3.5)

Rewrite **`apps/web/src/lib/notifications.js`** as below. `notifId`, `requestNotificationPermission`, and `cancelAllPendingNotifications` are unchanged:

```js
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { occursOn } from "./habits";

// Stable numeric ID derived from a UUID string (Capacitor requires integer IDs)
function notifId(uuid) {
  let hash = 5381;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash << 5) + hash + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function nextHabitOccurrence(habit) {
  const [h, m] = habit.alarm_time.split(":").map(Number);
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    candidate.setHours(h, m, 0, 0);
    if (candidate > now && occursOn(habit, candidate.getDay()))
      return candidate;
  }
  return null;
}

function habitNotification(habit) {
  if (!habit.alarm_time) return null;
  const at = nextHabitOccurrence(habit);
  if (!at) return null;
  return {
    id: notifId(habit.id),
    title: "Habit Reminder",
    body: habit.name,
    schedule: { at },
  };
}

function taskNotification(task) {
  if (!task.due_date || !task.alarm_time) return null;
  const at = new Date(`${task.due_date}T${task.alarm_time}`);
  if (at <= new Date()) return null;
  return {
    id: notifId(task.id),
    title: "Task Reminder",
    body: task.name,
    schedule: { at },
  };
}

async function schedule(notifications) {
  if (!Capacitor.isNativePlatform()) return;
  const toSchedule = notifications.filter(Boolean);
  if (toSchedule.length === 0) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;
  await LocalNotifications.schedule({ notifications: toSchedule });
}

async function cancel(uuid) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: notifId(uuid) }] });
}

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") {
    await LocalNotifications.requestPermissions();
  }
}

export async function cancelAllPendingNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length > 0)
    await LocalNotifications.cancel({ notifications });
}

export function scheduleHabitNotification(habit) {
  return schedule([habitNotification(habit)]);
}

export function cancelHabitNotification(habitId) {
  return cancel(habitId);
}

// Callers must clear pending notifications first; this only adds
export function scheduleAllHabitNotifications(habits) {
  return schedule(habits.map(habitNotification));
}

export function scheduleTaskNotification(task) {
  return schedule([taskNotification(task)]);
}

export function cancelTaskNotification(taskId) {
  return cancel(taskId);
}

// Callers must clear pending notifications first; this only adds
export function scheduleAllTaskNotifications(tasks) {
  return schedule(tasks.map(taskNotification));
}
```

Then:

1. **`apps/web/src/features/Taskira/Taskira.jsx`**: rename the two imports and calls from `rescheduleAll…` to `scheduleAllHabitNotifications` and `scheduleAllTaskNotifications`. Step 9 changes this effect again.
2. Verify: `grep -rn "rescheduleAll" apps/web/src` returns nothing.
3. Check.
4. Commit: `refactor: build each notification in one place`

The iOS check for this is in Step 12.

---

## Step 7 — Drag-and-drop hooks (§4.3.6)

1. Create **`apps/web/src/features/DragAndDrop/useSortableItem.js`**:

   ```js
   import { useSortable } from "@dnd-kit/sortable";
   import { CSS } from "@dnd-kit/utilities";

   export function useSortableItem(id) {
     const {
       attributes,
       listeners,
       setNodeRef,
       transform,
       transition,
       isDragging,
     } = useSortable({ id });
     return {
       setNodeRef,
       style: {
         transform: CSS.Transform.toString(transform),
         transition,
         opacity: isDragging ? 0.4 : 1,
       },
       handleProps: { ...attributes, ...listeners },
     };
   }
   ```

2. Create **`apps/web/src/features/DragAndDrop/useDragSensors.js`**:

   ```js
   import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

   export function useDragSensors() {
     return useSensors(
       useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
     );
   }
   ```

3. **`DragContext.jsx`**: replace its `useSensors(…)` call with `const sensors = useDragSensors();`, import it from `./useDragSensors`, and trim the `@dnd-kit/core` import to `DndContext` and `closestCenter`.
4. **`HabitItem.jsx`** and **`TaskItem.jsx`**:
   - Replace the `useSortable` destructure and the `style` object with:
     ```js
     const { setNodeRef, style, handleProps } = useSortableItem(habit.id); // task.id in TaskItem
     ```
   - Change the grip to `<button {...handleProps} className={css.grip}>`.
   - Delete the `useSortable` and `CSS` imports, and add `import { useSortableItem } from "@/features/DragAndDrop/useSortableItem";`.
5. **`ChecklistDetailPage.jsx`**:
   - Replace `const sensors = useSensors(…)` with `const sensors = useDragSensors();`.
   - In `SectionChip` and `ChecklistItemRow`, make the same `useSortableItem` change as in item 4. `SectionChip` spreads `{...handleProps}` on its `<button>`.
   - Trim the `@dnd-kit/core` import to `DndContext`, `closestCenter`, and `useDroppable`.
   - Trim the `@dnd-kit/sortable` import to `SortableContext`, `verticalListSortingStrategy`, `horizontalListSortingStrategy`, and `arrayMove`.
   - Delete the `CSS` import.
6. Verify:
   ```sh
   grep -rn "CSS.Transform.toString\|useSensor(" apps/web/src    # only features/DragAndDrop/
   ```
7. Check, then reorder in `npm run dev`:
   - habits within a group,
   - tasks (with drag mode on),
   - checklist section chips,
   - checklist items within a section, and from one section to another.
8. Commit: `refactor: share sortable item and sensor setup`

---

## Step 8 — Split `ChecklistDetailPage.jsx` (§4.4.1)

Move code only. Don't change any logic.

1. Create three files in `apps/web/src/features/Checklists/`. Move each component's function into its own file, with the imports it needs, and export it by name:

   | New file               | Component          | CSS classes to move into its own `.module.css`                                                    |
   | ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
   | `SectionChip.jsx`      | `SectionChip`      | `.chip`                                                                                           |
   | `ItemContainer.jsx`    | `ItemContainer`    | `.itemContainer`, `.addItem`, `.addItemForm`, `.addItemInput`, `.addItemSubmit`, `.addItemCancel` |
   | `ChecklistItemRow.jsx` | `ChecklistItemRow` | `.itemRow`, `.grip`, `.itemName`, `.checkbox`, `.checked`                                         |
   - `ItemContainer.jsx` imports `ChecklistItemRow` from `./ChecklistItemRow`.
   - When you move a CSS rule, also move any `:hover`, media query, or combined selector that mentions it, such as `.itemName.checked`. Keep the same `@layer features { … }` wrapper.
   - If a class is used by both the page and a component, stop and note it in the spec before you split it. None is expected.

2. **`ChecklistDetailPage.jsx`** keeps `containerKey`, `sectionIdFromContainerKey`, and the page itself. It imports `SectionChip` and `ItemContainer`. Remove the imports it no longer uses. Lint will list them.
3. Verify:
   ```sh
   wc -l apps/web/src/features/Checklists/*.jsx
   ```
   The page should drop to roughly 270 lines.
4. Check, then in `npm run dev`, use a checklist in both check mode and edit mode:
   - check and uncheck an item,
   - add, rename, and delete an item,
   - add, rename, and delete a section,
   - drag items and sections,
   - reset.

   Everything should look the same as before.

5. Commit: `refactor: split checklist detail page into components`

---

## Step 9 — Fix the `Taskira.jsx` effects (§4.4.2)

**`apps/web/src/features/Taskira/Taskira.jsx`**:

1. Change the destructure to `const { initialize, initialized } = useStore();`.
2. Replace both effects with:

   ```js
   useEffect(() => {
     if (user) initialize();
   }, [user, initialize]);

   useEffect(() => {
     if (!initialized) return;
     // Read once at startup; store actions handle each change after that
     const { habits, tasks } = useStore.getState();
     requestNotificationPermission()
       .then(cancelAllPendingNotifications)
       .then(() => {
         scheduleAllHabitNotifications(habits);
         scheduleAllTaskNotifications(tasks);
       });
   }, [initialized]);
   ```

3. Check. `npm run lint` now reports **0 errors and 0 warnings**.
4. In `npm run dev`, sign out and sign back in. The app loads once, with no spinner loop.
5. Commit: `fix: declare Taskira effect dependencies`

---

## Step 10 — Repo config cleanups (§4.2.4)

1. Delete the `"version": "0.3.0",` line from `apps/web/package.json`, `apps/tauri/package.json`, and `apps/ios/package.json`. Then refresh the lockfile:
   ```sh
   npm install
   git diff --stat package-lock.json     # expect only the workspace version lines to change
   ```
2. **`eslint.config.js`**: delete `"apps/ios/android/**",` from `ignores`.
3. **`.prettierignore`**: delete the `apps/ios/android` line.
4. **`apps/tauri/src-tauri/tauri.conf.json`**: delete the `"android": { … }` block inside `bundle`, and the comma after the `icon` array that came before it.
5. **`.github/workflows/release.yml`**: in the `setup-node` step, change `node-version: 20` to `22` and add `cache: npm`, matching `ci.yml`.
6. **`.gitignore`**: delete the `yarn.lock`, `.next/`, `yarn-debug.log*`, and `yarn-error.log*` lines.
7. Make sure the deploy script still works without changing anything. Read through `scripts/deploy.js`: it only touches the root `package.json`, `package-lock.json`, and `tauri.conf.json`, so it doesn't need changes. **Don't** run `npm run deploy`, because it pushes a tag.
8. Check.
9. Commit: `chore: remove stale versions and config`

---

## Step 11 — Remove the Tauri opener plugin and fix `Cargo.toml` (§6, decision 3)

1. **`apps/tauri/src-tauri/src/lib.rs`**: delete `.plugin(tauri_plugin_opener::init())`.
2. **`apps/tauri/src-tauri/capabilities/default.json`**: delete `"opener:default"` and the comma after the entry before it.
3. **`apps/tauri/src-tauri/Cargo.toml`**:
   - Delete the `tauri-plugin-opener = "2.5.4"` dependency.
   - Make the `[package]` block:
     ```toml
     [package]
     name = "taskira"
     version = "0.1.0"
     description = "Taskira desktop app"
     authors = ["Frank Luongo"]
     edition = "2021"
     rust-version = "1.77.2"
     ```
     This drops the empty `license` and `repository` and the "See more keys" comment. Leave `version` alone: Tauri reads the app version from `tauri.conf.json`. Leave `[lib] name = "app_lib"` alone, because `main.rs` calls `app_lib::run()`.
4. Build. This also updates `Cargo.lock`:
   ```sh
   npm run tauri:build
   ls apps/tauri/src-tauri/target/release/bundle/macos/   # expect Taskira.app
   ```
5. Open the built `Taskira.app`. It should launch, sign in, and drag by its title bar.
6. Verify:
   ```sh
   grep -rn opener apps/tauri/src-tauri --include='*.rs' --include='*.toml' --include='*.json' --exclude-dir=gen --exclude-dir=target
   ```
   Should return nothing.
7. Check.
8. Commit `Cargo.toml`, `Cargo.lock`, `lib.rs`, and `default.json`: `chore: drop unused tauri opener plugin`

---

## Step 12 — Final verification and PR

1. Run the full check one more time, plus the spec's grep checks:
   ```sh
   npm run format:check && npm run lint && npm test && npm run build
   grep -rni "kitchen" apps/web/src README.md
   grep -rn "completed_at\|useDragMode\|rescheduleAll" apps/web/src
   grep -rn "PRIORITY_LABELS" apps/web/src/lib
   grep -rn "INBOX_PROJECT_ID" apps/web/src          # only lib/store.js
   ```
2. Click through every route in `npm run dev`: `/login`, `/`, `/habits`, `/tasks`, `/checklists`, and `/checklists/:id`. For habits, tasks, subtasks, checklist sections, and checklist items, try adding, editing, completing, reordering, and deleting. `#/kitchen-sink` should show nothing, like any unknown route.
3. **iOS:**
   ```sh
   npm run cap:sync
   npm run open -w apps/ios
   ```
   Run on a simulator or device, then:
   - Create a habit with an alarm a couple of minutes from now, and a task due today with an alarm a couple of minutes from now. Both reminders should fire.
   - Edit the habit's alarm time, relaunch the app, and check that the reminder fires at the new time, and only once.
4. Check every box in spec §8.
5. Set the spec's **Status** to `Done`.
6. Push and open the PR. Link the spec, and call out the two behavior changes:
   - The Tasks drag toggle now hides and shows the grip.
   - Legacy habits with no recurrence value now get reminders (§4.3.1).
