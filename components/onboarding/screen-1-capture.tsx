import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import {
  onboardingStyles,
  ONBOARDING_COLORS,
  ANIMATION_TIMINGS,
} from "./onboarding-styles";

export function Screen1Capture({ isActive = true }: { isActive?: boolean }) {
  const shutterScale = useSharedValue(0);
  const shutterRotation = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Reset values to initial state
    shutterScale.value = 0;
    shutterRotation.value = 0;
    contentOpacity.value = 0;

    // Shutter opening animation
    shutterScale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });

    shutterRotation.value = withTiming(360, {
      duration: ANIMATION_TIMINGS.verySlow,
      easing: Easing.out(Easing.cubic),
    });

    // Content fade in after shutter
    contentOpacity.value = withSequence(
      withTiming(0, { duration: 400 }),
      withTiming(1, { duration: ANIMATION_TIMINGS.medium }),
    );
  }, [isActive]);

  const shutterStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shutterScale.value },
      { rotate: `${shutterRotation.value}deg` },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={onboardingStyles.container}>
      {/* Hero Visual - Camera Shutter */}
      <View style={onboardingStyles.heroContainer}>
        <Animated.View style={shutterStyle}>
          <Svg width="200" height="200" viewBox="0 0 200 200">
            {/* Outer circle */}
            <Circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={ONBOARDING_COLORS.primary}
              strokeWidth="3"
            />

            {/* Shutter blades */}
            {[0, 60, 120, 180, 240, 300].map((angle, index) => (
              <Path
                key={index}
                d={`M 100 100 L ${100 + 80 * Math.cos((angle * Math.PI) / 180)} ${
                  100 + 80 * Math.sin((angle * Math.PI) / 180)
                } A 80 80 0 0 1 ${100 + 80 * Math.cos(((angle + 60) * Math.PI) / 180)} ${
                  100 + 80 * Math.sin(((angle + 60) * Math.PI) / 180)
                } Z`}
                fill={ONBOARDING_COLORS.primaryLight}
                opacity={0.6}
              />
            ))}

            {/* Center circle */}
            <Circle cx="100" cy="100" r="30" fill={ONBOARDING_COLORS.primary} />
            <Circle
              cx="100"
              cy="100"
              r="20"
              fill={ONBOARDING_COLORS.background}
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Content */}
      <Animated.View style={[onboardingStyles.contentContainer, contentStyle]}>
        <Text style={onboardingStyles.title}>
          Capture Your Moments, Every Day
        </Text>
        <Text style={onboardingStyles.subtitle}>
          Snap photos or import memories you love. Build your personal timeline,
          one memory at a time.
        </Text>
        <Text style={onboardingStyles.microcopy}>Private. Local. Yours.</Text>
      </Animated.View>
    </View>
  );
}
