import React, { useRef } from "react";
import { Linking, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User as UserIcon } from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";

import { BrandingSection } from "@/components/settings/branding-section";
import { ExportSection } from "@/components/settings/export-section";
import { ThemeSection } from "@/components/settings/theme-section";
import { SettingsTips } from "@/components/settings/settings-tips";
import { UserManagementSheet } from "@/components/settings/user-management-sheet";

import { useSettingsData } from "@/hooks/use-settings-data";
import { useUserManagement } from "@/hooks/use-user-management";
import { useExportData } from "@/hooks/use-export-data";
import { APP_CONFIG } from "@/constants";
import * as Haptics from "expo-haptics";

export default function Settings() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const {
    currentTheme,
    currentThemeMode,
    isDarkMode,
    handleThemeChange,
    handleThemeModeChange,
  } = useSettingsData();

  const {
    currentUser,
    allUsers,
    handleSwitchUser,
    handleAddUser,
    handleDeleteUser,
  } = useUserManagement();

  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    isExporting,
    exportProgress,
    handleExport,
    goToPreviousYear,
    goToNextYear,
  } = useExportData();

  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={["top"]}>
      <VStack className="flex-1">
        {/* Header */}
        <HStack className="items-center justify-between px-4 py-4 bg-background-0">
          <Text className="text-xl font-bold text-typography-900">
            Settings
          </Text>
          <Pressable
            onPress={() => bottomSheetRef.current?.expand()}
            className="w-10 h-10 rounded-full bg-primary-50/10 items-center justify-center border border-outline-100"
          >
            {currentUser?.avatar ? (
              <Text className="text-primary-700 font-bold text-base">
                {currentUser.avatar}
              </Text>
            ) : (
              <Icon as={UserIcon} size="md" className="text-primary-600" />
            )}
          </Pressable>
        </HStack>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <BrandingSection />
          <SettingsTips />
          <ExportSection
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            isExporting={isExporting}
            exportProgress={exportProgress}
            onExport={handleExport}
            onPrevYear={goToPreviousYear}
            onNextYear={goToNextYear}
          />
          <ThemeSection
            currentTheme={currentTheme}
            currentThemeMode={currentThemeMode}
            onThemeChange={handleThemeChange}
            onThemeModeChange={handleThemeModeChange}
          />

          <Box className="items-center mb-10">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(APP_CONFIG.WEBSITE);
              }}
              className="mt-1 active:opacity-60"
            >
              <HStack className="items-center gap-1">
                <Text className="text-xs text-typography-400">Built by</Text>
                <Text className="text-xs font-semibold text-typography-600 underline">
                  {APP_CONFIG.WEBSITE_DISPLAY}
                </Text>
              </HStack>
            </Pressable>
          </Box>
        </ScrollView>
      </VStack>

      <UserManagementSheet
        bottomSheetRef={bottomSheetRef}
        isDarkMode={isDarkMode}
        allUsers={allUsers}
        currentUser={currentUser}
        onAddUser={handleAddUser}
        onSwitchUser={(userId) =>
          handleSwitchUser(userId, () => bottomSheetRef.current?.close())
        }
        onDeleteUser={handleDeleteUser}
      />
    </SafeAreaView>
  );
}
