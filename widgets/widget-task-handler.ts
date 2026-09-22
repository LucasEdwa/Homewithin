// UNTESTED — scaffolded without an Android build available to verify.
// See widgets/README.md before shipping this.
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { QuickHelpWidget } from './QuickHelpWidget';

const WIDGET_NAME = 'QuickHelp';

// The widget is static (no data to refresh), so every render/update action
// just re-renders the same tree. WIDGET_CLICK isn't handled here because the
// widget uses the library's built-in OPEN_URI click action, which is
// executed natively without invoking this task handler.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetInfo.widgetName) {
    case WIDGET_NAME:
      switch (props.widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED':
          props.renderWidget(React.createElement(QuickHelpWidget));
          break;
        case 'WIDGET_DELETED':
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
}
