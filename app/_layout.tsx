import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  DeviceEventEmitter,
  Platform,
  StyleSheet,
  View,
  AppState,
} from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { FloatingActionButton } from "@/components/floating-action-button";
import { storage } from "@/services/storage";
import { PhotoSource } from "@/types/photo";
import { ExtensionStorage } from "@bacons/apple-targets";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

const APP_GROUP = "group.com.mnmls.kala";

function checkPendingAction(router: ReturnType<typeof useRouter>) {
  if (Platform.OS !== "ios") return;
  try {
    const appGroupStorage = new ExtensionStorage(APP_GROUP);
    const action = appGroupStorage.get("pendingAction");
    const date = appGroupStorage.get("pendingActionDate");
    if (action && date) {
      // Clear the flags immediately so they don't fire again
      appGroupStorage.remove("pendingAction");
      appGroupStorage.remove("pendingActionDate");
      // Navigate to the detail page with the camera action
      setTimeout(() => {
        router.push(`/detail/${date}?action=${action}` as any);
      }, 300);
    }
  } catch (e) {
    console.error("[PendingAction] Error checking pending action:", e);
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    "light",
  );
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Check for pending Control Center actions on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPendingAction(router);

        // Re-emit theme to force GluestackUIProvider to re-sync
        storage.getThemeMode().then((mode) => {
          setThemeMode((prev) => {
            // Force re-render even if value is the same
            return prev === mode ? mode : mode;
          });
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    const checkOnboarding = async () => {
      await storage.init();
      const completed = await storage.getOnboardingCompleted();
      const theme = await storage.getThemeMode();

      setOnboardingCompleted(completed);
      setThemeMode(theme);

      if (loaded) {
        SplashScreen.hideAsync();
      }
    };

    checkOnboarding();

    const sub = DeviceEventEmitter.addListener("THEME_CHANGED", (newMode) => {
      setThemeMode(newMode);
    });

    return () => sub.remove();
  }, [loaded]);

  useEffect(() => {
    if (loaded && onboardingCompleted !== null) {
      if (!onboardingCompleted) {
        router.replace("/onboarding" as any);
      } else {
        // Cold start: check if launched from Control Center shortcut
        checkPendingAction(router);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, onboardingCompleted]);

  if (!loaded || onboardingCompleted === null) {
    return null;
  }

  return <RootLayoutNav themeMode={themeMode} />;
}

function RootLayoutNav({
  themeMode,
}: {
  themeMode: "light" | "dark" | "system";
}) {
  const { colorScheme: nativeWindColorScheme } = useNativeWindColorScheme();
  const colorMode =
    themeMode === "system"
      ? nativeWindColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;
  const pathname = usePathname();
  const router = useRouter();

  const isMainScreen =
    pathname === "/" || pathname === "/index" || pathname === "/settings";
  const isHome = pathname === "/" || pathname === "/index";

  const handleFabAction = (action: PhotoSource) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    router.push(`/detail/${todayStr}?action=${action}`);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GluestackUIProvider mode={themeMode}>
        <ThemeProvider value={colorMode === "dark" ? DarkTheme : DefaultTheme}>
          <View style={styles.container}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />
            {isMainScreen && (
              <>
                {isHome && (
                  <FloatingActionButton onSelectAction={handleFabAction} />
                )}
                <BottomNavBar />
              </>
            )}
          </View>
          <StatusBar style={colorMode === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
