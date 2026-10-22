import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

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
  {
    files: ["apps/web/src/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@taskira/ui/components",
              message: 'Import from "@taskira/ui" instead.',
            },
            {
              name: "@taskira/ui/icons",
              message: 'Import from "@taskira/ui" instead.',
            },
          ],
        },
      ],
    },
  },
];
