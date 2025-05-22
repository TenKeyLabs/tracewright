import eslintPluginPrettierConfig from "eslint-plugin-prettier/recommended";
import globals from "globals";
import typescriptEslintParser from "@typescript-eslint/parser";
import * as eslintPluginImport from "eslint-plugin-import";
import * as eslintPluginCheckFile from "eslint-plugin-check-file";
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(eslintPluginPrettierConfig, typescriptEslint.configs.recommended, {
  languageOptions: {
    parser: typescriptEslintParser,
    ecmaVersion: 12,
    globals: {
      ...globals.mocha,
      ...globals.node,
      ...globals.es5,
    },
  },
  plugins: {
    "check-file": eslintPluginCheckFile,
    import: eslintPluginImport,
  },
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "no-implicit-coercion": ["error"],
    "check-file/filename-naming-convention": [
      "error",
      {
        "webapp/src/**/*.{js,ts,jsx,tsx}": "CAMEL_CASE",
      },
      {
        ignoreMiddleExtensions: true,
      },
    ],
    "check-file/folder-naming-convention": [
      "error",
      {
        "webapp/**": "SNAKE_CASE",
      },
    ],
    "@typescript-eslint/no-unused-expressions": [
      "error",
      {
        allowTernary: true,
        allowShortCircuit: true,
      },
    ],
  },
});
