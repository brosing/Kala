import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import {
  onboardingStyles,
  ONBOARDING_COLORS,
  ANIMATION_TIMINGS,
} from "./onboarding-styles";

const USE_CASES = [
  { emoji: "📸", label: "Photography\nPractice", angle: 0 },
  { emoji: "📝", label: "Journaling", angle: 90 },
  { emoji: "🎨", label: "Mood\nLogging", angle: 180 },
  { emoji: "📖", label: "Life\nDocumenting", angle: 270 },
];

export function Screen4Journey({ isActive = true }: { isActive?: boolean }) {
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    contentOpacity.value = 0;
    contentOpacity.value = withDelay(
      800,
      withTiming(1, { duration: ANIMATION_TIMINGS.medium }),
    );
  }, [isActive]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={onboardingStyles.container}>
      {/* Hero Visual - Orbiting Cards */}
      <View style={onboardingStyles.heroContainer}>
        <View style={styles.orbitContainer}>
          {USE_CASES.map((useCase, index) => (
            <UseCaseCard
              key={index}
              emoji={useCase.emoji}
              label={useCase.label}
              angle={useCase.angle}
              index={index}
              isActive={isActive}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[onboardingStyles.contentContainer, contentStyle]}>
        <Text style={onboardingStyles.title}>Perfect for Any Journey</Text>
        <Text style={onboardingStyles.subtitle}>
          Whether you&apos;re exploring photography or tracking life&apos;s
          little moments, Kala adapts to you.
        </Text>
        <Text style={onboardingStyles.microcopy}>
          One photo a day builds a powerful story.
        </Text>
      </Animated.View>
    </View>
  );
}

function UseCaseCard({
  emoji,
  label,
  angle,
  index,
  isActive,
}: {
  emoji: string;
  label: string;
  angle: number;
  index: number;
  isActive: boolean;
}) {
  const rotation = useSharedValue(angle);
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Reset values
    rotation.value = angle;
    scale.value = 0;
    translateY.value = 0;

    // Initial pop-in animation with stagger
    scale.value = withDelay(
      index * 100,
      withSpring(1, {
        damping: 10,
        stiffness: 100,
      }),
    );

    // Gentle orbital rotation
    rotation.value = withDelay(
      index * 100,
      withRepeat(
        withTiming(angle + 360, {
          duration: 8000,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );

    // Gentle floating motion
    translateY.value = withDelay(
      index * 100,
      withRepeat(
        withTiming(10, {
          duration: 2000 + index * 200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
  }, [isActive]);

  const cardStyle = useAnimatedStyle(() => {
    const radius = 100;
    const rad = (rotation.value * Math.PI) / 180;

    return {
      transform: [
        { translateX: Math.cos(rad) * radius },
        { translateY: Math.sin(rad) * radius + translateY.value },
        { scale: scale.value },
        { rotate: `${-rotation.value}deg` }, // Counter-rotate to keep text upright
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orbitContainer: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: 100,
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ONBOARDING_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.glow,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: ONBOARDING_COLORS.text,
    textAlign: "center",
    lineHeight: 14,
  },
});
