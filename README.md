# taskira

A task/habit tracker built with React + Vite, packaged as a native desktop app with [Tauri](https://tauri.app) and an iOS app with [Capacitor](https://capacitorjs.com).

This is an npm-workspaces monorepo:

| Path          | What                                                         |
| ------------- | ------------------------------------------------------------ |
| `apps/web`    | The Vite/React web app                                       |
| `apps/tauri`  | The Tauri desktop shell, wrapping `apps/web`'s build output  |
| `apps/ios`    | The Capacitor iOS shell, wrapping `apps/web`'s build output  |
| `packages/ui` | `@taskira/ui` — the shared component library, with Storybook |

## Development

```
npm install
npm run dev          # web-only, in the browser
npm run tauri:dev    # desktop app, hot-reloading
npm run storybook    # component library in isolation
```

Checks (CI runs all four on every PR):

```
npm run format:check # Prettier (npm run format to fix)
npm run lint         # ESLint, including the layer boundaries below
npm test             # Vitest, pinned to America/New_York
npm run build
```

## App structure

`apps/web/src` is organized by domain. Each feature owns its data access, state, rules, components, and routes:

```
apps/web/src/
├── main.jsx        # entry: mounts <App/>
├── app/            # shell: App, router, AppLayout, AppNavigation, PageHeader, bootstrap
├── services/       # the outside world: supabase, auth, notifications (no React components)
├── shared/         # domain-agnostic helpers: date, recurrence, reorder, dnd
├── store/          # composes the feature slices into one Zustand store
└── features/
    ├── Habits/     # and Chores, Tasks, Projects, Checklists, Today, Auth, KitchenSink
    │   ├── index.js              # public API: the only file other folders import
    │   ├── habits.api.js         # Supabase reads and writes
    │   ├── habits.slice.js       # Zustand state + actions (optimistic set → api → reminder)
    │   ├── habits.selectors.js   # derived data: pure functions, plus small hooks
    │   ├── habits.rules.js       # pure business rules, tested in habits.rules.test.js
    │   ├── habits.constants.js
    │   ├── components/<Name>/
    │   └── HabitsPage/           # route component
```

| Layer           | May import from                                                                               |
| --------------- | --------------------------------------------------------------------------------------------- |
| `app/`          | everything                                                                                    |
| `features/<X>/` | `shared/`, `services/`, `store/`, `@taskira/ui`, `app/PageHeader`, other features' `index.js` |
| `store/`        | feature slices                                                                                |
| `shared/`       | npm packages, `@taskira/ui`                                                                   |
| `services/`     | npm packages                                                                                  |

Conventions:

- Named exports only. Route components are `<Thing>Page` in `features/<X>/<Thing>Page/`.
- Every component gets a folder: `Name/Name.jsx` + `Name.module.css`.
- Use relative imports inside a feature and `@/features/<X>` across features. Import UI from `@taskira/ui` only.
- Components subscribe to the store with a selector, never bare `useStore()`. Select raw state with `useShallow` and derive with `useMemo`, because a selector that returns a new array each call loops forever in Zustand v5.
- Pages set their title and header actions with `usePageHeader({ title, action })`; `AppLayout` renders them.
- Pure functions that depend on the current time take a `now` parameter.

ESLint enforces the import rules. The full design is in the [restructure spec](docs/features/application-restructure/FEATURE_SPECS.md).

## Scaffolding

```
npm run scaffold <Name>                              # same as "component"
npm run scaffold component <Name>
npm run scaffold feature <Name>
npm run scaffold page <Feature> <Name>
npm run scaffold feature-component <Feature> <Name>
```

| Type                | Creates                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `component`         | `packages/ui/src/components/<Name>/` and adds it to `packages/ui/src/components/index.js` |
| `feature`           | `apps/web/src/features/<Name>/` with the skeleton above                                   |
| `page`              | `apps/web/src/features/<Feature>/<Name>Page/` and adds it to the feature's `index.js`     |
| `feature-component` | `apps/web/src/features/<Feature>/components/<Name>/`                                      |

`feature` doesn't touch any shared file. It prints the two remaining steps: register the slice in `store/index.js` and add the route in `app/router.jsx`. Components get `className`/`variant` prop handling built in, since they're the design-system primitives other code composes. Names must be PascalCase, and the command refuses to overwrite an existing directory.

## Building locally

```
npm run tauri:build
```

Produces a universal macOS `.app`/`.dmg` in `apps/tauri/src-tauri/target/release/bundle/`.

## Releasing a new desktop build

Releases are built by GitHub Actions ([.github/workflows/release.yml](.github/workflows/release.yml)) whenever a `v*` tag is pushed to `main`. The workflow builds a universal (Intel + Apple Silicon) macOS binary and publishes it to [GitHub Releases](https://github.com/frankluongo/taskira/releases).

### Automatic (recommended)

```
npm run deploy fix    # patch release for bug fixes        (0.1.0 -> 0.1.1)
npm run deploy feat   # minor release for new features     (0.1.0 -> 0.2.0)
npm run deploy break  # major release for breaking changes (0.1.0 -> 1.0.0)
```

This bumps the version in `package.json` and `apps/tauri/src-tauri/tauri.conf.json`, commits the bump, tags it (`vX.Y.Z`), and pushes both to `origin`. GitHub Actions takes it from there — check progress with `gh run list --limit 1`.

The script refuses to run if you're not on `main` or have uncommitted changes, and pulls the latest `main` before bumping.

### Manual

1. Bump the `version` field in **both** `package.json` and `apps/tauri/src-tauri/tauri.conf.json` to the same value — if they drift, the built app's filename won't match the git tag.
2. `git commit -am "chore: release vX.Y.Z"`
3. `git tag vX.Y.Z`
4. `git push origin main && git push origin vX.Y.Z`

### Installing on another machine

Download the `.dmg` from the [Releases page](https://github.com/frankluongo/taskira/releases), open it, and drag Taskira to Applications. The app isn't code-signed, so macOS Gatekeeper will block it on first launch — right-click the app → Open → confirm, or run:

```
xattr -cr /Applications/Taskira.app
```
