# iOS "Quick Help" widget — untested scaffold

This target was generated with `npx create-target widget` (from
`@bacons/apple-targets`) and then trimmed down and rewritten by hand. **It
has not been built or run** — this environment has no Xcode, only command
line tools, so none of it has been verified to actually compile or behave
correctly on-device.

## What it's supposed to do

A small (`.systemSmall`), static, unconfigurable widget. Tapping it opens
the app via the `homewithin://emergency` deep link. No data is fetched, no
user configuration, no network — the timeline has a single entry with
`policy: .never`.

**Deliberately neutral branding.** The widget tile ("Quick Help" / "Tap for
support") does not mention HomeWithin, LGBTQ+, or anything else that would
be risky if a hostile person saw it on the home screen — this sits
permanently in view, unlike a transient notification, so it gets at least
the same treatment as the notification-content fix elsewhere in this repo.

## Before shipping, verify

1. **It actually builds.** Run `npx expo prebuild -p ios --clean`, open with
   `xed ios`, select the `quickhelpwidget` scheme, and build. Watch for
   the usual widget-extension gotchas (see the package's own README section
   "Building Widgets" — SwiftUI preview cache, uncompiled RN in the main
   target slowing the Swift compiler, etc.).
2. **The tap target.** Confirm the widget actually opens the app to the
   emergency screen, not just the app in general. `widgetURL` requires the
   host app's `Info.plist`/scheme setup to already handle `homewithin://` —
   this should already work since the app declares `"scheme": "homewithin"`
   in `app.json`, but hasn't been confirmed against this specific widget.
3. **Lock screen / disguise mode interaction.** `app/_layout.tsx`'s
   `LockGate` already redirects to `/lock` if PIN lock is on, before any
   route (including one opened via deep link) renders — so tapping the
   widget while locked should land on the lock screen, not the emergency
   screen directly. That's the secure default and is intentional. What's
   *not* built: after unlocking, the app does not currently resume
   navigation to `/emergency` — it lands wherever normal post-unlock
   navigation goes. Decide if that's acceptable or worth a follow-up (there
   is precedent for "resume pending navigation after unlock" in the same
   file, built for notification taps — extending it to widget taps would be
   the natural next step).
4. **Colors.** `widgets.swift` uses inline hex values rather than the named
   assets the `colors` block in `expo-target.config.js` would generate,
   specifically because I couldn't verify what those generated asset names
   actually are without a build. If you'd rather use the generated
   colorset, check `Assets.xcassets` after a prebuild and swap
   `Color.widgetBackground`/`Color.widgetAccent` for `Color("$widgetBackground")`
   / `Color("$accent")` (or whatever they're actually named).
5. **Apple Team ID / signing.** `eas.json` already has
   `appleTeamId: "24MJR4SVPV"` for submission, but the widget target's own
   code signing hasn't been confirmed to inherit that correctly — check the
   Signing & Capabilities tab for the new target in Xcode.
