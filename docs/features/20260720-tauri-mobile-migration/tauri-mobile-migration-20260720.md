# Tauri for Mobile — Feasibility Notes (2026-07-20)

## Current state

- **Tauri**: already installed (`@tauri-apps/api`, `@tauri-apps/cli`) with a working `src-tauri/` Rust project, configured for **desktop only** (`tauri.conf.json` defines a window; no `gen/android` or `gen/apple` targets exist yet — only `gen/schemas`).
- **Capacitor**: already installed and set up for **iOS**, with a fully generated `ios/App` Xcode project (`npx cap sync ios` via `npm run cap:sync`). This is the app's current mobile path.
- **Native API surface in use**: just `@capacitor/local-notifications`. That's the only thing that would need a Tauri-side equivalent.
- Frontend is plain React + Vite (`react`, `react-router-dom`, `zustand`, `date-fns`, `@dnd-kit/*`) — no Capacitor-specific UI code, so the JS/React layer itself doesn't need to change for either native runtime.

## What the migration would actually involve

1. Run `tauri android init` and/or `tauri ios init` to generate mobile targets inside the existing `src-tauri` project.
2. Replace `@capacitor/local-notifications` with Tauri's notification plugin (`@tauri-apps/plugin-notification` or similar) — the one native call site to port.
3. Re-do native project setup that's already been done once for Capacitor: signing, provisioning, notification entitlements, App Store Connect config, etc., but for the Tauri-generated Xcode/Gradle projects instead.
4. Decide whether to keep Capacitor's `ios/App` around during transition or drop it once Tauri iOS is verified.

Because the Rust/Tauri scaffolding and the React frontend are both already in place, this is **not a from-scratch integration** — it's swapping the native runtime layer under an app that doesn't otherwise change.

## Effort estimate

Low-to-moderate. Not a big lift technically, but not zero — mainly the native project setup (signing/entitlements/store config) has to be redone for the new toolchain, plus verifying Tauri Mobile's notification plugin covers what `@capacitor/local-notifications` currently does.

## Is it worth it?

Marginal, given there's already a **shipped, working iOS app via Capacitor**. The case for switching:

- **Pro**: one native runtime (Tauri) for desktop + iOS + Android instead of maintaining two toolchains (Tauri for desktop, Capacitor for iOS). Worth it mainly if Android support is also wanted.
- **Con**: Tauri Mobile is younger and less battle-tested for iOS App Store submission than Capacitor. Redoing signing/entitlements/store setup for a working app is real (if bounded) work with no user-facing payoff.

**Recommendation**: don't migrate purely to "unify" — only worth it if Android support becomes a real goal, in which case doing Android via Tauri (alongside the existing Capacitor iOS app, rather than replacing it) is a lower-risk first step than a full replace-and-migrate.

## Open question for later

Whether to (a) add Android via Tauri alongside the current Capacitor iOS setup, or (b) do a full replace of Capacitor with Tauri for iOS too. (a) is lower risk and doesn't touch what's already shipping.
