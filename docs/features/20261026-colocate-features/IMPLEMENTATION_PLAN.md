# Co-locate Pages Into Features — Implementation Plan

**Spec:** [FEATURE_SPECS.md](./FEATURE_SPECS.md) · **Date:** 2026-10-26 · **Branch:** `refactor/colocate-features`

This plan is mechanical and ordered so the app builds after every phase. Run all commands from the repo root. All paths below are relative to `apps/web/src/` unless they start with `apps/`, `scripts/`, or `README.md`.

**Ground rules (from spec §5.2)**

- Cross-feature imports go through the feature's barrel: `@/features/<Name>`.
- In-feature imports use relative paths. A file never imports its own feature's barrel.
- Pages are named exports called `<Name>Page`, in `<Name>Page/<Name>Page.jsx` + `<Name>Page.module.css`.
- Use `git mv` for every move so history follows the file.
- Don't change markup, CSS rules, class names, or logic. Only paths, import lines, and export names change.

---

## Phase 0 — Setup and baseline

1. Branch off an up-to-date `main`:
   ```sh
   git checkout main && git pull
   git checkout -b refactor/colocate-features
   ```
2. Confirm the baseline is green, so any later failure is yours:
   ```sh
   npm run format:check && npm run lint && npm test && npm run build
   ```
3. Run `npm run dev` and click through every route once (`#/login`, `#/`, `#/habits`, `#/chores`, `#/tasks`, `#/projects`, `#/checklists`, a checklist detail, `#/kitchen-sink`). You'll repeat this at the end to compare.

---

## Phase 1 — Per-feature barrels; remove the root barrel

Pages still live in `pages/` during this phase. The goal is to stop anything importing `@/features` before pages move in, so no cycle is ever created.

### 1.1 Move `AppNavigation` into `Taskira`

```sh
git mv apps/web/src/features/AppNavigation apps/web/src/features/Taskira/AppNavigation
```

In `features/Taskira/Taskira.jsx`, change:

```js
import { AppNavigation } from "../AppNavigation/AppNavigation";
```

to:

```js
import { AppNavigation } from "./AppNavigation/AppNavigation";
```

### 1.2 Give `Taskira` a barrel

Create `features/Taskira/index.js`:

```js
export * from "./PageHeaderContext";
export * from "./Taskira";
```

`AppNavigation` is private to `Taskira`, so the barrel doesn't export it.

### 1.3 Replace every `@/features` root import

Make these exact replacements. Leave every other line alone.

| File                                                  | Replace                                                                        | With                                                                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes.jsx`                                          | `import { Taskira } from "@/features";`                                        | `import { Taskira } from "@/features/Taskira";`                                                                                                                              |
| `pages/Habits.jsx`                                    | `import { DragContext, HabitForm, HabitItem } from "@/features";`              | `import { DragContext } from "@/features/DragAndDrop";`<br>`import { HabitForm, HabitItem } from "@/features/Habits";`                                                       |
| `pages/Chores.jsx`                                    | `import { ChoreForm, ChoreItem, usePageHeader } from "@/features";`            | `import { ChoreForm, ChoreItem } from "@/features/Chores";`<br>`import { usePageHeader } from "@/features/Taskira";`                                                         |
| `pages/Tasks.jsx`                                     | `import { DragContext, TaskItem, TaskForm, usePageHeader } from "@/features";` | `import { DragContext } from "@/features/DragAndDrop";`<br>`import { TaskItem, TaskForm } from "@/features/Tasks";`<br>`import { usePageHeader } from "@/features/Taskira";` |
| `pages/Projects.jsx`                                  | `import { DragContext, TaskItem, TaskForm, usePageHeader } from "@/features";` | Same three lines as `Tasks.jsx`                                                                                                                                              |
| `pages/Today.jsx`                                     | `import { PriorityBadge, usePageHeader } from "@/features";`                   | `import { PriorityBadge } from "@/features/Tasks";`<br>`import { usePageHeader } from "@/features/Taskira";`                                                                 |
| `pages/Checklists.jsx`                                | `import { usePageHeader } from "@/features";`                                  | `import { usePageHeader } from "@/features/Taskira";`                                                                                                                        |
| `pages/KitchenSink.jsx`                               | `import { usePageHeader } from "@/features";`                                  | `import { usePageHeader } from "@/features/Taskira";`                                                                                                                        |
| `pages/ChecklistDetailRoute/ChecklistDetailRoute.jsx` | `import { usePageHeader } from "@/features";`                                  | `import { usePageHeader } from "@/features/Taskira";`                                                                                                                        |

`pages/Today.jsx` already has `import { HABIT_GROUPS } from "@/features/Habits";`. Keep it.

### 1.4 Delete the root barrel

```sh
git rm apps/web/src/features/index.js
```

### 1.5 Check

```sh
grep -rn 'from "@/features"' apps/web/src   # expect no output
npm run build
```

Commit: `refactor: import features through per-feature barrels`

---

## Phase 2 — Move pages into features

Each step below moves one feature's page(s) and leaves the app building. Every step follows the same recipe:

1. `mkdir` the page folder and `git mv` the JSX and CSS module into it, renamed to `<Name>Page`.
2. In the moved JSX:
   - Change the CSS import: `import css from "./<Old>.module.css";` → `import css from "./<Name>Page.module.css";`
   - Change the export: `export default function <Old>() {` (or `export function <Old>() {`) → `export function <Name>Page() {`
   - Apply the step's import fixes, if any.
3. Add the page to the feature's `index.js`, creating it if needed. Barrels are kept alphabetical, and in every case below the new line goes last.
4. Update `routes.jsx`: change the import and the JSX element for that route.
5. `npm run build`.

The CSS module's contents don't change.

### 2.1 Today

```sh
mkdir -p apps/web/src/features/Today/TodayPage
git mv apps/web/src/pages/Today.jsx        apps/web/src/features/Today/TodayPage/TodayPage.jsx
git mv apps/web/src/pages/Today.module.css apps/web/src/features/Today/TodayPage/TodayPage.module.css
```

- JSX: `./Today.module.css` → `./TodayPage.module.css`; `export default function Today()` → `export function TodayPage()`.
- Imports: no change. Everything it imports from features is cross-feature (Habits, Tasks, Taskira).
- Create `features/Today/index.js`:
  ```js
  export * from "./TodayPage/TodayPage";
  ```
- `routes.jsx`: remove `import Today from "@/pages/Today";`, add `import { TodayPage } from "@/features/Today";`, and change `element: <Today />` to `element: <TodayPage />`.

### 2.2 Habits

```sh
mkdir -p apps/web/src/features/Habits/HabitsPage
git mv apps/web/src/pages/Habits.jsx        apps/web/src/features/Habits/HabitsPage/HabitsPage.jsx
git mv apps/web/src/pages/Habits.module.css apps/web/src/features/Habits/HabitsPage/HabitsPage.module.css
```

- JSX: `./Habits.module.css` → `./HabitsPage.module.css`; `export default function Habits()` → `export function HabitsPage()`.
- Imports: in-feature, so switch to relative paths. Replace
  ```js
  import { HabitForm, HabitItem } from "@/features/Habits";
  ```
  with
  ```js
  import { HabitForm } from "../components/HabitForm/HabitForm";
  import { HabitItem } from "../components/HabitItem/HabitItem";
  ```
- Append to `features/Habits/index.js`:
  ```js
  export * from "./HabitsPage/HabitsPage";
  ```
- `routes.jsx`: `import Habits from "@/pages/Habits";` → `import { HabitsPage } from "@/features/Habits";`; `<Habits />` → `<HabitsPage />`.

### 2.3 Chores

```sh
mkdir -p apps/web/src/features/Chores/ChoresPage
git mv apps/web/src/pages/Chores.jsx        apps/web/src/features/Chores/ChoresPage/ChoresPage.jsx
git mv apps/web/src/pages/Chores.module.css apps/web/src/features/Chores/ChoresPage/ChoresPage.module.css
```

- JSX: `./Chores.module.css` → `./ChoresPage.module.css`; `export default function Chores()` → `export function ChoresPage()`.
- Imports: replace
  ```js
  import { ChoreForm, ChoreItem } from "@/features/Chores";
  ```
  with
  ```js
  import { ChoreForm } from "../ChoreForm/ChoreForm";
  import { ChoreItem } from "../ChoreItem/ChoreItem";
  ```
- Append to `features/Chores/index.js`:
  ```js
  export * from "./ChoresPage/ChoresPage";
  ```
- `routes.jsx`: `import Chores from "@/pages/Chores";` → `import { ChoresPage } from "@/features/Chores";`; `<Chores />` → `<ChoresPage />`.

### 2.4 Tasks

```sh
mkdir -p apps/web/src/features/Tasks/TasksPage
git mv apps/web/src/pages/Tasks.jsx        apps/web/src/features/Tasks/TasksPage/TasksPage.jsx
git mv apps/web/src/pages/Tasks.module.css apps/web/src/features/Tasks/TasksPage/TasksPage.module.css
```

- JSX: `./Tasks.module.css` → `./TasksPage.module.css`; `export default function Tasks()` → `export function TasksPage()`.
- Imports: replace
  ```js
  import { TaskItem, TaskForm } from "@/features/Tasks";
  ```
  with
  ```js
  import { TaskItem } from "../TaskItem/TaskItem";
  import { TaskForm } from "../TaskForm/TaskForm";
  ```
- Append to `features/Tasks/index.js`:
  ```js
  export * from "./TasksPage/TasksPage";
  ```
- `routes.jsx`: `import Tasks from "@/pages/Tasks";` → `import { TasksPage } from "@/features/Tasks";`; `<Tasks />` → `<TasksPage />`.

### 2.5 Projects

```sh
mkdir -p apps/web/src/features/Projects/ProjectsPage
git mv apps/web/src/pages/Projects.jsx        apps/web/src/features/Projects/ProjectsPage/ProjectsPage.jsx
git mv apps/web/src/pages/Projects.module.css apps/web/src/features/Projects/ProjectsPage/ProjectsPage.module.css
```

- JSX: `./Projects.module.css` → `./ProjectsPage.module.css`; `export default function Projects()` → `export function ProjectsPage()`.
- Imports: no change. `@/features/Tasks` is a different feature from Projects, so the barrel import stays.
- Create `features/Projects/index.js`:
  ```js
  export * from "./ProjectsPage/ProjectsPage";
  ```
- `routes.jsx`: `import Projects from "@/pages/Projects";` → `import { ProjectsPage } from "@/features/Projects";`; `<Projects />` → `<ProjectsPage />`.

### 2.6 Checklists (two pages)

```sh
mkdir -p apps/web/src/features/Checklists/ChecklistsPage
git mv apps/web/src/pages/Checklists.jsx        apps/web/src/features/Checklists/ChecklistsPage/ChecklistsPage.jsx
git mv apps/web/src/pages/Checklists.module.css apps/web/src/features/Checklists/ChecklistsPage/ChecklistsPage.module.css

git mv apps/web/src/pages/ChecklistDetailRoute apps/web/src/features/Checklists/ChecklistDetailPage
git mv apps/web/src/features/Checklists/ChecklistDetailPage/ChecklistDetailRoute.jsx \
       apps/web/src/features/Checklists/ChecklistDetailPage/ChecklistDetailPage.jsx
git mv apps/web/src/features/Checklists/ChecklistDetailPage/ChecklistDetailRoute.module.css \
       apps/web/src/features/Checklists/ChecklistDetailPage/ChecklistDetailPage.module.css
```

- `ChecklistsPage.jsx`: `./Checklists.module.css` → `./ChecklistsPage.module.css`; `export default function Checklists()` → `export function ChecklistsPage()`.
- `ChecklistDetailPage.jsx`: `./ChecklistDetailRoute.module.css` → `./ChecklistDetailPage.module.css`; `export function ChecklistDetailRoute()` → `export function ChecklistDetailPage()`.
- Imports: no change. Both only import `usePageHeader` from `@/features/Taskira`.
- Create `features/Checklists/index.js`:
  ```js
  export * from "./ChecklistDetailPage/ChecklistDetailPage";
  export * from "./ChecklistsPage/ChecklistsPage";
  ```
- Remove `export * from "./ChecklistDetailRoute/ChecklistDetailRoute";` from `pages/index.js`.
- `routes.jsx`:
  - `import Checklists from "@/pages/Checklists";` → removed
  - Add `import { ChecklistDetailPage, ChecklistsPage } from "@/features/Checklists";`
  - Remove `ChecklistDetailRoute` from the `@/pages` import.
  - `<Checklists />` → `<ChecklistsPage />`; `<ChecklistDetailRoute />` → `<ChecklistDetailPage />`.

### 2.7 Auth (Login + ProtectedRoute)

```sh
mkdir -p apps/web/src/features/Auth
git mv apps/web/src/pages/LoginRoute apps/web/src/features/Auth/LoginPage
git mv apps/web/src/features/Auth/LoginPage/LoginRoute.jsx        apps/web/src/features/Auth/LoginPage/LoginPage.jsx
git mv apps/web/src/features/Auth/LoginPage/LoginRoute.module.css apps/web/src/features/Auth/LoginPage/LoginPage.module.css

git mv apps/web/src/pages/ProtectedRoute apps/web/src/features/Auth/ProtectedRoute
```

- `LoginPage.jsx`: `./LoginRoute.module.css` → `./LoginPage.module.css`; `export function LoginRoute()` → `export function LoginPage()`.
- `ProtectedRoute.jsx`: no changes. It keeps its name because it's a route guard, not a page.
- Create `features/Auth/index.js`:
  ```js
  export * from "./LoginPage/LoginPage";
  export * from "./ProtectedRoute/ProtectedRoute";
  ```
- `routes.jsx`: replace the remaining `@/pages` import with `import { LoginPage, ProtectedRoute } from "@/features/Auth";`; `<LoginRoute />` → `<LoginPage />`.

### 2.8 KitchenSink

```sh
mkdir -p apps/web/src/features/KitchenSink/KitchenSinkPage
git mv apps/web/src/pages/KitchenSink.jsx        apps/web/src/features/KitchenSink/KitchenSinkPage/KitchenSinkPage.jsx
git mv apps/web/src/pages/KitchenSink.module.css apps/web/src/features/KitchenSink/KitchenSinkPage/KitchenSinkPage.module.css
```

- JSX: `./KitchenSink.module.css` → `./KitchenSinkPage.module.css`; `export default function KitchenSink()` → `export function KitchenSinkPage()`.
- Create `features/KitchenSink/index.js`:
  ```js
  export * from "./KitchenSinkPage/KitchenSinkPage";
  ```
- `routes.jsx`: `import KitchenSink from "@/pages/KitchenSink";` → `import { KitchenSinkPage } from "@/features/KitchenSink";`; `<KitchenSink />` → `<KitchenSinkPage />`.

### 2.9 Delete `pages/`

`pages/index.js` should now be empty. Remove it and the folder:

```sh
git rm apps/web/src/pages/index.js
ls apps/web/src/pages 2>/dev/null   # expect: No such file or directory
```

If anything is left in `pages/`, a step above was missed. Go back and fix it rather than deleting it.

### 2.10 Final `routes.jsx`

After Phase 2, `routes.jsx` should match this exactly (Prettier will confirm formatting):

```jsx
import { createHashRouter } from "react-router";

import { LoginPage, ProtectedRoute } from "@/features/Auth";
import { ChecklistDetailPage, ChecklistsPage } from "@/features/Checklists";
import { ChoresPage } from "@/features/Chores";
import { HabitsPage } from "@/features/Habits";
import { KitchenSinkPage } from "@/features/KitchenSink";
import { ProjectsPage } from "@/features/Projects";
import { Taskira } from "@/features/Taskira";
import { TasksPage } from "@/features/Tasks";
import { TodayPage } from "@/features/Today";

export const router = createHashRouter([
  {
    element: <Taskira />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: "habits", element: <HabitsPage /> },
          { path: "chores", element: <ChoresPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "checklists", element: <ChecklistsPage /> },
          { path: "checklists/:id", element: <ChecklistDetailPage /> },
          { path: "kitchen-sink", element: <KitchenSinkPage /> },
        ],
      },
    ],
  },
]);
```

Run `npm run build`, then commit: `refactor: co-locate pages inside their features`

---

## Phase 3 — Scaffold script and README

### 3.1 `scripts/scaffold.js`

1. **Delete the `page` entry** from `TYPES`.
2. **Remove `indexPath`** from the `feature` entry, since there's no root barrel to append to. Leave its `jsx` template as is.
3. **Update `usage`**:
   ```js
   const usage = `Usage: npm run scaffold [${Object.keys(TYPES).join("|")}] <Name>
     npm run scaffold Badge             # defaults to "component"
     npm run scaffold feature Reminders # features/Reminders/ with a RemindersPage`;
   ```
4. **Replace everything from `const config = TYPES[type];` to the end of the file** with:

   ```js
   const config = TYPES[type];
   const isFeature = type === "feature";
   const componentName = isFeature ? `${name}Page` : name;
   const rootDir = path.join(root, ...config.dir, name);
   const targetDir = isFeature ? path.join(rootDir, componentName) : rootDir;

   if (existsSync(rootDir)) {
     console.error(`"${path.relative(root, rootDir)}" already exists.`);
     process.exit(1);
   }

   const baseClass = componentName[0].toLowerCase() + componentName.slice(1);

   const jsx = config.jsx(componentName, baseClass);

   const css = `@layer ${config.layer} {
   .${baseClass} {
   }
   }
   `;

   mkdirSync(targetDir, { recursive: true });
   writeFileSync(path.join(targetDir, `${componentName}.jsx`), jsx);
   writeFileSync(path.join(targetDir, `${componentName}.module.css`), css);

   let indexPath;

   if (isFeature) {
     indexPath = path.join(rootDir, "index.js");
     writeFileSync(
       indexPath,
       `export * from "./${componentName}/${componentName}";\n`,
     );
   } else {
     indexPath = path.join(root, ...config.indexPath);
     const lines = readFileSync(indexPath, "utf8").split("\n").filter(Boolean);
     const exportRe = /export \* from "\.\/(\w+)\//;

     let insertAt = lines.length;
     for (let i = 0; i < lines.length; i++) {
       const match = lines[i].match(exportRe);
       if (match && match[1].localeCompare(name) > 0) {
         insertAt = i;
         break;
       }
     }

     lines.splice(insertAt, 0, `export * from "./${name}/${name}";`);
     writeFileSync(indexPath, lines.join("\n") + "\n");
   }

   const relDir = path.relative(root, targetDir);
   console.log(`Scaffolded ${type} ${name}:`);
   console.log(`  ${relDir}/${componentName}.jsx`);
   console.log(`  ${relDir}/${componentName}.module.css`);
   console.log(
     `  ${isFeature ? "created" : "updated"} ${path.relative(root, indexPath)}`,
   );
   ```

   The `component` path behaves exactly as before. Only `feature` changes.

5. Smoke-test it, then clean up:

   ```sh
   npm run scaffold feature Foo
   # expect: apps/web/src/features/Foo/index.js
   #         apps/web/src/features/Foo/FooPage/FooPage.jsx
   #         apps/web/src/features/Foo/FooPage/FooPage.module.css
   cat apps/web/src/features/Foo/index.js   # export * from "./FooPage/FooPage";
   rm -rf apps/web/src/features/Foo

   npm run scaffold page Foo               # expect: usage error, nothing created
   ls apps/web/src/features apps/web/src/base/components | grep -x Foo   # expect no output

   npm run scaffold Foo                     # component path still works
   git diff --stat apps/web/src/base/components/index.js   # one line added
   rm -rf apps/web/src/base/components/Foo && git checkout apps/web/src/base/components/index.js
   ```

   With the `page` type removed, `npm run scaffold page Foo` falls through to treating `page` as a component name. It then fails the PascalCase check and exits, which is the expected error.

### 3.2 `README.md` — Scaffolding section

Replace the code block, table, and paragraph under `## Scaffolding` with:

````markdown
```
npm run scaffold ComponentName            # base component (default type)
npm run scaffold component ComponentName
npm run scaffold feature FeatureName
```

| Type        | Creates                                                   | Barrel                                              |
| ----------- | --------------------------------------------------------- | --------------------------------------------------- |
| `component` | `apps/web/src/base/components/<Name>/`                    | appended to `apps/web/src/base/components/index.js` |
| `feature`   | `apps/web/src/features/<Name>/` with a `<Name>Page/` stub | new `apps/web/src/features/<Name>/index.js`         |

Each feature folder holds everything for one product area: its page(s), components, constants, and helpers. Other code imports a feature through its barrel (`@/features/<Name>`). Files inside a feature import each other by relative path, never through their own barrel. After scaffolding a feature, add its page to `apps/web/src/routes.jsx`.

Components get `className`/`variant` prop handling built in, since they're the design-system primitives other code composes. Feature pages get a plain component stub. Names must be PascalCase, and the command refuses to overwrite an existing directory.
````

Run `npm run format` so Prettier aligns the table, then commit: `chore: scaffold features with a page and their own barrel`

---

## Phase 2b — Flatten features and drop barrels

Added after Phases 1–3 landed. The spec now calls for flat features with no barrels (spec §5.2), so this phase supersedes the `<Name>Page/` folders and `index.js` files created above.

1. `git mv` every one-component folder's files up into the feature root (`features/Tasks/TaskItem/TaskItem.jsx` → `features/Tasks/TaskItem.jsx`, CSS modules alongside). Do the same for `Habits/components/*`, `Taskira/AppNavigation/`, `Auth/LoginPage/`, and `Auth/ProtectedRoute/`. Rename `Habits/constants/index.js` → `Habits/constants.js` and `Habits/functions/index.js` → `Habits/functions.js`.
2. `git rm` every `features/*/index.js` and delete the now-empty folders.
3. Rewrite in-feature imports to `./<File>` (e.g. `"../TaskForm/TaskForm"` → `"./TaskForm"`).
4. Rewrite cross-feature imports to the exact file:
   - `usePageHeader` → `@/features/Taskira/PageHeaderContext`
   - `DragContext` → `@/features/DragAndDrop/DragContext`
   - `PriorityBadge`, `TaskItem`, `TaskForm` → `@/features/Tasks/<File>`
   - `HABIT_GROUPS` → `@/features/Habits/constants`
5. `routes.jsx`: import each route component from its file (`@/features/Tasks/TasksPage`, `@/features/Auth/LoginPage`, …).
6. `scripts/scaffold.js`: `feature <Name>` writes `features/<Name>/<Name>Page.jsx` + `.module.css` directly, with no subfolder and no `index.js`.
7. `README.md`: update the scaffolding table and explanation to match.

The Phase 4 checks for barrels (steps 2 and 4) no longer apply. Use the acceptance criteria in spec §7 instead.

Commit: `refactor: flatten feature folders and drop barrels`

---

## Phase 4 — Verify

Run each check from the repo root. Every one must pass before opening the PR.

```sh
# 1. Old locations are gone
test ! -e apps/web/src/pages && test ! -e apps/web/src/features/index.js && echo "ok: removed"

# 2. Every feature has a barrel
for d in apps/web/src/features/*/; do test -f "$d/index.js" || echo "missing barrel: $d"; done

# 3. No root-barrel or pages imports
grep -rn '@/pages\|from "@/features"' apps/web/src            # expect no output

# 4. No file imports its own feature's barrel
for d in apps/web/src/features/*/; do
  n=$(basename "$d"); grep -rn "from \"@/features/$n\"" "$d"
done                                                           # expect no output

# 5. No default exports in features
grep -rn "export default" apps/web/src/features               # expect no output

# 6. Standard checks (same as CI)
npm run format:check && npm run lint && npm test && npm run build
```

Then a manual smoke test in `npm run dev`, comparing against Phase 0:

- [ ] `#/login` renders the login form, and logging in lands on `#/`.
- [ ] `#/` (Today) shows habits grouped AM/Misc/PM, chores, and tasks with priority badges. The header shows today's date.
- [ ] `#/habits`: add, edit, and drag-reorder a habit.
- [ ] `#/chores`: add, edit, and drag-reorder a chore.
- [ ] `#/tasks`: add, edit, and drag-reorder a task.
- [ ] `#/projects`: tasks render under projects, and adding a task works.
- [ ] `#/checklists`: open a checklist, then check and reorder items on the detail page.
- [ ] `#/kitchen-sink` renders every component.
- [ ] App navigation highlights the active route on every page.
- [ ] Logging out redirects to `#/login`.
- [ ] No new console errors or warnings.

Optional: `npm run tauri:dev` to confirm the desktop shell still loads.

---

## Phase 5 — Ship

1. Check that history followed the moves:
   ```sh
   git log --follow --oneline apps/web/src/features/Tasks/TasksPage/TasksPage.jsx | head
   ```
   You should see commits from before this branch. If you don't, the move and edit landed in one commit with too large a diff for rename detection. That's acceptable, but Phase 2 can be split into a "move only" commit followed by an "edit" commit to fix it.
2. Push and open a PR titled **"refactor: co-locate pages inside features"**. In the description, link `docs/features/20261026-colocate-features/FEATURE_SPECS.md`, list the new feature folders, and note that there are no behavior changes.
3. Merge once CI passes. CI runs the same checks as Phase 4, step 6.

---

## Appendix — Final file moves at a glance

| From                                                | To                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `features/index.js`                                 | _deleted_                                                                    |
| `features/AppNavigation/AppNavigation.jsx`          | `features/Taskira/AppNavigation/AppNavigation.jsx`                           |
| —                                                   | `features/Taskira/index.js` _(new)_                                          |
| `pages/Today.jsx` (+ `.module.css`)                 | `features/Today/TodayPage/TodayPage.jsx` (+ `.module.css`)                   |
| `pages/Habits.jsx` (+ `.module.css`)                | `features/Habits/HabitsPage/HabitsPage.jsx` (+ `.module.css`)                |
| `pages/Chores.jsx` (+ `.module.css`)                | `features/Chores/ChoresPage/ChoresPage.jsx` (+ `.module.css`)                |
| `pages/Tasks.jsx` (+ `.module.css`)                 | `features/Tasks/TasksPage/TasksPage.jsx` (+ `.module.css`)                   |
| `pages/Projects.jsx` (+ `.module.css`)              | `features/Projects/ProjectsPage/ProjectsPage.jsx` (+ `.module.css`)          |
| `pages/Checklists.jsx` (+ `.module.css`)            | `features/Checklists/ChecklistsPage/ChecklistsPage.jsx` (+ `.module.css`)    |
| `pages/ChecklistDetailRoute/ChecklistDetailRoute.*` | `features/Checklists/ChecklistDetailPage/ChecklistDetailPage.*`              |
| `pages/LoginRoute/LoginRoute.*`                     | `features/Auth/LoginPage/LoginPage.*`                                        |
| `pages/ProtectedRoute/ProtectedRoute.jsx`           | `features/Auth/ProtectedRoute/ProtectedRoute.jsx`                            |
| `pages/KitchenSink.jsx` (+ `.module.css`)           | `features/KitchenSink/KitchenSinkPage/KitchenSinkPage.jsx` (+ `.module.css`) |
| `pages/index.js`                                    | _deleted_                                                                    |
