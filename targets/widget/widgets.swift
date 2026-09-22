// UNTESTED — scaffolded without Xcode available to build/verify.
// See targets/widget/README.md before shipping this.
//
// Deliberately static: no configuration, no user data, nothing fetched from
// the app. Tapping anywhere on the widget opens the app via the existing
// `homewithin://emergency` deep link, which the app's own LockGate
// (app/_layout.tsx) already redirects to the PIN-lock screen first if PIN
// lock is enabled, and disguise mode's decoy still applies on top of that —
// this widget adds no new bypass of either protection.
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        completion(SimpleEntry(date: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        // Static content — a single entry is enough, WidgetKit never needs to refresh it.
        completion(Timeline(entries: [SimpleEntry(date: Date())], policy: .never))
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

// Inline hex values rather than named asset-catalog colors: this target's
// generated Assets.xcassets naming can't be verified without an Xcode build
// in this environment, so inline colors are the safer, self-contained bet.
// These match HomeWithin's own dark background (constants/Colors.ts
// `warmWhite`) and alert-red accent (`alertRed`) for visual consistency.
private extension Color {
    static let widgetBackground = Color(red: 0x0F / 255, green: 0x0D / 255, blue: 0x0C / 255)
    static let widgetAccent = Color(red: 0xD9 / 255, green: 0x53 / 255, blue: 0x4F / 255)
}

struct widgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "shield.fill")
                .font(.system(size: 28))
                .foregroundStyle(Color.widgetAccent)
            Text("Quick Help")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.white)
            Text("Tap for support")
                .font(.system(size: 12))
                .foregroundStyle(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetURL(URL(string: "homewithin://emergency"))
    }
}

struct widget: Widget {
    let kind: String = "quick_help_widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            // `containerBackground` replaced plain `.background` for widgets in
            // iOS 17; the target's deploymentTarget (15.1, matching the main
            // app) means both paths are needed.
            if #available(iOS 17.0, *) {
                widgetEntryView(entry: entry)
                    .containerBackground(Color.widgetBackground, for: .widget)
            } else {
                widgetEntryView(entry: entry)
                    .background(Color.widgetBackground)
            }
        }
        .configurationDisplayName("Quick Help")
        .description("One tap to reach support resources.")
        .supportedFamilies([.systemSmall])
    }
}
