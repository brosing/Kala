import React, { useState, useCallback, useEffect } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Image } from "@/components/ui/image";
import { CalendarGrid } from "@/components/calendar-grid";
import { YearSelectorModal } from "@/components/year-selector-modal";
import { storage } from "@/services/storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceEventEmitter, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";

import { MONTH_NAMES, WEEKDAYS_SHORT } from "@/constants";
import { processEntries } from "@/utils/entry-processing";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const ANIMATION_DURATION = 200;

export default function Home() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<
    Record<string, { photoCount: number; thumbnails: string[] }>
  >({});
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [theme, setTheme] = useState<"minimal" | "super-minimal" | null>(null);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [highlightToday, setHighlightToday] = useState(false);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "RESET_TO_TODAY",
      () => {
        setCurrentDate(new Date());
        setHighlightToday(true);
        // Turn off highlight after some time
        setTimeout(() => setHighlightToday(false), 2000);
      },
    );

    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
      loadTheme();
    }, [year, month]),
  );

  const loadTheme = async () => {
    const storedTheme = await storage.getHomeTheme();
    setTheme(storedTheme);
  };

  const loadEntries = async () => {
    try {
      const prevMonth = new Date(year, month - 1);
      const nextMonth = new Date(year, month + 1);

      // Performance Optimization: Batch month requests using multiGet instead of Promise.all
      // to avoid triggering multiple concurrent JS-to-Native bridge crossings.
      const combinedEntries = await storage.getEntriesForMonths([
        { year: prevMonth.getFullYear(), month: prevMonth.getMonth() },
        { year, month },
        { year: nextMonth.getFullYear(), month: nextMonth.getMonth() },
      ]);

      const entryMap = processEntries(combinedEntries);
      setEntries(entryMap);
    } catch (error) {
      console.error("Failed to load entries:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const today = new Date();
      const isCurrentOrFuture =
        prev.getFullYear() > today.getFullYear() ||
        (prev.getFullYear() === today.getFullYear() &&
          prev.getMonth() >= today.getMonth());

      if (isCurrentOrFuture) return prev;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const changeMonthWithAnimation = useCallback(
    (direction: "up" | "down") => {
      if (isAnimating) return;
      setIsAnimating(true);

      const slideDistance = SCREEN_HEIGHT * 0.4;
      const exitDirection = direction === "up" ? -slideDistance : slideDistance;
      const enterDirection =
        direction === "up" ? slideDistance : -slideDistance;

      const animationConfig = {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      };

      // Fade out, slide out, change month, reset position, slide in, fade in
      opacity.value = withSequence(
        withTiming(0, animationConfig),
        withTiming(0, { duration: 0 }),
        withTiming(1, animationConfig),
      );

      translateY.value = withSequence(
        withTiming(exitDirection, animationConfig),
        withTiming(exitDirection, { duration: 0 }, () => {
          runOnJS(direction === "up" ? goToNextMonth : goToPreviousMonth)();
        }),
        withTiming(enterDirection, { duration: 0 }),
        withTiming(0, animationConfig, () => {
          runOnJS(setIsAnimating)(false);
        }),
      );
    },
    [isAnimating],
  );

  const goToPreviousYear = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() - 1);
      return newDate;
    });
  }, []);

  const goToNextYear = useCallback(() => {
    setCurrentDate((prev) => {
      const currentYear = new Date().getFullYear();
      if (prev.getFullYear() >= currentYear) return prev;
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + 1);
      return newDate;
    });
  }, []);

  const yearTranslateY = useSharedValue(0);
  const yearOpacity = useSharedValue(1);

  const yearAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: yearTranslateY.value }],
    opacity: yearOpacity.value,
  }));

  const yearSwipe = Gesture.Pan()
    .activeOffsetY([-20, 20])
    .onEnd((event) => {
      if (Math.abs(event.translationY) < 20) return;
      const direction = event.translationY < 0 ? "up" : "down";
      if (direction === "up" && year >= new Date().getFullYear()) return;
      const exit = direction === "up" ? -20 : 20;
      const enter = direction === "up" ? 20 : -20;

      yearOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 100 }),
      );
      yearTranslateY.value = withSequence(
        withTiming(exit, { duration: 100 }),
        withTiming(exit, { duration: 0 }, () => {
          runOnJS(direction === "up" ? goToNextYear : goToPreviousYear)();
        }),
        withTiming(enter, { duration: 0 }),
        withTiming(0, { duration: 100 }),
      );
    });

  // Optimization: Memoize this handler to prevent unnecessary re-renders of YearSelectorModal
  const handleSelectYear = useCallback((selectedYear: number) => {
    const currentYear = new Date().getFullYear();
    if (selectedYear > currentYear) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setFullYear(selectedYear);
      return newDate;
    });
  }, []);

  // Optimization: Memoize this handler to prevent unnecessary re-renders of CalendarGrid (which is heavy)
  const handleDayPress = useCallback(
    (date: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/detail/${date}`);
    },
    [router],
  );

  const calendarSwipe = Gesture.Pan()
    .activeOffsetY([-20, 20])
    .onUpdate((event) => {
      translateY.value = event.translationY * 0.5; // Resists a bit for better feel
      opacity.value = 1 - Math.abs(event.translationY) / (SCREEN_HEIGHT * 0.8);
    })
    .onEnd((event) => {
      const threshold = 60;
      const velocityThreshold = 500;

      if (
        event.translationY < -threshold ||
        event.velocityY < -velocityThreshold
      ) {
        const today = new Date();
        if (
          year > today.getFullYear() ||
          (year === today.getFullYear() && month >= today.getMonth())
        ) {
          translateY.value = withTiming(0, { duration: 200 });
          opacity.value = withTiming(1, { duration: 200 });
          return;
        }
        runOnJS(changeMonthWithAnimation)("up");
      } else if (
        event.translationY > threshold ||
        event.velocityY > velocityThreshold
      ) {
        runOnJS(changeMonthWithAnimation)("down");
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
      }
    });

  const composed = Gesture.Exclusive(calendarSwipe);

  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={["top"]}>
      {theme ? (
        <VStack className="flex-1">
          {/* Header */}
          <HStack className="justify-between items-center px-4 py-4 border-b border-outline-200 bg-background-0">
            <GestureDetector gesture={yearSwipe}>
              <Animated.View>
                <Pressable
                  onPress={() => setIsYearModalOpen(true)}
                  className="flex-row items-center gap-2"
                >
                  <Animated.View style={yearAnimatedStyle}>
                    <Text className="text-2xl font-bold text-typography-900">
                      {year}
                    </Text>
                  </Animated.View>
                </Pressable>
              </Animated.View>
            </GestureDetector>

            <HStack space="sm" className="items-center">
              <Pressable
                onPress={goToPreviousMonth}
                className="p-2 rounded-full bg-background-100"
              >
                <Icon as={ChevronLeft} size="md" />
              </Pressable>

              <Animated.View>
                <Text className="text-xl font-semibold text-typography-900 min-w-[120px] text-center">
                  {MONTH_NAMES[month]}
                </Text>
              </Animated.View>

              {(() => {
                const today = new Date();
                const isNextDisabled =
                  year > today.getFullYear() ||
                  (year === today.getFullYear() && month >= today.getMonth());
                return (
                  <Pressable
                    onPress={goToNextMonth}
                    disabled={isNextDisabled}
                    className={`p-2 rounded-full bg-background-100 ${isNextDisabled ? "opacity-30" : "active:bg-background-200"}`}
                  >
                    <Icon
                      as={ChevronRight}
                      size="md"
                      className={
                        isNextDisabled
                          ? "text-typography-300"
                          : "text-typography-900"
                      }
                    />
                  </Pressable>
                );
              })()}
            </HStack>
          </HStack>

          {/* Weekday headers */}
          <Box className="flex-row justify-around py-2 border-b border-outline-200 bg-background-0">
            {WEEKDAYS_SHORT.map((day) => (
              <Text
                key={day}
                className="text-sm font-medium text-typography-500 w-10 text-center"
              >
                {day}
              </Text>
            ))}
          </Box>

          {/* Calendar */}
          <GestureDetector gesture={composed}>
            <Box className="flex-1 overflow-hidden">
              <Animated.View style={animatedStyle} className="flex-1">
                <CalendarGrid
                  year={year}
                  month={month}
                  entries={entries}
                  onDayPress={handleDayPress}
                  highlightToday={highlightToday}
                  theme={theme}
                />
              </Animated.View>
            </Box>
          </GestureDetector>
        </VStack>
      ) : (
        <Box className="flex-1 bg-white items-center justify-center animate-pulse">
          <Image
            source={require("@/assets/images/splash-icon.png")}
            size="2xl"
            alt="Splash Logo"
          />
        </Box>
      )}

      <YearSelectorModal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        selectedYear={year}
        onSelectYear={handleSelectYear}
      />
    </SafeAreaView>
  );
}
