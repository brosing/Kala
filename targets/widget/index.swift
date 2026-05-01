import WidgetKit
import SwiftUI

@main
struct exportWidgets: WidgetBundle {
    var body: some Widget {
        widget()
        if #available(iOS 18.0, *) {
            KalaCameraControl()
        }
    }
}
