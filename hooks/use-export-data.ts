import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { storage } from "@/services/storage";
import { DayEntry } from "@/types/day-entry";
import { MONTH_NAMES } from "@/constants";
import { prepareExport } from "@/utils/export-utils";

export function useExportData() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const performExport = async (
    monthEntriesArr: Record<string, DayEntry>,
    folderName: string,
    title: string,
  ) => {
    const user = await storage.getCurrentUser();
    const result = await prepareExport(
      monthEntriesArr,
      folderName,
      setExportProgress,
      user?.name,
    );

    if (result.status === "no_data") {
      Alert.alert("No Data", `No entries found for ${title}.`);
      return;
    }

    if (result.status === "success" && result.exportDir) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(result.exportDir, {
          mimeType: "application/octet-stream",
          dialogTitle: `Export ${title}`,
          UTI: "public.folder",
        });
      } else {
        Alert.alert(
          "Export Complete",
          `Files saved to app cache. Sharing is not available on this device.`,
        );
      }

      Alert.alert(
        "Success",
        `Exported ${result.exportedCount} day(s) with photos and/or notes for ${title}.`,
      );
    }
  };

  const handleExport = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      const monthEntriesArr = await storage.getEntriesForMonth(
        selectedYear,
        selectedMonth,
      );

      const mm = String(selectedMonth + 1).padStart(2, "0");
      await performExport(
        monthEntriesArr,
        `${selectedYear}-${mm}`,
        `${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
      );
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        "An error occurred while exporting. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [selectedMonth, selectedYear]);

  const goToPreviousYear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedYear((y) => y - 1);
  };

  const goToNextYear = () => {
    const currentYear = new Date().getFullYear();
    if (selectedYear < currentYear) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedYear((y) => y + 1);
    }
  };

  return {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    isExporting,
    exportProgress,
    handleExport,
    goToPreviousYear,
    goToNextYear,
  };
}
