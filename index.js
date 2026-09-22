// UNTESTED — scaffolded without an Android build available to verify.
// See widgets/README.md before shipping this.
//
// react-native-android-widget needs its headless task registered before the
// JS bundle finishes loading, so it's caught even when Android launches the
// app in the background just to redraw the widget (no UI, no _layout.tsx
// mount). package.json's "main" was changed from "expo-router/entry" to
// this file, which registers the task and then defers to the normal Expo
// Router entry for everything else.
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);

// eslint-disable-next-line import/first -- must run after the registration above
import 'expo-router/entry';
