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
    // Agent worktrees and tooling state (gitignored). A worktree under
    // .claude/worktrees carries its own .next build, which made `npm run lint`
    // (and so `npm run deploy`) report thousands of errors from minified code.
    ".claude/**",
  ]),
]);

export default eslintConfig;
