import { useState, useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import * as Haptics from "expo-haptics";
import { storage } from "@/services/storage";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type ThemeType = "minimal" | "super-minimal";
export type ThemeMode = "light" | "dark" | "system";

export function useSettingsData() {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>("minimal");
  const [currentThemeMode, setCurrentThemeMode] = useState<ThemeMode>("light");
  
  const colorScheme = useColorScheme();
  const isDarkMode =
    currentThemeMode === "system"
      ? colorScheme === "dark"
      : currentThemeMode === "dark";

  useEffect(() => {
    const loadSettings = async () => {
      const theme = await storage.getHomeTheme();
      const mode = await storage.getThemeMode();
      
      setCurrentTheme(theme as ThemeType);
      setCurrentThemeMode(mode as ThemeMode);
    };
    loadSettings();
  }, []);

  const handleThemeChange = async (theme: ThemeType) => {
    Haptics.selectionAsync();
    setCurrentTheme(theme);
    await storage.setHomeTheme(theme);
  };

  const handleThemeModeChange = async (mode: ThemeMode) => {
    Haptics.selectionAsync();
    setCurrentThemeMode(mode);
    await storage.setThemeMode(mode);
    DeviceEventEmitter.emit("THEME_CHANGED", mode);
  };

  return {
    currentTheme,
    currentThemeMode,
    isDarkMode,
    handleThemeChange,
    handleThemeModeChange,
  };
}
