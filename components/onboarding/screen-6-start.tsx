import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ONBOARDING_COLORS, ANIMATION_TIMINGS } from './onboarding-styles';

export function Screen6Start({ onStart, isActive = true }: { onStart: () => void; isActive?: boolean }) {
  const tileScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Reset values
    tileScale.value = 0;
    glowOpacity.value = 0;
    contentOpacity.value = 0;
    buttonScale.value = 0;

    // Tile appears
    tileScale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });

    // Glow pulse
    glowOpacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(0.6, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.3, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    // Content fades in
    contentOpacity.value = withDelay(300, withTiming(1, { duration: ANIMATION_TIMINGS.medium }));

    // Button pops in
    buttonScale.value = withDelay(
      600,
      withSpring(1, {
        damping: 25,
        stiffness: 150,
      })
    );
  }, [isActive]);

  const tileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tileScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Hero Visual - Day 1 Tile */}
      <View style={styles.heroContainer}>
        <View style={styles.tileContainer}>
          {/* Glow effect */}
          <Animated.View style={[styles.glowEffect, glowStyle]} />

          {/* Day 1 Tile */}
          <Animated.View style={[styles.dayTile, tileStyle]}>
            <Text style={styles.dayNumber}>1</Text>
            <Text style={styles.dayLabel}>DAY</Text>
          </Animated.View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.contentContainer, contentStyle]}>
        <Text style={styles.title}>Start Your First Day</Text>
        <Text style={styles.subtitle}>
          Create your first entry and begin building your visual journal.
        </Text>

        {/* Primary Button */}
        <Animated.View style={[styles.buttonWrapper, buttonStyle]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStart}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Start Capturing</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.microcopy}>
          You can always edit or add more later.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  tileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 32,
    backgroundColor: ONBOARDING_COLORS.glow,
  },
  dayTile: {
    width: 180,
    height: 180,
    borderRadius: 32,
    backgroundColor: ONBOARDING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ONBOARDING_COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  dayNumber: {
    fontSize: 80,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 80,
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.95,
    letterSpacing: 3,
    marginTop: 8,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: ONBOARDING_COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: ONBOARDING_COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ONBOARDING_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  microcopy: {
    fontSize: 13,
    color: ONBOARDING_COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
