import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

function withoutReactRules(configs) {
  return configs.map((config) => ({
    ...config,
    rules: Object.fromEntries(
      Object.entries(config.rules ?? {}).filter(
        ([rule]) => !rule.startsWith("react/"),
      ),
    ),
  }));
}

const eslintConfig = defineConfig([
  ...withoutReactRules(nextVitals),
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "convex/**",
    "docs/**",
    "eslint.config.mjs",
  ]),
]);

export default eslintConfig;
