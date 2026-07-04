// Runs on staged files at commit time (via .husky/pre-commit → lint-staged).
export default {
  // The design-token guardrail scans the whole src tree in one pass, so ignore
  // the file list and run it once whenever any TS/TSX source file is staged.
  "src/**/*.{ts,tsx}": () => "npm run lint:design",
  // ESLint only the files actually staged — fast, and auto-fixable issues get
  // fixed. Errors block the commit; warnings don't (matches `npm run lint` / CI).
  "*.{ts,tsx}": (files) => [
    `npx eslint --fix ${files.map((f) => `"${f}"`).join(" ")}`,
  ],
};
