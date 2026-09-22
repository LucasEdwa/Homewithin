// UNTESTED — scaffolded without an Android build available to verify.
// See widgets/README.md before shipping this.
//
// Deliberately static and neutrally branded ("Quick Help", not "HomeWithin
// Emergency"): this tile sits permanently on the user's home screen, visible
// to anyone who picks up the phone — a bigger exposure risk than a
// transient push notification, so it gets the same no-LGBTQ+-identifying-
// content treatment as the notification-copy fix elsewhere in this app.
//
// Tapping it opens `homewithin://emergency` via the library's built-in
// OPEN_URI click action (handled natively, no JS task handler needed for
// the click itself). The app's own LockGate (app/_layout.tsx) already
// redirects to the PIN-lock screen first if PIN lock is enabled, and
// disguise mode's decoy still applies on top of that — this widget adds no
// new bypass of either protection.
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

const EMERGENCY_DEEP_LINK = 'homewithin://emergency';

export function QuickHelpWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: EMERGENCY_DEEP_LINK }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F0D0C',
        borderRadius: 16,
      }}
    >
      <TextWidget
        text="🛟"
        style={{ fontSize: 28, marginBottom: 6 }}
      />
      <TextWidget
        text="Quick Help"
        style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}
      />
      <TextWidget
        text="Tap for support"
        style={{ fontSize: 12, color: '#FFFFFF99' }}
      />
    </FlexWidget>
  );
}
