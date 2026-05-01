import React, { useMemo, useEffect, useCallback } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { Image } from "@/components/ui/image";
import { CalendarDay } from "@/types/day-entry";
import { isToday, isFutureDay, generateCalendarDays } from "@/utils/calendar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";

import { MINIMAL_QUOTES } from "@/constants";

interface CalendarGridProps {
  year: number;
  month: number;
  entries: Record<string, { photoCount: number; thumbnails?: string[] }>;
  onDayPress: (date: string) => void;
  highlightToday?: boolean;
  theme?: "minimal" | "super-minimal";
}

export interface CalendarDayCellProps {
  day: CalendarDay;
  entry?: { photoCount: number; thumbnails?: string[] };
  isToday: boolean;
  isFuture: boolean;
  theme: "minimal" | "super-minimal";
  onPress: (day: CalendarDay) => void;
  highlightStyle: any; // Animated style
  peekStyle: any; // Animated style for super-minimal
}

export const arePropsEqual = (
  prev: CalendarDayCellProps,
  next: CalendarDayCellProps,
) => {
  const isEntryEqual =
    prev.entry === next.entry ||
    (prev.entry?.photoCount === next.entry?.photoCount &&
      prev.entry?.thumbnails?.[0] === next.entry?.thumbnails?.[0]);

  return (
    prev.day === next.day &&
    isEntryEqual &&
    prev.isToday === next.isToday &&
    prev.isFuture === next.isFuture &&
    prev.theme === next.theme &&
    prev.onPress === next.onPress &&
    prev.highlightStyle === next.highlightStyle &&
    prev.peekStyle === next.peekStyle
  );
};

const CalendarDayCell = React.memo(function CalendarDayCell({
  day,
  entry,
  isToday,
  isFuture,
  theme,
  onPress,
  highlightStyle,
  peekStyle,
}: CalendarDayCellProps) {
  const isMinimal = theme === "minimal";
  const thumbnail = entry?.thumbnails?.[0];
  const hasPhoto = !!thumbnail || (entry?.photoCount || 0) > 0;

  return (
    <Pressable
      onPress={() => !isFuture && onPress(day)}
      disabled={isFuture}
      className={`flex-1 ${isFuture && isMinimal ? "bg-background-100" : ""}`}
      style={!isMinimal ? { aspectRatio: 1 } : undefined}
    >
      <Box
        className={`flex-1 w-full relative ${!day.isCurrentMonth ? "opacity-50" : ""} ${!isMinimal ? "items-center justify-center" : ""}`}
      >
        {isToday && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
              },
              highlightStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {isMinimal ? (
          /* Minimal Theme: Photo Previews */
          thumbnail ? (
            <Box className="flex-1 w-full relative">
              <Image
                source={{ uri: thumbnail }}
                className="w-full h-full rounded-sm"
                alt="Photo"
              />
              <Box className="absolute top-0 right-0 bg-background-0/70 rounded-bl-2xl py-2 pl-2 pr-1">
                <Text
                  className={`
                    text-lg leading-none font-medium
                    ${isToday ? "text-typography-900 font-bold" : "text-typography-600"}
                  `}
                >
                  {day.date}
                </Text>
              </Box>
            </Box>
          ) : (
            // Super minimal
            <Box
              className={`
                text-xs leading-none absolute top-0 right-0 p-1
                ${!day.isCurrentMonth ? "text-typography-300" : ""}
                ${isToday ? "bg-background-100 text-primary-500 font-bold" : "text-typography-900"}
                ${isFuture ? "text-typography-300" : ""}
              `}
            >
              <Box
                className={`absolute top-0 right-0 bg-background-0/70 rounded-bl-2xl py-2 pl-2 pr-1 ${isFuture ? "bg-background-100" : ""}`}
              >
                <Text
                  className={`
                    text-lg leading-none font-medium
                    ${isToday ? "text-typography-900 font-bold" : "text-typography-600"}
                  `}
                >
                  {day.date}
                </Text>
              </Box>
            </Box>
          )
        ) : (
          /* Super Minimal Theme: Dots */
          <VStack
            className={`items-center justify-center gap-1.5 ${isFuture ? "opacity-30" : ""}`}
          >
            <Box className="relative items-center justify-center">
              <Box
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  hasPhoto
                    ? isToday
                      ? "bg-[#f97316]"
                      : "bg-typography-900"
                    : isToday
                      ? "bg-[#f97316]/50"
                      : "bg-typography-300"
                }`}
              />
              <Animated.View
                style={peekStyle}
                className="absolute items-center justify-center"
              >
                <Text className="text-[10px] font-bold text-typography-0">
                  {day.date}
                </Text>
              </Animated.View>
            </Box>
          </VStack>
        )}
      </Box>
    </Pressable>
  );
}, arePropsEqual);

export const CalendarGrid = React.memo(function CalendarGrid({
  year,
  month,
  entries,
  onDayPress,
  highlightToday,
  theme = "minimal",
}: CalendarGridProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (highlightToday) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 }),
        ),
        2,
      );
    } else {
      pulse.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightToday]);

  const highlightStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(pulse.value, [0, 1], [0, 3]),
    borderColor: "#3b82f6", // primary-500
    borderRadius: theme === "super-minimal" ? 999 : 4,
    backgroundColor: interpolateColor(
      pulse.value,
      [0, 1],
      ["transparent", "rgba(59, 130, 246, 0.1)"],
    ),
  }));

  const calendarDays = useMemo(() => {
    // Optimized: generateCalendarDays no longer depends on entries
    return generateCalendarDays(year, month);
  }, [year, month]);

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const handleDayPress = useCallback(
    (day: CalendarDay) => {
      const dateStr = `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
      onDayPress(dateStr);
    },
    [onDayPress],
  );

  const today = new Date();

  const isMinimal = theme === "minimal";
  const peek = useSharedValue(0);

  const monthDiff =
    (year - today.getFullYear()) * 12 + (month - today.getMonth());
  const isCurrentMonth = monthDiff === 0;
  const isAdjacentMonth = Math.abs(monthDiff) === 1;
  const randomQuote = useMemo(() => {
    const index = Math.abs(year * 12 + month) % MINIMAL_QUOTES.length;
    return MINIMAL_QUOTES[index];
  }, [year, month]);

  const peekStyle = useAnimatedStyle(() => ({
    opacity: withTiming(peek.value, { duration: 200 }),
    transform: [{ scale: interpolate(peek.value, [0, 1], [0.8, 1]) }],
  }));

  return (
    <Box className="flex-1">
      {/* Calendar grid */}
      <Box className={isMinimal ? "flex-1" : "px-2"}>
        {weeks.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            className={`flex-row ${isMinimal ? "flex-1" : ""}`}
          >
            {week.map((day, dayIndex) => {
              const dateStr = `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
              const entry = entries[dateStr];
              const isDayToday = isToday(day, today);
              const isFuture = isFutureDay(day, today);

              return (
                <CalendarDayCell
                  key={`${weekIndex}-${dayIndex}`}
                  day={day}
                  entry={entry}
                  isToday={isDayToday}
                  isFuture={isFuture}
                  theme={theme}
                  onPress={handleDayPress}
                  highlightStyle={highlightStyle}
                  peekStyle={peekStyle}
                />
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Today's date display or Peek Tip for super-minimal theme */}
      {!isMinimal && (
        <Pressable
          onPressIn={() => (peek.value = 1)}
          onPressOut={() => (peek.value = 0)}
          className="active:opacity-70 flex-1 justify-center"
        >
          <VStack className="items-center py-8 gap-1 -translate-y-[50%]">
            {isCurrentMonth ? (
              <>
                <Text className="text-xs font-bold text-typography-400 uppercase tracking-[4px]">
                  Today
                </Text>
                <Text className="text-lg font-semibold text-typography-900">
                  {today.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </>
            ) : isAdjacentMonth ? (
              <>
                <Text className="text-xs font-bold text-typography-400 uppercase tracking-[4px]">
                  Tip
                </Text>
                <Text className="text-sm font-semibold text-typography-500 italic text-center px-4">
                  &quot;hold to reveal the secret dates! ✨&quot;
                </Text>
              </>
            ) : (
              <>
                <Text className="text-xs font-bold text-typography-400 uppercase tracking-[4px]">
                  Quote
                </Text>
                <Text className="text-sm font-semibold text-typography-500 italic text-center px-4">
                  &quot;{randomQuote}&quot;
                </Text>
              </>
            )}
          </VStack>
        </Pressable>
      )}
    </Box>
  );
});
