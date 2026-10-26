# Remove Storybook — Implementation Plan

Step-by-step plan for the [Feature Spec](./FEATURE_SPECS.md). Section references (§) point to the spec.

## How to work through this

- **One PR, one branch:** `chore/remove-storybook`, cut from an up-to-date `main`.
- **Run every command from the repo root** (`taskira-application/`) unless a step says otherwise.
- **Commit after each numbered step.** The suggested commit messages appear in each step. Small commits keep the review readable and easy to revert.
- **Don't edit anything in `docs/features/`** except this plan's checkboxes. Older specs mention Storybook on purpose (§3).
- **If anything in a step doesn't match what's described** (an extra file, a reference not listed here), stop and add it to spec §5 before you continue. Don't improvise.

---

## Step 0 — Prepare

1. Start from a clean, current `main`:
   ```sh
   git checkout main
   git pull
   git status          # must be clean (ignore untracked docs/ if present)
   git checkout -b chore/remove-storybook
   ```
2. Record a baseline so you can compare later:
   ```sh
   grep -c '"node_modules/' package-lock.json   # expect ~609
   npm run lint && npm test && npm run build
   ```
   All three must pass **before** you change anything. If they don't, stop. The failure isn't caused by this work.

---

## Step 1 — Uninstall the dependencies

1. Remove both packages from the `apps/web` workspace. This updates `apps/web/package.json` and `package-lock.json` together:
   ```sh
   npm uninstall storybook @storybook/react-vite -w apps/web
   ```
2. Check the result:
   ```sh
   git diff apps/web/package.json
   ```
   Only the two `devDependencies` lines should be gone. `@vitejs/plugin-react`, `vite`, and `vitest` must still be there.
3. Confirm the lockfile is clean:
   ```sh
   grep -n 'storybook' package-lock.json      # expect no output
   grep -c '"node_modules/' package-lock.json # expect ~434 (down ~175)
   ```
4. Commit: `chore: uninstall storybook dependencies`

> **Don't** hand-edit `package-lock.json`. If the grep still finds `storybook`, run `rm -rf node_modules && npm install` and check again.

---

## Step 2 — Remove the npm scripts

1. In `apps/web/package.json`, delete these two lines from `"scripts"`:
   ```json
   "storybook": "storybook dev -p 6006",
   "build-storybook": "storybook build"
   ```
   Then remove the trailing comma from the line now last in the block (`"test:watch": ...`) so the JSON stays valid.
2. In the root `package.json`, delete this line from `"scripts"`:
   ```json
   "storybook": "npm run storybook -w apps/web",
   ```
3. Check both files still parse:
   ```sh
   node -e 'require("./package.json"); require("./apps/web/package.json")'
   ```
4. Commit: `chore: remove storybook scripts`

---

## Step 3 — Delete Storybook config and stories

1. Delete the files with `git rm` so the deletions are staged:
   ```sh
   git rm -r apps/web/.storybook
   git rm apps/web/src/base/components/Button/Button.stories.jsx \
          apps/web/src/base/components/Input/Input.stories.jsx \
          apps/web/src/base/components/Modal/Modal.stories.jsx
   ```
2. Confirm no stories remain:
   ```sh
   find apps -path '*/node_modules' -prune -o -name '*.stories.*' -print   # expect no output
   ```
3. Remove any local build output (it's git-ignored, so it won't show in `git status`):
   ```sh
   rm -rf apps/web/storybook-static storybook-static
   ```
4. Commit: `chore: delete storybook config and stories`

---

## Step 4 — Clean up lint, format, and git ignore rules

1. **`eslint.config.js`**
   - In the top-level `ignores` array, delete:
     ```js
     "**/storybook-static/**",
     ```
   - Delete this whole config object:
     ```js
     {
       files: ["apps/web/.storybook/**/*.{js,jsx}"],
       languageOptions: { globals: globals.browser },
     },
     ```
     Leave the `globals` import in place, because other blocks still use it.
2. **`.prettierignore`**: delete the line `storybook-static`.
3. **`.gitignore`**: delete the line `storybook-static/` (under the build output section, next to `dist/`, `build/`, and `.next/`).
4. Check:
   ```sh
   npm run lint
   npm run format:check
   ```
5. Commit: `chore: remove storybook lint and ignore rules`

---

## Step 5 — Update the README

1. In the workspace table, change the `apps/web` row from:
   ```
   The Vite/React web app, including the base component library (`src/base`) with Storybook
   ```
   to:
   ```
   The Vite/React web app, including the base component library (`src/base`)
   ```
2. In the **Development** code block, replace:
   ```
   npm run storybook    # component library in isolation
   ```
   with nothing (delete the line). Then add a sentence directly below the code block:
   ```md
   To browse the base components, run `npm run dev` and open `#/kitchen-sink` (requires sign-in).
   ```
3. Re-align the table:
   ```sh
   npx prettier --write README.md
   ```
4. Commit: `docs: drop storybook from README`

---

## Step 6 — Final sweep

1. Search for leftover references. The only matches allowed are under `docs/`:
   ```sh
   grep -rIn -i storybook . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs
   grep -rIn -i 'stories' apps scripts --exclude-dir=node_modules
   ```
   Both should print nothing. If anything turns up, remove it and add it to spec §5.2.
2. Check the editor config too. These folders aren't covered by the spec, but they could hold a Storybook launch config:
   ```sh
   grep -rIn -i storybook .vscode .claude .github 2>/dev/null
   ```

---

## Step 7 — Verify

Run the CI pipeline locally from a clean install:

```sh
rm -rf node_modules apps/*/node_modules
npm ci
npm run format:check
npm run lint
npm test
npm run build
```

Then do a manual check:

1. `npm run dev`, sign in, and open `http://localhost:5173/#/kitchen-sink`. Every component and icon renders, and Button, Input, and Modal look and behave as they did before.
2. `npm run tauri:dev`. The desktop app starts and loads.
3. `npm run storybook` should now fail with `Missing script: "storybook"`. That's expected.

Tick the acceptance criteria in spec §6 and set the spec's **Status** to `Done`.

---

## Step 8 — Open the PR

1. Push the branch and open a PR to `main`:
   ```sh
   git push -u origin chore/remove-storybook
   gh pr create --base main --title "chore: remove Storybook" \
     --body "Removes Storybook per docs/features/20261026-remove-storybook/FEATURE_SPECS.md. Drops 175 packages from the lockfile; KitchenSink remains the component preview."
   ```
2. Wait for CI to pass before merging.

## Rollback

Every change is in this one PR, so `git revert <merge commit>` followed by `npm install` restores Storybook exactly as it was.
