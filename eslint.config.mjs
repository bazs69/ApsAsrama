import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore database maintenance scripts
    "delete_data.js",
    "drop.js",
    "drop_pg.js",
    "test-db.js",
    "test-prisma.js",
    "update-roles.js",
  ]),
]);

export default eslintConfig;
