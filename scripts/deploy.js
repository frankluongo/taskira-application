#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BUMP_TYPES = { fix: "patch", feat: "minor", break: "major" };
const bumpType = BUMP_TYPES[process.argv[2]];

if (!bumpType) {
  console.error("Usage: npm run deploy <fix|feat|break>");
  console.error("  fix   patch release (bug fixes)");
  console.error("  feat  minor release (new features)");
  console.error("  break major release (breaking changes)");
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: root })
  .toString()
  .trim();
if (branch !== "main") {
  console.error(
    `Refusing to deploy from branch "${branch}" — switch to main first.`,
  );
  process.exit(1);
}

const status = execSync("git status --porcelain", { cwd: root })
  .toString()
  .trim();
if (status) {
  console.error(
    "Working tree has uncommitted changes — commit or stash before deploying.",
  );
  process.exit(1);
}

run("git pull --ff-only origin main");

run(`npm version ${bumpType} --no-git-tag-version`);

const pkgPath = path.join(root, "package.json");
const version = JSON.parse(readFileSync(pkgPath, "utf8")).version;

const tauriConfPath = path.join(
  root,
  "apps",
  "tauri",
  "src-tauri",
  "tauri.conf.json",
);
const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
tauriConf.version = version;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");

run(
  "git add package.json package-lock.json apps/tauri/src-tauri/tauri.conf.json",
);
run(`git commit -m "chore: release v${version}"`);
run(`git tag v${version}`);
run("git push origin main");
run(`git push origin v${version}`);

console.log(
  `\nDeployed v${version}. GitHub Actions is now building the release:`,
);
console.log("  gh run list --limit 1");
console.log(
  `  https://github.com/frankluongo/taskira/releases/tag/v${version}`,
);
