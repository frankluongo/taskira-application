# Co-locate Pages Into Features — Feature Spec

**Status:** Implemented · **Date:** 2026-10-26 · **Scope:** `apps/web/src` (`pages/`, `features/`, `routes.jsx`), `scripts/scaffold.js`, `README.md`

## 1. Summary

The web app splits each product area across two folders. The Tasks area, for example, has its route component in `src/pages/Tasks.jsx` and its building blocks (`TaskItem`, `TaskForm`, `PriorityBadge`) in `src/features/Tasks/`. To work on one area you jump between two trees, and the split tells you nothing useful: every page belongs to one feature, and most features exist to serve one page.

Move every page into the feature it belongs to, so `src/features/<Area>/` holds everything for that area: its page(s), components, constants, and helpers, as flat files. Then delete `src/pages/` and every feature barrel.

This is a **file-structure refactor, not a feature**. No UI, styling, routing, or behavior changes.

## 2. Goals

1. **One place per product area.** Everything for Tasks lives in `features/Tasks/`, everything for Habits in `features/Habits/`, and so on.
2. **No `pages/` folder.** Route components live next to the components they compose.
3. **Consistent pages.** Every page is a named export called `<Name>Page`, in `<Name>Page.jsx` with a matching CSS module. Today there's a mix of flat default-export files (`Tasks.jsx`) and folder-based named exports (`LoginRoute/LoginRoute.jsx`).
4. **Flat features.** Each feature is a single folder of files, with no per-component subfolders and no barrels. Imports name the exact file they depend on.
5. **Nothing else changes.** URLs, rendered markup, CSS, store, and tests behave exactly as before.

## 3. Non-goals

- Changing any component's API, markup, or CSS rules (class names stay as they are).
- Changing routes or URLs.
- Adding lazy loading or code splitting to routes.
- Moving or flattening `src/base/` or `src/lib/`. They are shared infrastructure, not features, and `src/base` keeps its folder-per-component layout and `@/base` barrel.
- Rewriting historical docs in `docs/features/`.

## 4. Current state

```
src/
├── features/
│   ├── index.js              # root barrel, re-exports every feature
│   ├── AppNavigation/        # only used by Taskira
│   ├── Chores/               # ChoreForm, ChoreItem
│   ├── DragAndDrop/          # DragContext, useDragMode (shared)
│   ├── Habits/               # components/, constants/, functions/
│   ├── Taskira/              # app shell + PageHeaderContext (no barrel)
│   └── Tasks/                # PriorityBadge, TaskForm, TaskItem
├── pages/
│   ├── index.js              # barrel for the 3 folder-based pages only
│   ├── Checklists.jsx        # default export
│   ├── ChecklistDetailRoute/ # named export
│   ├── Chores.jsx            # default export
│   ├── Habits.jsx            # default export
│   ├── KitchenSink.jsx       # default export
│   ├── LoginRoute/           # named export
│   ├── Projects.jsx          # default export
│   ├── ProtectedRoute/       # named export (route guard)
│   ├── Tasks.jsx             # default export
│   └── Today.jsx             # default export
└── routes.jsx                # imports pages two different ways
```

Problems:

- **Split areas.** Tasks, Habits, and Chores each live in two places.
- **Two page conventions.** Seven pages are flat default exports imported by path (`@/pages/Tasks`). Three are folder-based named exports imported from a barrel (`@/pages`).
- **A root barrel that will become a cycle.** Pages import from `@/features`, which re-exports every feature. Once pages live inside features, `TasksPage` importing `@/features` would import itself. ES modules tolerate that, but it's fragile and makes Vite's HMR fall back to full reloads.
- **Hidden dependencies.** `import { ... } from "@/features"` hides which feature a symbol comes from. `Today.jsx` even imports from both `@/features` and `@/features/Habits`.
- **Inconsistent feature internals.** `Habits` nests components under `components/` while `Tasks` and `Chores` use one folder per component.

## 5. Target state

```
src/
├── features/
│   ├── Auth/
│   │   ├── LoginPage.jsx              # was pages/LoginRoute
│   │   └── ProtectedRoute.jsx         # was pages/ProtectedRoute
│   ├── Checklists/
│   │   ├── ChecklistDetailPage.jsx    # was pages/ChecklistDetailRoute
│   │   └── ChecklistsPage.jsx         # was pages/Checklists.jsx
│   ├── Chores/
│   │   ├── ChoreForm.jsx
│   │   ├── ChoreItem.jsx
│   │   └── ChoresPage.jsx             # was pages/Chores.jsx
│   ├── DragAndDrop/
│   │   ├── DragContext.jsx
│   │   └── useDragMode.js
│   ├── Habits/
│   │   ├── constants.js               # was constants/index.js
│   │   ├── functions.js               # was functions/index.js
│   │   ├── HabitForm.jsx              # was components/HabitForm/
│   │   ├── HabitItem.jsx              # was components/HabitItem/
│   │   └── HabitsPage.jsx             # was pages/Habits.jsx
│   ├── KitchenSink/
│   │   └── KitchenSinkPage.jsx        # was pages/KitchenSink.jsx
│   ├── Projects/
│   │   └── ProjectsPage.jsx           # was pages/Projects.jsx
│   ├── Taskira/
│   │   ├── AppNavigation.jsx          # was features/AppNavigation
│   │   ├── PageHeaderContext.js
│   │   └── Taskira.jsx
│   ├── Tasks/
│   │   ├── PriorityBadge.jsx
│   │   ├── TaskForm.jsx
│   │   ├── TaskItem.jsx
│   │   └── TasksPage.jsx              # was pages/Tasks.jsx
│   └── Today/
│       └── TodayPage.jsx              # was pages/Today.jsx
└── routes.jsx
```

CSS modules sit next to their JSX and aren't shown. `pages/`, `features/index.js`, and every per-feature `index.js` are gone.

### 5.1 Where each page goes

| Current                        | New                                         | Export name           |
| ------------------------------ | ------------------------------------------- | --------------------- |
| `pages/Today.jsx`              | `features/Today/TodayPage.jsx`              | `TodayPage`           |
| `pages/Habits.jsx`             | `features/Habits/HabitsPage.jsx`            | `HabitsPage`          |
| `pages/Chores.jsx`             | `features/Chores/ChoresPage.jsx`            | `ChoresPage`          |
| `pages/Tasks.jsx`              | `features/Tasks/TasksPage.jsx`              | `TasksPage`           |
| `pages/Projects.jsx`           | `features/Projects/ProjectsPage.jsx`        | `ProjectsPage`        |
| `pages/Checklists.jsx`         | `features/Checklists/ChecklistsPage.jsx`    | `ChecklistsPage`      |
| `pages/ChecklistDetailRoute/…` | `features/Checklists/ChecklistDetailPage.*` | `ChecklistDetailPage` |
| `pages/LoginRoute/…`           | `features/Auth/LoginPage.*`                 | `LoginPage`           |
| `pages/ProtectedRoute/…`       | `features/Auth/ProtectedRoute.jsx`          | `ProtectedRoute`      |
| `pages/KitchenSink.jsx`        | `features/KitchenSink/KitchenSinkPage.jsx`  | `KitchenSinkPage`     |
| `features/AppNavigation/`      | `features/Taskira/AppNavigation.jsx`        | `AppNavigation`       |

Each page's CSS module moves with it and is renamed to match (`Tasks.module.css` → `Tasks/TasksPage.module.css`). Its contents, including `@layer features` and class names, don't change.

**Why `Projects` is its own feature.** It has its own route and nav entry. It reuses `TaskItem` and `TaskForm`, which it imports from `@/features/Tasks/TaskItem` and `@/features/Tasks/TaskForm` like any other consumer.

**Why `Today` is its own feature.** It's a dashboard that pulls from Habits, Chores, and Tasks, so it doesn't belong inside any one of them.

**Why `ProtectedRoute` keeps its name.** It's a route guard that renders `<Outlet />` or redirects, not a page.

### 5.2 Conventions

| Rule                  | Detail                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Flat features         | A feature is one folder of files: `features/<Name>/<File>.jsx` (+ `<File>.module.css`). No subfolders inside a feature.                |
| No barrels            | Features have no `index.js`. Never import from `@/features` or `@/features/<Name>`.                                                    |
| Cross-feature imports | Import the exact file: `import { TaskItem } from "@/features/Tasks/TaskItem"`.                                                         |
| In-feature imports    | Use relative paths: `import { TaskItem } from "./TaskItem"`.                                                                           |
| Page naming           | `<Name>Page.jsx` + `<Name>Page.module.css`, named export `<Name>Page`. No default exports.                                             |
| Private pieces        | Components used only inside a feature (like `AppNavigation` in `Taskira`) live in that feature. Nothing marks them private but naming. |

### 5.3 Why remove the barrels

The alternative is to keep `features/index.js`, or per-feature `index.js` files, and re-export the pages through them. That keeps short imports, but:

- A page importing a barrel that re-exports the page itself is a circular import. Per-feature barrels only avoid this if every in-feature file remembers to use relative paths.
- It hides the dependency graph. With file imports you can see that `TodayPage` depends on `Tasks/PriorityBadge`, `Habits/constants`, and `Taskira/PageHeaderContext` just by reading its imports.
- It loads every file a barrel re-exports to get one symbol, which will matter if routes are lazy-loaded later.
- Barrels are one more file to keep in sync when a feature gains or loses a file.

`src/base` keeps its root barrel (`@/base`). Base components are leaf primitives that never import features, so they can't form a cycle.

### 5.4 Other changes

| File                  | Change                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes.jsx`      | Import every route component as a named export from its file, e.g. `@/features/Tasks/TasksPage`.                                                                                                          |
| `scripts/scaffold.js` | Drop the `page` type. `feature <Name>` now creates `features/<Name>/<Name>Page.jsx` + `<Name>Page.module.css`, with no barrel, instead of appending to the deleted root barrel. `component` is unchanged. |
| `README.md`           | Update the scaffolding section to match.                                                                                                                                                                  |

### 5.5 Unaffected

- `src/base/`, `src/lib/`, `src/index.css`, `main.jsx`, `App.jsx`.
- `vite.config.js` and `jsconfig.json`. The `@/` alias already covers `@/features/<Name>/<File>`.
- `eslint.config.js`, `.prettierignore`, and the CI and release workflows, none of which reference `pages/` or `features/`.
- The only test (`src/lib/date.test.js`).
- Storybook. Its config only globs `src/base/**`, so this refactor is independent of the separate Storybook-removal work.

## 6. Risks

| Risk                                                      | Mitigation                                                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A missed import path breaks the build or a route          | Vite fails the build on unresolved imports. Run `npm run build` after each step, and click through every route in `npm run dev`. |
| Losing file history                                       | Move files with `git mv` and keep content edits small, so `git log --follow` keeps working.                                      |
| Merge conflicts with in-flight branches touching `pages/` | Land this as one short-lived PR. It's mechanical and easy to rebase onto.                                                        |

## 7. Acceptance criteria

- [ ] `apps/web/src/pages/` doesn't exist.
- [ ] No `index.js` anywhere under `apps/web/src/features/`.
- [ ] No subfolders inside any `apps/web/src/features/<Name>/`.
- [ ] Every page is a named `<Name>Page` export in `features/<Feature>/<Name>Page.jsx`, except `ProtectedRoute`.
- [ ] `grep -rnE '@/pages|from "@/features(/\w+)?"' apps/web/src` returns nothing.
- [ ] No `export default` in `apps/web/src/features/`.
- [ ] `npm run scaffold feature Foo` creates only `features/Foo/FooPage.jsx` and `features/Foo/FooPage.module.css` (delete it afterwards). `npm run scaffold page Foo` is no longer a valid type.
- [ ] `npm run format:check`, `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] In `npm run dev`, every route renders as before: `/login`, `/`, `/habits`, `/chores`, `/tasks`, `/projects`, `/checklists`, `/checklists/:id`, `/kitchen-sink`. Logging out redirects to `/login`.
