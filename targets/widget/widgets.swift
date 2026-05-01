import WidgetKit
import SwiftUI

// Hex color support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

enum WidgetGlassStyle: String {
    case light
    case dark
    case clear
    case tinted
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), photoCount: 2)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = getLatestEntry(for: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let entry = getLatestEntry(for: Date())
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
    
    private func getLatestEntry(for date: Date) -> SimpleEntry {
        let sharedDefaults = UserDefaults(suiteName: "group.com.mnmls.kala")
        let count = sharedDefaults?.integer(forKey: "photoCount") ?? 0
        return SimpleEntry(date: date, photoCount: count)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let photoCount: Int
}

struct widgetEntryView : View {
    var entry: Provider.Entry

    // Customize the widget background appearance
    var glassStyle: WidgetGlassStyle = .dark

    var todayStr: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: entry.date)
    }

    var body: some View {
        Link(destination: URL(string: "kala:///detail/\(todayStr)?action=camera")!) {
            VStack(spacing: 8) {
                Image(systemName: "camera.badge.clock.fill")
                    .symbolRenderingMode(.monochrome)
                    .font(.system(size: 44, weight: .semibold))
                    .foregroundStyle(.primary)
                    .padding(.top, 10)
                
                Text("\(entry.photoCount) \(entry.photoCount == 1 ? "Photo" : "Photos")")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
        .widgetGlassBackground(glassStyle)
    }
}

extension View {
    func applyWidgetBackground() -> some View {
        if #available(iOS 17.0, *) {
            return self.containerBackground(for: .widget) {
                Color.clear
            }
        } else {
            return self
        }
    }
}

extension View {
    @ViewBuilder
    func widgetGlassBackground(_ style: WidgetGlassStyle) -> some View {
        if #available(iOS 17.0, *) {
            switch style {
            case .light:
                self.containerBackground(.ultraThinMaterial, for: .widget)
            case .dark:
                self.containerBackground(.regularMaterial, for: .widget)
                    .tint(.black.opacity(0.6))
            case .clear:
                self.containerBackground(for: .widget) { Color.clear }
            case .tinted:
                self.containerBackground(.thinMaterial, for: .widget)
                    .tint(Color.accentColor.opacity(0.3))
            }
        } else {
            // Fallback minimal look for older iOS
            self
        }
    }
}

struct widget: Widget {
    let kind: String = "takephoto"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
        }
        .configurationDisplayName("Kala Quick Actions")
        .description("Quickly take a photo for today.")
        .supportedFamilies([.systemSmall])
    }
}

@available(iOS 17.0, *)
#Preview(as: .systemSmall) {
    widget()
} timeline: {
    SimpleEntry(date: .now, photoCount: 0)
    SimpleEntry(date: .now, photoCount: 3)
}

