# 📸 Kala

**Kala** is a super-minimal, daily photo journal app designed to help you capture the essence of your life—one memory at a time. It focuses on simplicity, privacy, and user experience.

![App Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---
## 📱 Preview
![app preview](<ss.jpg>)

---

## ✨ Features

- **Minimalist Design**: A clean, distraction-free interface that lets your memories take center stage.
- **Smooth Calendar Navigation**:
  - Swipe up/down to navigate between months.
  - Swipe on the year header to travel through the years.
  - Double-tap Home to quickly return to today.
- **Memorable Entries**: Capture one or multiple photos each day and add personal notes to document your journey.
- **Customizable Themes**:
  - **Minimal**: Displays photo previews directly in the calendar grid.
  - **Super Minimal**: A refined dot-based view for a more abstract look.
- **Export System**: Export your entire journal as beautifully organized Markdown files, with photos bundled in date-specific folders. Perfect for long-term archiving or personal blogs.
- **Privacy First**: All your data and photos stay locally on your device. No cloud, no tracking, just your memories.

---

## 🛠️ Tech Stack

- **Core**: [Expo](https://expo.dev/) (React Native)
- **Language**: TypeScript
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS) & [Gluestack UI](https://gluestack.io/ui)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Storage**: Expo File System & Async Storage

---

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS)
- npm or yarn
- Expo Dev Client app on your mobile device (for testing)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/brosing/Kala.git
   cd Kala
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**:

   ```bash
   npx expo start
   ```

4. **Run on your device**:
   Scan the QR code with your Expo Dev Client app (Android) or Camera app (iOS).

---

## 📂 Project Structure

- `app/`: Expo Router file-based navigation.
- `components/`: UI components and layout building blocks.
- `constants/`: Configuration and static data.
- `services/`: Logic for data persistence and file management.
- `assets/`: App icons, splash screens, and images.
- `types/`: TypeScript definitions.

---

## 📜 Development Notes & Roadmap

The development of Kala focused on creating a "Super Minimal" experience. The challenge was balancing extreme simplicity with the power of modern mobile features like shared element transitions and high-performance list rendering.

### Completed:

- [x] Smooth month/year transition animations.
- [x] Local image persistence and retrieval.
- [x] Markdown-based export system.
- [x] Theme system (Minimal vs Super Minimal).
- [x] Onboarding flow.
- [x] Multiple "Journals" support.
- [x] Multiple "Sections" within a day support.

### Future Roadmap:

- [ ] iCloud/Google Drive backup support.
- [ ] Biometric lock (FaceID/TouchID).
- [ ] Interactive Widgets for the home screen.

---

## Additional Commands

- eas build --local --platform ios --profile development (check first for ios simulator or not)
- eas build --local --platform ios --profile preview

## 🤝 Project by [mnmls.net](https://mnmls.net)

Built with ❤️ for those who appreciate the beauty in every day.
