import AppIntents
import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct KalaCameraIntent: ControlConfigurationIntent {
    static let title: LocalizedStringResource = "Open Camera"
    static let description = IntentDescription(stringLiteral: "Open the Kala app and launch the camera.")
    static let isDiscoverable = true
    static let openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        // Write a pending action to shared UserDefaults so the app
        // can pick it up on launch and navigate to the camera screen.
        let defaults = UserDefaults(suiteName: "group.com.mnmls.kala")
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: .now)
        defaults?.set("camera", forKey: "pendingAction")
        defaults?.set(todayStr, forKey: "pendingActionDate")
        return .result()
    }
}

@available(iOS 18.0, *)
struct KalaCameraControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "takephoto-control") {
            ControlWidgetButton(action: KalaCameraIntent()) {
                Label("Camera", systemImage: "camera.badge.clock.fill")
            }
        }
        .displayName("Kala Camera")
        .description("Quickly take a photo.")
    }
}
