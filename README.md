# taskira

A task/habit tracker built with React + Vite, packaged as a native desktop app with [Tauri](https://tauri.app) and an iOS app with [Capacitor](https://capacitorjs.com).

This is an npm-workspaces monorepo:

| Path         | What                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| `apps/web`   | The Vite/React web app, including the base component library (`src/base`) with Storybook |
| `apps/tauri` | The Tauri desktop shell, wrapping `apps/web`'s build output                              |
| `apps/ios`   | The Capacitor iOS shell, wrapping `apps/web`'s build output                              |

## Development

```
npm install
npm run dev          # web-only, in the browser
npm run tauri:dev    # desktop app, hot-reloading
npm run storybook    # component library in isolation
```

## Scaffolding

```
npm run scaffold ComponentName            # base component (default type)
npm run scaffold component ComponentName
npm run scaffold feature FeatureName
npm run scaffold page PageName
```

Generates a new folder with a JSX file, a companion CSS module, and an entry added to the relevant barrel `index.js` (kept alphabetized):

| Type        | Location                               | Barrel                                  |
| ----------- | -------------------------------------- | --------------------------------------- |
| `component` | `apps/web/src/base/components/<Name>/` | `apps/web/src/base/components/index.js` |
| `feature`   | `apps/web/src/features/<Name>/`        | `apps/web/src/features/index.js`        |
| `page`      | `apps/web/src/pages/<Name>/`           | `apps/web/src/pages/index.js`           |

Components get `className`/`variant` prop handling built in, since they're the design-system primitives other code composes. Features and pages get a plain component stub. Names must be PascalCase, and the command refuses to overwrite an existing directory.

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
