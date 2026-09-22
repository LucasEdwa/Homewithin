# Android "Quick Help" widget — untested scaffold

Built with `react-native-android-widget`. **This has not been built or
run.** There is no `android/` directory in this project yet (it's never
been prebuilt for Android), so none of this has been verified against a
real Android build — API usage was checked against the library's
TypeScript source in `node_modules` rather than a working example.

## What it's supposed to do

Same as the iOS widget (see `targets/widget/README.md` for the full
reasoning): a small, static, neutrally-branded ("Quick Help") tile that
opens `homewithin://emergency` when tapped, via the library's built-in
`OPEN_URI` click action (handled natively — `widget-task-handler.ts` only
needs to handle render/update actions, not the click itself).

## Before shipping, verify

1. **First Android prebuild.** Run `npx expo prebuild -p android`. Since
   there's no existing `android/` directory, this is a first-time
   generation, not a regeneration — review the output before committing it,
   the same way you'd review any other first-time scaffold.
2. **The entry-point change.** `package.json`'s `"main"` was changed from
   `"expo-router/entry"` to `"index.js"` (a new file at the repo root) so
   the widget's headless task registers before the bundle finishes loading —
   `react-native-android-widget` needs this to handle widget updates when
   Android launches the app in the background with no UI. `index.js` just
   registers the task and then re-exports `expo-router/entry`, so normal
   app boot should be unaffected, but this is exactly the kind of change
   that's cheap to get subtly wrong and easy to verify: confirm the app
   still boots normally (`npx expo start`) before touching the widget
   itself.
3. **The click deep link.** Confirm tapping the widget actually opens
   `/emergency`, not just the app. Same lock-screen/disguise-mode caveat as
   the iOS widget applies — see point 3 in `targets/widget/README.md`.
4. **Widget size.** `minWidth`/`minHeight` in `app.json` are set to
   `"110dp"` as a reasonable small-square guess (roughly matching iOS's
   `.systemSmall`) — not validated against an actual home screen grid.
5. **Colors.** `QuickHelpWidget.tsx` uses inline hex colors matching the
   app's actual `warmWhite`/`alertRed` constants
   (`constants/Colors.ts`) — these aren't imported directly since
   this file may render in a headless JS context without the rest of the
   app's module graph guaranteed to be safe to import; the values are
   just copied by hand and could drift if the app's palette changes.
