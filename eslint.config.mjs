import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [
  {
    ignores: [
      "node_modules/**", ".next/**", "seed-kit/**", "drizzle/**", ".storage/**", "tmp/**",
      "playwright-report/**", "test-results/**", "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { rules: { "@next/next/no-img-element": "off", "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] } },
];
