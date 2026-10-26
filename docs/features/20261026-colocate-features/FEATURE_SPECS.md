# Co-locate Pages Into Features — Feature Spec

**Status:** Proposed · **Date:** 2026-10-26 · **Scope:** `apps/web/src` (`pages/`, `features/`, `routes.jsx`), `scripts/scaffold.js`, `README.md`

## 1. Summary

The web app splits each product area across two folders. The Tasks area, for example, has its route component in `src/pages/Tasks.jsx` and its building blocks (`TaskItem`, `TaskForm`, `PriorityBadge`) in `src/features/Tasks/`. To work on one area you jump between two trees, and the split tells you nothing useful: every page belongs to one feature, and most features exist to serve one page.

Move every page into the feature it belongs to, so `src/features/<Area>/` holds everything for that area: its page(s), components, constants, and helpers. Then delete `src/pages/`.

This is a **file-structure refactor, not a feature**. No UI, styling, routing, or behavior changes.

## 2. Goals

1. **One place per product area.** Everything for Tasks lives in `features/Tasks/`, everything for Habits in `features/Habits/`, and so on.
2. **No `pages/` folder.** Route components live next to the components they compose.
3. **Consistent pages.** Every page is a named export called `<Name>Page`, in its own `<Name>Page/` folder with a matching CSS module. Today there's a mix of flat default-export files (`Tasks.jsx`) and folder-based named exports (`LoginRoute/LoginRoute.jsx`).
4. **Explicit feature boundaries.** Code outside a feature imports it through that feature's barrel (`@/features/Tasks`). Code inside a feature imports its siblings by relative path.
5. **Nothing else changes.** URLs, rendered markup, CSS, store, and tests behave exactly as before.

## 3. Non-goals

- Changing any component's API, markup, or CSS rules (class names stay as they are).
- Changing routes or URLs.
- Adding lazy loading or code splitting to routes.
- Normalizing how features are organized internally. For example, `Habits` keeps its `components/`, `constants/`, and `functions/` subfolders while `Tasks` and `Chores` stay flat. That can be a follow-up.
- Moving `src/base/` or `src/lib/`. They are shared infrastructure, not features.
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
- **A root barrel that will become a cycle.** Pages import from `@/features`, which re-exports every feature. Once pages live inside features and their barrels export them, `TasksPage` importing `@/features` would import itself. ES modules tolerate that, but it's fragile and makes Vite's HMR fall back to full reloads.
- **Hidden dependencies.** `import { ... } from "@/features"` hides which feature a symbol comes from. `Today.jsx` even imports from both `@/features` and `@/features/Habits`.

## 5. Target state

```
src/
├── features/
│   ├── Auth/
│   │   ├── index.js
│   │   ├── LoginPage/            # was pages/LoginRoute
│   │   └── ProtectedRoute/       # was pages/ProtectedRoute
│   ├── Checklists/
│   │   ├── index.js
│   │   ├── ChecklistDetailPage/  # was pages/ChecklistDetailRoute
│   │   └── ChecklistsPage/       # was pages/Checklists.jsx
│   ├── Chores/
│   │   ├── index.js
│   │   ├── ChoreForm/
│   │   ├── ChoreItem/
│   │   └── ChoresPage/           # was pages/Chores.jsx
│   ├── DragAndDrop/              # unchanged
│   ├── Habits/
│   │   ├── index.js
│   │   ├── components/           # unchanged
│   │   ├── constants/            # unchanged
│   │   ├── functions/            # unchanged
│   │   └── HabitsPage/           # was pages/Habits.jsx
│   ├── KitchenSink/
│   │   ├── index.js
│   │   └── KitchenSinkPage/      # was pages/KitchenSink.jsx
│   ├── Projects/
│   │   ├── index.js
│   │   └── ProjectsPage/         # was pages/Projects.jsx
│   ├── Taskira/
│   │   ├── index.js              # new
│   │   ├── AppNavigation/        # was features/AppNavigation
│   │   ├── PageHeaderContext.js
│   │   ├── Taskira.jsx
│   │   └── Taskira.module.css
│   ├── Tasks/
│   │   ├── index.js
│   │   ├── PriorityBadge/
│   │   ├── TaskForm/
│   │   ├── TaskItem/
│   │   └── TasksPage/            # was pages/Tasks.jsx
│   └── Today/
│       ├── index.js
│       └── TodayPage/            # was pages/Today.jsx
└── routes.jsx
```

`features/index.js` and `pages/` are gone.

### 5.1 Where each page goes

| Current                        | New                                                        | Export name           |
| ------------------------------ | ---------------------------------------------------------- | --------------------- |
| `pages/Today.jsx`              | `features/Today/TodayPage/TodayPage.jsx`                   | `TodayPage`           |
| `pages/Habits.jsx`             | `features/Habits/HabitsPage/HabitsPage.jsx`                | `HabitsPage`          |
| `pages/Chores.jsx`             | `features/Chores/ChoresPage/ChoresPage.jsx`                | `ChoresPage`          |
| `pages/Tasks.jsx`              | `features/Tasks/TasksPage/TasksPage.jsx`                   | `TasksPage`           |
| `pages/Projects.jsx`           | `features/Projects/ProjectsPage/ProjectsPage.jsx`          | `ProjectsPage`        |
| `pages/Checklists.jsx`         | `features/Checklists/ChecklistsPage/ChecklistsPage.jsx`    | `ChecklistsPage`      |
| `pages/ChecklistDetailRoute/…` | `features/Checklists/ChecklistDetailPage/…`                | `ChecklistDetailPage` |
| `pages/LoginRoute/…`           | `features/Auth/LoginPage/…`                                | `LoginPage`           |
| `pages/ProtectedRoute/…`       | `features/Auth/ProtectedRoute/…`                           | `ProtectedRoute`      |
| `pages/KitchenSink.jsx`        | `features/KitchenSink/KitchenSinkPage/KitchenSinkPage.jsx` | `KitchenSinkPage`     |
| `features/AppNavigation/`      | `features/Taskira/AppNavigation/`                          | `AppNavigation`       |

Each page's CSS module moves with it and is renamed to match (`Tasks.module.css` → `TasksPage/TasksPage.module.css`). Its contents, including `@layer features` and class names, don't change.

**Why `Projects` is its own feature.** It has its own route and nav entry. It reuses `TaskItem` and `TaskForm`, which it imports from `@/features/Tasks` like any other consumer.

**Why `Today` is its own feature.** It's a dashboard that pulls from Habits, Chores, and Tasks, so it doesn't belong inside any one of them.

**Why `ProtectedRoute` keeps its name.** It's a route guard that renders `<Outlet />` or redirects, not a page.

### 5.2 Conventions

| Rule                  | Detail                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Feature barrel        | Every feature folder has an `index.js` that re-exports its public API, pages included.                                                                                                     |
| Cross-feature imports | Use the feature's barrel: `import { TaskItem } from "@/features/Tasks"`. Never deep-import another feature's files, and never import from `@/features` (the root barrel no longer exists). |
| In-feature imports    | Use relative paths: `import { TaskItem } from "../TaskItem/TaskItem"`. A file must never import its own feature's barrel, because the barrel exports that file and would create a cycle.   |
| Page naming           | `<Name>Page/<Name>Page.jsx` + `<Name>Page.module.css`, named export `<Name>Page`. No default exports.                                                                                      |
| Private pieces        | Components used only inside a feature (like `AppNavigation` in `Taskira`) live in that feature and don't have to be exported from its barrel.                                              |

### 5.3 Why remove the root barrel

The alternative is to keep `features/index.js` and re-export the pages through it. That keeps the current one-line imports, but:

- Every page would import a barrel that re-exports the page itself, which is a circular import.
- It hides the dependency graph. With per-feature imports you can see that `TodayPage` depends on Habits, Tasks, and Taskira just by reading its imports.
- It loads every feature to get one symbol, which will matter if routes are lazy-loaded later.

`src/base` keeps its root barrel (`@/base`). Base components are leaf primitives that never import features, so they can't form a cycle.

### 5.4 Other changes

| File                  | Change                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/routes.jsx`      | Import every route component as a named export from its feature barrel.                                                                                                                                |
| `scripts/scaffold.js` | Drop the `page` type. `feature <Name>` now creates `features/<Name>/index.js` plus a `<Name>Page/` stub (JSX + CSS module), instead of appending to the deleted root barrel. `component` is unchanged. |
| `README.md`           | Update the scaffolding section to match.                                                                                                                                                               |

### 5.5 Unaffected

- `src/base/`, `src/lib/`, `src/index.css`, `main.jsx`, `App.jsx`.
- `vite.config.js` and `jsconfig.json`. The `@/` alias already covers `@/features/<Name>`.
- `eslint.config.js`, `.prettierignore`, and the CI and release workflows, none of which reference `pages/` or `features/`.
- The only test (`src/lib/date.test.js`).
- Storybook. Its config only globs `src/base/**`, so this refactor is independent of the separate Storybook-removal work.

## 6. Risks

| Risk                                                      | Mitigation                                                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A missed import path breaks the build or a route          | Vite fails the build on unresolved imports. Run `npm run build` after each step, and click through every route in `npm run dev`. |
| A circular import through a barrel                        | Follow the in-feature relative-import rule. Grep check in §7.                                                                    |
| Losing file history                                       | Move files with `git mv` and land moves before content edits where practical, so `git log --follow` keeps working.               |
| Merge conflicts with in-flight branches touching `pages/` | Land this as one short-lived PR. It's mechanical and easy to rebase onto.                                                        |

## 7. Acceptance criteria

- [ ] `apps/web/src/pages/` and `apps/web/src/features/index.js` don't exist.
- [ ] Every folder directly under `apps/web/src/features/` has an `index.js`.
- [ ] Every page is a named `<Name>Page` export in `<Name>Page/<Name>Page.jsx`, except `ProtectedRoute`.
- [ ] `grep -rn '@/pages\|from "@/features"' apps/web/src` returns nothing.
- [ ] No file imports its own feature's barrel. For example, nothing in `features/Tasks/` imports `@/features/Tasks`.
- [ ] No `export default` in `apps/web/src/features/`.
- [ ] `npm run scaffold feature Foo` creates `features/Foo/index.js` and `features/Foo/FooPage/` (delete it afterwards). `npm run scaffold page Foo` is no longer a valid type.
- [ ] `npm run format:check`, `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] In `npm run dev`, every route renders as before: `/login`, `/`, `/habits`, `/chores`, `/tasks`, `/projects`, `/checklists`, `/checklists/:id`, `/kitchen-sink`. Logging out redirects to `/login`.
