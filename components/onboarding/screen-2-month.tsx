import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { onboardingStyles, ONBOARDING_COLORS } from "./onboarding-styles";

const GRID_ROWS = 5;
const GRID_COLS = 7;
const CELL_SIZE = 40;
const CELL_GAP = 6;

export function Screen2Month({ isActive = true }: { isActive?: boolean }) {
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    contentOpacity.value = 0;
    contentOpacity.value = withDelay(200, withSpring(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={onboardingStyles.container}>
      {/* Hero Visual - Calendar Grid */}
      <View style={onboardingStyles.heroContainer}>
        <View style={styles.calendarContainer}>
          {/* Day labels */}
          <View style={styles.dayLabelsRow}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <Text key={index} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar cells */}
          <View style={styles.gridContainer}>
            {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, index) => (
              <CalendarCell key={index} index={index} isActive={isActive} />
            ))}
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[onboardingStyles.contentContainer, contentStyle]}>
        <Text style={onboardingStyles.title}>Your Month, Illustrated</Text>
        <Text style={onboardingStyles.subtitle}>
          See your month at a glance with a photo preview for every day.
        </Text>
        <Text style={onboardingStyles.microcopy}>
          Tap any day to open or update your entry.
        </Text>
      </Animated.View>
    </View>
  );
}

function CalendarCell({
  index,
  isActive,
}: {
  index: number;
  isActive: boolean;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Reset values
    scale.value = 0;
    opacity.value = 0;

    // Staggered animation - cells appear one by one
    const delay = index * 30; // 30ms delay between each cell

    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 150,
      }),
    );

    opacity.value = withDelay(delay, withSpring(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isActive]);

  const cellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Some cells have "photos" (colored backgrounds)
  const hasPhoto = index % 3 === 0 || index % 5 === 0;

  return (
    <Animated.View
      style={[styles.cell, hasPhoto && styles.cellWithPhoto, cellStyle]}
    >
      {hasPhoto && (
        <View
          style={[
            styles.photoPlaceholder,
            { backgroundColor: getPhotoColor(index) },
          ]}
        />
      )}
    </Animated.View>
  );
}

function getPhotoColor(index: number): string {
  const colors = [
    ONBOARDING_COLORS.primary,
    ONBOARDING_COLORS.accent,
    ONBOARDING_COLORS.calm,
    ONBOARDING_COLORS.primaryLight,
    ONBOARDING_COLORS.accentLight,
  ];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  calendarContainer: {
    alignItems: "center",
  },
  dayLabelsRow: {
    flexDirection: "row",
    gap: CELL_GAP,
    marginBottom: 12,
  },
  dayLabel: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: ONBOARDING_COLORS.textLight,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CELL_GAP,
    width: GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  cellWithPhoto: {
    borderWidth: 2,
    borderColor: ONBOARDING_COLORS.primary,
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
});
