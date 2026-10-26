# Remove `packages/` Folder — Feature Spec

**Status:** Done · **Date:** 2026-10-23 · **Scope:** `packages/ui` → `apps/web/src/base` (plus root config, `scripts/scaffold.js`, and docs)

## 1. Summary

`packages/` contains exactly one workspace, `packages/ui` (`@taskira/ui`), and `apps/web` is its only consumer. The package boundary costs more than it gives: cross-package path aliases in `jsconfig.json`, a symlink caveat in `vite.config.js`, a Storybook preview that reaches back into `apps/web` for design tokens, and a separate set of dev dependencies.

Move the component library into `apps/web/src/base/` and delete `packages/`.

This is a **refactor, not a feature**. No component, styling, or behavior changes.

## 2. Goals

1. **One place for the web app's code.** Base components and icons live inside `apps/web/src` alongside features and pages.
2. **One import path.** Everything that used `@taskira/ui`, `@taskira/ui/components`, or `@taskira/ui/icons` imports from `@/base`, using the existing `@` alias.
3. **Less config.** No extra workspace, no cross-package `jsconfig` paths, no symlink workaround.
4. **Storybook keeps working.** `npm run storybook` still runs from the repo root and shows the same stories.

## 3. Non-goals

- Changing any component's API, markup, or CSS.
- Restructuring `apps/tauri` or `apps/ios`.
- Adding stories or tests for components that don't have them.

## 4. Target layout

```
apps/web/
  .storybook/            ← from packages/ui/.storybook
    main.js
    preview.js
  src/
    base/                ← from packages/ui/src
      components/
      icons/
      index.js
    features/
    lib/
    pages/
```

`apps/web/src/base/index.js` stays the single barrel (`export * from "./components"; export * from "./icons";`).

## 5. Changes

### 5.1 Files

| From                        | To                                                                  |
| --------------------------- | ------------------------------------------------------------------- |
| `packages/ui/src/**`        | `apps/web/src/base/**`                                              |
| `packages/ui/.storybook/**` | `apps/web/.storybook/**`                                            |
| `packages/ui/package.json`  | Deleted; Storybook dev dependencies move to `apps/web/package.json` |
| `packages/`                 | Deleted                                                             |

### 5.2 Imports

Every `apps/web/src` import of `@taskira/ui`, `@taskira/ui/components`, or `@taskira/ui/icons` becomes `@/base`. Imports inside `base/` stay relative.

### 5.3 Config

| File                             | Change                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                   | Drop `packages/*` from `workspaces`; `storybook` script runs `-w apps/web`                                                    |
| `apps/web/package.json`          | Drop the `@taskira/ui` dependency; add `storybook` / `build-storybook` scripts and the Storybook dev dependencies             |
| `apps/web/jsconfig.json`         | Drop the three `@taskira/ui*` paths (`@/*` already covers `@/base`)                                                           |
| `apps/web/vite.config.js`        | Drop the `preserveSymlinks` comment and setting (it existed only for the `@taskira/ui` symlink; `false` is the default)       |
| `apps/web/.storybook/main.js`    | Stories glob points at `../src/base/**`                                                                                       |
| `apps/web/.storybook/preview.js` | Import `../src/index.css` directly, no longer cross-package                                                                   |
| `eslint.config.js`               | Replace `packages/ui/...` globs with `apps/web/...`; `no-restricted-imports` now flags `@/base/components` and `@/base/icons` |
| `scripts/scaffold.js`            | `component` type writes to `apps/web/src/base/components/`                                                                    |
| `README.md`                      | Remove `packages/ui` from the workspace table; update the scaffold table                                                      |
| `package-lock.json`              | Regenerated with `npm install`                                                                                                |

## 6. Acceptance criteria

- [x] `packages/` no longer exists.
- [x] No references to `@taskira/ui` or `packages/ui` remain outside `docs/`.
- [x] `npm run format:check`, `npm run lint`, `npm test`, and `npm run build` pass.
- [x] `npm run storybook` builds the existing stories (verified with `build-storybook`).
- [x] `npm run scaffold <Name>` creates the component under `apps/web/src/base/components/`.
