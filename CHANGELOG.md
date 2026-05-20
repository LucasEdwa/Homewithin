# Changelog

All notable changes to HomeWithin are documented here.

---

## [1.0.1] — 2026-05-20

### Bug Fixes

- **Journal: editing an entry created a duplicate instead of updating it**
  When opening an existing journal entry from the list and saving, a new entry was created instead of updating the original. Root cause: the screen tracked the entry ID via a URL param that was never updated when opening entries from within the screen. Fixed by introducing an `editingId` state variable that is set when opening an entry, cleared when starting a new entry, and used by the save handler instead of the URL param.

- **Connect: users could match with the same person across multiple interests**
  After connecting with someone via one interest (e.g. "mentor"), that same person could still appear as a candidate under a different interest (e.g. "first friend"), resulting in duplicate match records. Root cause: `findMatches()` only excluded users the current user had acted on as the *requester*, missing the reverse direction. Fixed by also fetching rows where the current user is the *target* and adding those users to the exclusion set.

- **Splash screen: placeholder grid/net image showing on dark mode**
  On devices in dark mode, the native splash screen showed a black background with a grey grid and concentric circles template image instead of the actual app icon. Root cause: `assets/images/splash-icon.png` was still the Expo placeholder image. Fixed by replacing it with the real app icon. Dark mode background color should also be updated to match the icon's background.

### Build Fixes

- **iOS archive failed with "No space left on device"**
  CocoaPods could not copy React Native pod files during `pod install` because the build machine had less than 1 GB of free disk. Resolved by clearing iOS DeviceSupport symbols, Xcode DerivedData, CocoaPods cache, and browser caches to free ~14 GB.

- **Xcode sandbox blocked build scripts (find: deny file-read-data)**
  Xcode 26+ enables user script sandboxing by default, which blocked CocoaPods build scripts (including the Hermes configuration script) from reading project files using `find`. Fixed by adding `ENABLE_USER_SCRIPT_SANDBOXING = 'NO'` to the `post_install` hook in `ios/Podfile` for all pod targets, and disabling it for the main app target in Xcode Build Settings.

- **Hermes failed to compile bundle: "Invalid expression encountered"**
  `@supabase/supabase-js` v2.106.0 uses `import(/* webpackIgnore: true */ '@opentelemetry/api')` to optionally load OpenTelemetry tracing. Hermes cannot compile dynamic `import()` expressions. Fixed by patching the supabase package (via `patch-package`) to replace the dynamic import with `Promise.resolve(null)` since OpenTelemetry is not installed. Patch is auto-applied on `npm install` via the `postinstall` script.

- **App crashed on launch: incompatible React versions**
  `react` was at `19.2.6` but `react-native` 0.81.5 ships with `react-native-renderer` built against `19.1.0`. React requires these to be the exact same version. Fixed by downgrading `react` and `react-dom` to `19.1.0`.

### Version Numbers

| | v1.0.0 | v1.0.1 |
|---|---|---|
| App version | 1.0.0 | 1.0.1 |
| iOS build number | 4 | 6 |
| Android version code | 3 | 4 |

---

## [1.0.0] — Initial Release

- Safe space app for LGBTQ+ people in Sweden
- Journal with PIN-protected hidden entries
- Connect feature — match with peers by shared intentions
- AI companion for emotional support
- Emergency resources and local LGBTQ+ services
- Disguise mode (calculator, weather, notes)
- Push notifications for chat messages
- Supabase backend with real-time chat
