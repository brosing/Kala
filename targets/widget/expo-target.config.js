/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "widget",
  name: "takephoto",
  displayName: "Kala Capture Today",
  deploymentTarget: "15.1",
  bundleIdentifier: ".takephoto",
  frameworks: ["SwiftUI", "WidgetKit", "AppIntents"],
  entitlements: {
    "com.apple.security.application-groups": [
      `group.${config.ios.bundleIdentifier}`
    ],
  },
});