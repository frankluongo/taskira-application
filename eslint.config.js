import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const FEATURES = {
  group: ["@/features/*"],
  message: "This layer can't depend on features.",
};
const STORE = {
  group: ["@/store", "@/store/*"],
  message: "This layer can't depend on the store.",
};
const APP = {
  group: ["@/app/*"],
  message: "This layer can't depend on app/.",
};
const SHARED = {
  group: ["@/shared/*"],
  message: "services/ can't depend on shared/.",
};

// no-restricted-imports options for apps/web/src. allowDeep re-allows
// specific deep feature imports; forbid adds layer-specific patterns.
function restrict({ allowDeep = [], forbid = [] } = {}) {
  return {
    patterns: [
      {
        group: ["@/features/*/*", ...allowDeep.map((p) => `!${p}`)],
        message:
          "Import from the feature's index.js; use relative imports within a feature.",
      },
      {
        group: ["@/lib/*", "@/pages/*"],
        message:
          "lib/ and pages/ were removed; see the app structure in README.",
      },
      {
        group: ["@taskira/ui/*"],
        message: 'Import from "@taskira/ui" instead.',
      },
      ...forbid,
    ],
  };
}

export default [
  {
    ignores: [
      "**/dist/**",
      "**/storybook-static/**",
      "apps/ios/ios/**",
      "apps/ios/android/**",
      "apps/tauri/src-tauri/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["apps/web/src/**/*.{js,jsx}", "packages/ui/src/**/*.{js,jsx}"],
    ...react.configs.flat.recommended,
    ...react.configs.flat["jsx-runtime"],
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.flat.recommended.rules,
      "react-hooks/exhaustive-deps": "warn",
      "react/prop-types": "off",
    },
  },
  {
    files: ["packages/ui/.storybook/**/*.{js,jsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["scripts/**/*.js", "**/*.config.js"],
    languageOptions: { globals: globals.node },
  },
  // Layer boundaries (spec §5.2). Each block restates the whole rule, since a
  // later block's options replace an earlier one's for the files it matches.
  {
    files: ["apps/web/src/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": ["error", restrict()],
      "max-lines": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    // The store composes feature slices.
    files: ["apps/web/src/store/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        restrict({ allowDeep: ["@/features/*/*.slice"], forbid: [APP] }),
      ],
    },
  },
  {
    // Bootstrap is the composition root for startup loading and cleanup.
    files: ["apps/web/src/app/bootstrap.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        restrict({ allowDeep: ["@/features/*/*.api", "@/features/*/*.rules"] }),
      ],
    },
  },
  {
    files: ["apps/web/src/shared/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        restrict({ forbid: [FEATURES, STORE, APP] }),
      ],
    },
  },
  {
    files: ["apps/web/src/services/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        restrict({ forbid: [FEATURES, STORE, APP, SHARED] }),
      ],
    },
  },
];
