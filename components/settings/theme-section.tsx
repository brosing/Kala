import React from "react";
import { Palette } from "lucide-react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { ThemeType, ThemeMode } from "@/hooks/use-settings-data";

interface ThemeSectionProps {
  currentTheme: ThemeType;
  currentThemeMode: ThemeMode;
  onThemeChange: (theme: ThemeType) => void;
  onThemeModeChange: (mode: ThemeMode) => void;
}

export function ThemeSection({
  currentTheme,
  currentThemeMode,
  onThemeChange,
  onThemeModeChange,
}: ThemeSectionProps) {
  return (
    <VStack className="mx-4 mb-8 p-5 gap-6 bg-background-50/50 rounded-[20px] border border-outline-100">
      <HStack className="items-center gap-2">
        <Box className="bg-primary-500/10 p-2 rounded-lg">
          <Icon as={Palette} size="md" className="text-primary-600" />
        </Box>
        <Heading size="md" className="text-typography-900">
          Appearance
        </Heading>
      </HStack>

      <VStack className="gap-2">
        <Text className="text-sm font-medium text-typography-700">
          Home Screen Theme
        </Text>
        <HStack className="gap-2">
          {[
            {
              id: "minimal",
              label: "Minimal",
              description: "Previews",
            },
            {
              id: "super-minimal",
              label: "Super Minimal",
              description: "Dots only",
            },
          ].map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <Pressable
                key={theme.id}
                onPress={() => onThemeChange(theme.id as ThemeType)}
                className={`flex-1 p-3 rounded-xl border-2 ${
                  isSelected
                    ? "border-typography-900 bg-typography-900"
                    : "border-outline-100 bg-background-0"
                }`}
              >
                <VStack className="gap-0.5">
                  <Text
                    className={`text-sm font-bold ${isSelected ? "text-typography-0" : "text-typography-700"}`}
                  >
                    {theme.label}
                  </Text>
                  <Text className="text-[10px] text-typography-500">
                    {theme.description}
                  </Text>
                </VStack>
              </Pressable>
            );
          })}
        </HStack>
      </VStack>

      <VStack className="gap-2 mt-2">
        <Text className="text-sm font-medium text-typography-700">
          Color Theme
        </Text>
        <HStack className="gap-2">
          {[
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
            { id: "system", label: "System" },
          ].map((mode) => {
            const isSelected = currentThemeMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                onPress={() => onThemeModeChange(mode.id as ThemeMode)}
                className={`flex-1 p-3 rounded-xl border-2 ${
                  isSelected
                    ? "border-typography-900 bg-typography-900"
                    : "border-outline-100 bg-background-0"
                }`}
              >
                <Text
                  className={`text-sm font-bold text-center ${isSelected ? "text-typography-0" : "text-typography-700"}`}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </VStack>
    </VStack>
  );
}
