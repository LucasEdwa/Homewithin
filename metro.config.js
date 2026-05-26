const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js v2.x uses import(/* webpackIgnore: true */ '@opentelemetry/api')
// for optional telemetry. Hermes cannot compile dynamic import() in the bundle,
// so we must ensure Babel transforms the supabase package (converting import() → require())
// and mock @opentelemetry/api since it is not installed.

// 1. Add @supabase to the Babel transform include list
config.transformer = config.transformer ?? {};
config.transformer.transformIgnorePatterns = [
  "node_modules/(?!(react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules-|sentry-expo|native-base|react-native-svg|@supabase)/.*)",
];

// 2. Resolve @opentelemetry packages to an empty stub so the (now-required) import
//    does not cause a missing-module error at runtime.
const emptyModule = path.resolve(__dirname, "stubs/empty.js");

const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = config.resolver ?? {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@opentelemetry/")) {
    return { type: "sourceFile", filePath: emptyModule };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Exclude the Next.js professional portal from the React Native bundle.
// It has its own package.json and is deployed separately to Vercel.
config.resolver.blockList = /professional-portal\/.*/;

module.exports = config;
