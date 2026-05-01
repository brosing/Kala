import React from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react-native";
import {
  PanGestureHandler,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MONTH_NAMES, MONTH_NAMES_SHORT } from "@/constants";

interface ExportSectionProps {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  isExporting: boolean;
  exportProgress: number;
  onExport: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}

export function ExportSection({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  isExporting,
  exportProgress,
  onExport,
  onPrevYear,
  onNextYear,
}: ExportSectionProps) {
  const now = new Date();

  const handleYearGesture = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX > 50) {
        onPrevYear();
      } else if (translationX < -50) {
        onNextYear();
      }
    }
  };

  const monthlyButtonStyle = useAnimatedStyle(() => {
    const duration = 300;

    return {
      flex: 1,
      opacity: 1,
      transform: [{ scale: withTiming(isExporting ? 0.98 : 1, { duration }) }],
    };
  });

  return (
    <VStack className="mx-4 mb-6 p-5 gap-6 bg-background-50/50 rounded-[20px] border border-outline-100">
      <HStack className="items-center gap-2">
        <Box className="bg-primary-500/10 p-2 rounded-lg">
          <Icon as={Download} size="md" className="text-primary-600" />
        </Box>
        <Heading size="md" className="text-typography-900">
          Export Data
        </Heading>
      </HStack>

      <Text className="text-sm text-typography-500">
        Export your daily photos and notes as Markdown files organized by date.
        Each day gets its own folder with a .md file and photos.
      </Text>

      {/* Year Picker */}
      <VStack className="gap-2">
        <Text className="text-sm font-medium text-typography-700">Year</Text>
        <PanGestureHandler onHandlerStateChange={handleYearGesture}>
          <HStack className="items-center justify-between bg-background-50 rounded-xl border border-outline-200 px-4 py-3">
            <Pressable onPress={onPrevYear} className="p-1">
              <Icon
                as={ChevronLeft}
                size="md"
                className="text-typography-600"
              />
            </Pressable>
            <Text className="text-lg font-semibold text-typography-900">
              {selectedYear}
            </Text>
            <Pressable
              onPress={onNextYear}
              className="p-1"
              disabled={selectedYear >= now.getFullYear()}
            >
              <Icon
                as={ChevronRight}
                size="md"
                className={
                  selectedYear >= now.getFullYear()
                    ? "text-typography-300"
                    : "text-typography-600"
                }
              />
            </Pressable>
          </HStack>
        </PanGestureHandler>
      </VStack>

      {/* Month Picker */}
      <VStack className="gap-2">
        <Text className="text-sm font-medium text-typography-700">Month</Text>
        <Box className="flex-row flex-wrap gap-2">
          {MONTH_NAMES.map((name, index) => {
            const isSelected = index === selectedMonth;
            const isFuture =
              selectedYear === now.getFullYear() && index > now.getMonth();
            return (
              <Pressable
                key={name}
                onPress={() => {
                  if (!isFuture) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMonth(index);
                  }
                }}
                disabled={isFuture}
                className={`px-3 py-2 rounded-lg border ${
                  isSelected
                    ? "bg-typography-900 border-typography-900"
                    : isFuture
                      ? "bg-background-0 border-outline-50 opacity-40"
                      : "bg-background-0 border-outline-200"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-typography-0"
                      : isFuture
                        ? "text-typography-300"
                        : "text-typography-700"
                  }`}
                >
                  {MONTH_NAMES_SHORT[index]}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </VStack>

      {/* Export Button */}
      <HStack className="w-full items-center h-12">
        <Animated.View style={monthlyButtonStyle} className="w-full">
          <Pressable
            onPress={onExport}
            disabled={isExporting}
            className={`w-full rounded-xl py-3 items-center border-2 border-typography-900 flex-row justify-center gap-3 ${
              isExporting ? "bg-typography-400 border-typography-400" : "bg-typography-900"
            }`}
          >
            <Icon as={Download} size="md" className="text-typography-0" />
            <Text className="text-base font-semibold text-typography-0">
              {isExporting
                ? `Exporting (${exportProgress}%)...`
                : `Export ${MONTH_NAMES_SHORT[selectedMonth]} ${selectedYear}`}
            </Text>
          </Pressable>
        </Animated.View>
      </HStack>
    </VStack>
  );
}
