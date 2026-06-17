// Root ESLint flat config. Re-exports the shared Nexoris Technologies config so every
// package and app is linted by one set of rules. Packages run `eslint` from their own
// directory and ESLint resolves this config by searching upward.
export { default } from "@nexoris/config/eslint";
