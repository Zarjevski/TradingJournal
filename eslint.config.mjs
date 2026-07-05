import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "e2e/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "playwright.config.ts",
      "vitest.config.ts",
      "vitest.setup.ts",
    ],
  },
  {
    rules: {
      // This codebase predates the React Compiler and relies throughout on intentional,
      // working patterns these newer compiler-oriented rules flag as errors (the
      // `useEffect(() => setMounted(true), [])` hydration-safety idiom, lazy-init refs,
      // Math.random for one-off id generation). Rewriting all of them is a separate,
      // larger effort than "get lint running in CI" — revisit if this app ever adopts
      // the React Compiler.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      // Flags returning JSX from inside a try/catch, which is the standard, safe pattern for
      // Next.js Server Components falling back gracefully on a data-fetch error (not a client
      // error-boundary concern — nothing here is caught after React starts rendering).
      "react-hooks/error-boundaries": "off",
    },
  },
];

export default eslintConfig;
