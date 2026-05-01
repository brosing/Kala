import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import {
  onboardingStyles,
  ONBOARDING_COLORS,
  ANIMATION_TIMINGS,
} from "./onboarding-styles";

export function Screen3Voice({ isActive = true }: { isActive?: boolean }) {
  const cardTranslateY = useSharedValue(100);
  const editorTranslateY = useSharedValue(100);
  const editorOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Reset values
    cardTranslateY.value = 70;
    editorTranslateY.value = 70;
    editorOpacity.value = 0;
    iconScale.value = 0;
    contentOpacity.value = 0;

    // Photo card slides up
    cardTranslateY.value = withSpring(0, {
      damping: 10,
      stiffness: 80,
    });

    // Editor slides up after card
    editorTranslateY.value = withDelay(
      300,
      withSpring(0, {
        damping: 10,
        stiffness: 80,
      }),
    );

    editorOpacity.value = withDelay(
      300,
      withTiming(1, { duration: ANIMATION_TIMINGS.medium }),
    );

    // Icons pulse briefly
    iconScale.value = withDelay(
      600,
      withSequence(
        withSpring(1.2, { damping: 24 }),
        withSpring(1, { damping: 24 }),
      ),
    );

    // Content fades in
    contentOpacity.value = withDelay(
      400,
      withTiming(1, { duration: ANIMATION_TIMINGS.medium }),
    );
  }, [isActive]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const editorStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: editorTranslateY.value }],
    opacity: editorOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={onboardingStyles.container}>
      {/* Hero Visual - Photo Card + Editor */}
      <View style={onboardingStyles.heroContainer}>
        <View style={styles.heroContent}>
          {/* Photo Card */}
          <Animated.View style={[styles.photoCard, cardStyle]}>
            <View style={styles.photoPlaceholder} />
          </Animated.View>

          {/* Markdown Editor Preview */}
          <Animated.View style={[styles.editorContainer, editorStyle]}>
            <View style={styles.editorToolbar}>
              <Animated.View style={[styles.iconButton, iconStyle]}>
                <Text style={styles.iconText}>B</Text>
              </Animated.View>
              <Animated.View style={[styles.iconButton, iconStyle]}>
                <Text style={styles.iconTextItalic}>I</Text>
              </Animated.View>
              <Animated.View style={[styles.iconButton, iconStyle]}>
                <Text style={styles.iconText}>≡</Text>
              </Animated.View>
            </View>
            <View style={styles.editorContent}>
              <Text style={styles.editorText}>Add your thoughts...</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[onboardingStyles.contentContainer, contentStyle]}>
        <Text style={onboardingStyles.title}>Give Your Photos a Voice</Text>
        <Text style={onboardingStyles.subtitle}>
          Add Markdown notes to reflect, remember, and enrich each moment.
        </Text>
        <Text style={onboardingStyles.microcopy}>
          Your thoughts matter as much as the photo.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContent: {
    alignItems: "center",
    gap: 16,
  },
  photoCard: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: ONBOARDING_COLORS.calm,
    opacity: 0.3,
  },
  editorContainer: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  editorToolbar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ONBOARDING_COLORS.glow,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 16,
    fontWeight: "700",
    color: ONBOARDING_COLORS.primary,
  },
  iconTextItalic: {
    fontSize: 16,
    fontWeight: "700",
    fontStyle: "italic",
    color: ONBOARDING_COLORS.primary,
  },
  editorContent: {
    padding: 16,
  },
  editorText: {
    fontSize: 15,
    color: ONBOARDING_COLORS.textMuted,
    fontStyle: "italic",
  },
});
