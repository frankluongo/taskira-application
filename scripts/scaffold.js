#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as prettier from "prettier";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiComponents = path.join(root, "packages", "ui", "src", "components");
const features = path.join(root, "apps", "web", "src", "features");

const usage = `Usage:
  npm run scaffold <Name>                            # same as "component"
  npm run scaffold component <Name>                  # packages/ui component
  npm run scaffold feature <Name>                    # apps/web feature skeleton
  npm run scaffold page <Feature> <Name>             # <Name>Page inside a feature
  npm run scaffold feature-component <Feature> <Name>

Examples:
  npm run scaffold Badge
  npm run scaffold feature Reminders
  npm run scaffold page Reminders Settings           # → Reminders/SettingsPage/
  npm run scaffold feature-component Reminders ReminderRow`;

const lowerFirst = (name) => name[0].toLowerCase() + name.slice(1);
const rel = (p) => path.relative(root, p);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function checkName(name) {
  if (!name) fail(usage);
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    fail(`Invalid name "${name}" — use PascalCase, e.g. "Badge" or "TabBar".`);
  }
}

function checkFeature(feature) {
  checkName(feature);
  const dir = path.join(features, feature);
  if (!existsSync(dir)) fail(`Feature "${rel(dir)}" doesn't exist.`);
  return dir;
}

function checkFree(dir) {
  if (existsSync(dir)) fail(`"${rel(dir)}" already exists.`);
}

function cssModule(layer, baseClass) {
  return `@layer ${layer} {
  .${baseClass} {
  }
}
`;
}

// Writes { relativePath: contents } under dir, formatted with the repo's
// Prettier config, and returns the paths written.
async function writeFiles(dir, files) {
  mkdirSync(dir, { recursive: true });
  const written = [];
  for (const [file, contents] of Object.entries(files)) {
    const target = path.join(dir, file);
    const options = await prettier.resolveConfig(target);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(
      target,
      await prettier.format(contents, { ...options, filepath: target }),
    );
    written.push(rel(target));
  }
  return written;
}

function report(label, written) {
  console.log(`Scaffolded ${label}:`);
  for (const file of written) console.log(`  ${file}`);
}

// Inserts `export * from "./<name>/<name>";` into an index, keeping the
// "./<Name>/" exports alphabetized.
function addSortedExport(indexPath, name) {
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

function pageFiles(pageName, title) {
  const baseClass = lowerFirst(pageName);
  return {
    [`${pageName}.jsx`]: `import { usePageHeader } from "@/app/PageHeader";
import css from "./${pageName}.module.css";

export function ${pageName}() {
  usePageHeader({ title: "${title}" });
  return <div className={css.${baseClass}} />;
}
`,
    [`${pageName}.module.css`]: cssModule("features", baseClass),
  };
}

async function scaffoldComponent([name]) {
  checkName(name);
  const dir = path.join(uiComponents, name);
  checkFree(dir);
  const baseClass = lowerFirst(name);
  const written = await writeFiles(dir, {
    [`${name}.jsx`]: `import css from "./${name}.module.css";

export function ${name}({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.${baseClass}, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...props} />;
}
`,
    [`${name}.module.css`]: cssModule("components", baseClass),
  });
  const indexPath = path.join(uiComponents, "index.js");
  addSortedExport(indexPath, name);
  report(`component ${name}`, [...written, `updated ${rel(indexPath)}`]);
}

async function scaffoldFeature([name]) {
  checkName(name);
  const dir = path.join(features, name);
  checkFree(dir);
  const file = lowerFirst(name);
  const table = file.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  const page = `${name}Page`;

  const written = await writeFiles(dir, {
    "index.js": `export * from "./${page}/${page}";\n`,
    [`${file}.api.js`]: `import { supabase } from "@/services/supabase";

export async function fetch${name}() {
  const { data } = await supabase.from("${table}").select("*").order("sort_order");
  return data || [];
}
`,
    [`${file}.slice.js`]: `// State and actions: optimistic set → await ${file}.api → reminders.
// Take (set, get) once actions need them.
export const create${name}Slice = () => ({
  ${file}: [],
});
`,
    [`${file}.selectors.js`]: `// Derived data: pure functions over plain arrays, plus small hooks.\n`,
    [`${file}.rules.js`]: `// Business rules: pure functions that take \`now\` instead of reading the clock.\n`,
    [`${file}.rules.test.js`]: `import { describe, it } from "vitest";

describe("${file}.rules", () => {
  it.todo("covers every rule");
});
`,
    [`${file}.constants.js`]: `// Labels, option lists, and magic values.\n`,
    ...Object.fromEntries(
      Object.entries(pageFiles(page, name)).map(([f, c]) => [
        `${page}/${f}`,
        c,
      ]),
    ),
  });
  mkdirSync(path.join(dir, "components"));

  report(`feature ${name}`, [...written, `${rel(dir)}/components/`]);
  console.log(`
Next steps:
  1. Register create${name}Slice in apps/web/src/store/index.js
  2. Add a route for ${page} in apps/web/src/app/router.jsx`);
}

async function scaffoldPage([feature, name]) {
  const featureDir = checkFeature(feature);
  checkName(name);
  const page = name.endsWith("Page") ? name : `${name}Page`;
  const dir = path.join(featureDir, page);
  checkFree(dir);
  const title = page.slice(0, -"Page".length);
  const written = await writeFiles(dir, pageFiles(page, title));

  const indexPath = path.join(featureDir, "index.js");
  if (!existsSync(indexPath)) writeFileSync(indexPath, "");
  addSortedExport(indexPath, page);

  report(`page ${feature}/${page}`, [...written, `updated ${rel(indexPath)}`]);
  console.log(
    `\nNext step: add a route for ${page} in apps/web/src/app/router.jsx`,
  );
}

async function scaffoldFeatureComponent([feature, name]) {
  const featureDir = checkFeature(feature);
  checkName(name);
  const dir = path.join(featureDir, "components", name);
  checkFree(dir);
  const baseClass = lowerFirst(name);
  const written = await writeFiles(dir, {
    [`${name}.jsx`]: `import css from "./${name}.module.css";

export function ${name}() {
  return <div className={css.${baseClass}} />;
}
`,
    [`${name}.module.css`]: cssModule("features", baseClass),
  });
  report(`component ${feature}/components/${name}`, written);
}

const COMMANDS = {
  component: scaffoldComponent,
  feature: scaffoldFeature,
  page: scaffoldPage,
  "feature-component": scaffoldFeatureComponent,
};

const args = process.argv.slice(2);
if (args.length === 0) fail(usage);
const command = COMMANDS[args[0]];
if (command) await command(args.slice(1));
else await scaffoldComponent(args);
