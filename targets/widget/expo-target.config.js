// UNTESTED — scaffolded without Xcode available to build/verify. See
// targets/widget/README.md for what still needs to be checked by hand.
//
// Deliberately named/branded neutrally ("Quick Help", not "HomeWithin
// Emergency"): this tile sits permanently on the user's home screen, visible
// to anyone who picks up the phone — a bigger exposure risk than a
// transient push notification, so it gets at least the same treatment as
// the notification-content fix (no LGBTQ+-identifying text or imagery).
/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  // No underscores/spaces: @bacons/apple-targets derives two different
  // internal identifiers from this string — the raw value becomes the
  // Xcode target's `name`, while a sanitized (non-word-chars-and-underscores
  // stripped) copy becomes its `productName`, which EAS Build's
  // credentials-setup step looks targets up by. "quick_help_widget" made
  // those two diverge ("quick_help_widget" vs "quickhelpwidget"), so EAS
  // could set up credentials but then couldn't find the target it just
  // configured ("Could not find target 'quickhelpwidget' in project.pbxproj").
  // Keeping this alphanumeric-only makes both forms identical.
  name: "quickhelpwidget",
  displayName: "Quick Help",
  deploymentTarget: "15.1",
  frameworks: ["SwiftUI"],
  // Affects only the OS widget-gallery/configuration chrome, not the
  // rendered widget itself — widgets.swift uses inline hex colors instead
  // of referencing these named assets (see comment there for why).
  colors: {
    $widgetBackground: { color: "#0F0D0C", darkColor: "#0F0D0C" },
    $accent: "#D9534F",
  },
};
