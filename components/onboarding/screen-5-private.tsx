import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { onboardingStyles, ONBOARDING_COLORS, ANIMATION_TIMINGS } from './onboarding-styles';

export function Screen5Private({ isActive = true }: { isActive?: boolean }) {
  const lockScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Reset values
    lockScale.value = 1;
    glowOpacity.value = 0;
    contentOpacity.value = 0;

    // Breathing animation for lock
    lockScale.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.3, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Content fade in
    contentOpacity.value = withDelay(300, withTiming(1, { duration: ANIMATION_TIMINGS.medium }));
  }, [isActive]);

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={onboardingStyles.container}>
      {/* Hero Visual - Breathing Lock */}
      <View style={onboardingStyles.heroContainer}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Glow effect */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: ONBOARDING_COLORS.glow,
              },
              glowStyle,
            ]}
          />

          {/* Lock icon */}
          <Animated.View style={lockStyle}>
            <Svg width="120" height="140" viewBox="0 0 120 140">
              {/* Lock shackle */}
              <Path
                d="M 30 50 Q 30 20 60 20 Q 90 20 90 50 L 90 70"
                fill="none"
                stroke={ONBOARDING_COLORS.primary}
                strokeWidth="8"
                strokeLinecap="round"
              />
              
              {/* Lock body */}
              <Rect
                x="20"
                y="60"
                width="80"
                height="70"
                rx="12"
                fill={ONBOARDING_COLORS.primary}
              />
              
              {/* Keyhole */}
              <Path
                d="M 60 85 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0 M 56 93 L 56 110 L 64 110 L 64 93"
                fill={ONBOARDING_COLORS.background}
              />
            </Svg>
          </Animated.View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[onboardingStyles.contentContainer, contentStyle]}>
        <Text style={onboardingStyles.title}>Private by Design</Text>
        <Text style={onboardingStyles.subtitle}>
          All data lives on your device and can be exported anytime.
        </Text>
        <Text style={onboardingStyles.microcopy}>
          Your memories stay in your hands.
        </Text>
      </Animated.View>
    </View>
  );
}
