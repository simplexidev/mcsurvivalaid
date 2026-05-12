import minecraftLinting from "eslint-plugin-minecraft-linting";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["behaviors/scripts/**", "behaviors/**/*.json", "resources/**", "node_modules/**"],
  },
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": ts,
      "minecraft-linting": minecraftLinting,
    },
    rules: {
      "minecraft-linting/avoid-unnecessary-command": "warn",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
