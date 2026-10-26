#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TYPES = {
  component: {
    dir: ["apps", "web", "src", "base", "components"],
    indexPath: ["apps", "web", "src", "base", "components", "index.js"],
    layer: "components",
    jsx: (name, baseClass) => `import css from "./${name}.module.css";

export function ${name}({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.${baseClass}, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...props} />;
}
`,
  },
  feature: {
    dir: ["apps", "web", "src", "features"],
    indexPath: ["apps", "web", "src", "features", "index.js"],
    layer: "features",
    jsx: (name, baseClass) => `import css from "./${name}.module.css";

export function ${name}() {
  return <div className={css.${baseClass}} />;
}
`,
  },
  page: {
    dir: ["apps", "web", "src", "pages"],
    indexPath: ["apps", "web", "src", "pages", "index.js"],
    layer: "features",
    jsx: (name, baseClass) => `import css from "./${name}.module.css";

export function ${name}() {
  return <div className={css.${baseClass}} />;
}
`,
  },
};

const usage = `Usage: npm run scaffold [${Object.keys(TYPES).join("|")}] <Name>
  npm run scaffold Badge             # defaults to "component"
  npm run scaffold feature Reminders
  npm run scaffold page Settings`;

let [first, second] = process.argv.slice(2);

let type = "component";
let name = first;

if (first && TYPES[first]) {
  type = first;
  name = second;
}

if (!name) {
  console.error(usage);
  process.exit(1);
}

if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  console.error(
    `Invalid name "${name}" — use PascalCase, e.g. "Badge" or "TabBar".`,
  );
  process.exit(1);
}

const config = TYPES[type];
const targetDir = path.join(root, ...config.dir, name);

if (existsSync(targetDir)) {
  console.error(`"${path.relative(root, targetDir)}" already exists.`);
  process.exit(1);
}

const baseClass = name[0].toLowerCase() + name.slice(1);

const jsx = config.jsx(name, baseClass);

const css = `@layer ${config.layer} {
.${baseClass} {
}
}
`;

mkdirSync(targetDir, { recursive: true });
writeFileSync(path.join(targetDir, `${name}.jsx`), jsx);
writeFileSync(path.join(targetDir, `${name}.module.css`), css);

const indexPath = path.join(root, ...config.indexPath);
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

const relDir = path.relative(root, targetDir);
console.log(`Scaffolded ${type} ${name}:`);
console.log(`  ${relDir}/${name}.jsx`);
console.log(`  ${relDir}/${name}.module.css`);
console.log(`  updated ${path.relative(root, indexPath)}`);
