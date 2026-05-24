// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      // Deno edge functions — Node ESLint cannot resolve Deno/esm.sh URLs
      "supabase/functions/**",
    ],
  },
  {
    rules: {
      // React Native does not render HTML entities — &apos; / &quot; are
      // literal strings in RN, not escape sequences. Disable the rule.
      "react/no-unescaped-entities": "off",
    },
  },
]);
