import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Screen1Capture } from "./screen-1-capture";
import { Screen2Month } from "./screen-2-month";
import { Screen3Voice } from "./screen-3-voice";
import { Screen4Journey } from "./screen-4-journey";
import { Screen5Private } from "./screen-5-private";
import { Screen6Start } from "./screen-6-start";
import { onboardingStyles, ONBOARDING_COLORS } from "./onboarding-styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ScreenComponent = React.ComponentType<any>;

const SCREENS: ScreenComponent[] = [
  Screen1Capture,
  Screen2Month,
  Screen3Voice,
  Screen4Journey,
  Screen5Private,
  Screen6Start,
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const currentIndexShared = useSharedValue(0); // Shared value for use in worklets
  const DAMPING = 30;
  const STIFFNESS = 200;

  const goToNext = () => {
    if (currentIndex < SCREENS.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      currentIndexShared.value = nextIndex;
      translateX.value = withSpring(-nextIndex * SCREEN_WIDTH, {
        damping: DAMPING,
        stiffness: STIFFNESS,
      });
    }
  };

  //   const goToPrevious = () => {
  //     if (currentIndex > 0) {
  //       const prevIndex = currentIndex - 1;
  //       setCurrentIndex(prevIndex);
  //       currentIndexShared.value = prevIndex;
  //       translateX.value = withSpring(-prevIndex * SCREEN_WIDTH, {
  //         damping: DAMPING,
  //         stiffness: STIFFNESS,
  //       });
  //     }
  //   };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      "worklet";
      const offset = -currentIndexShared.value * SCREEN_WIDTH;
      translateX.value = offset + event.translationX;
    })
    .onEnd((event) => {
      "worklet";
      const shouldGoNext =
        event.translationX < -SCREEN_WIDTH / 3 &&
        currentIndexShared.value < SCREENS.length - 1;
      const shouldGoPrev =
        event.translationX > SCREEN_WIDTH / 3 && currentIndexShared.value > 0;

      if (shouldGoNext) {
        const nextIndex = currentIndexShared.value + 1;
        currentIndexShared.value = nextIndex;
        runOnJS(setCurrentIndex)(nextIndex);
        translateX.value = withSpring(-nextIndex * SCREEN_WIDTH, {
          damping: DAMPING,
          stiffness: STIFFNESS,
        });
      } else if (shouldGoPrev) {
        const prevIndex = currentIndexShared.value - 1;
        currentIndexShared.value = prevIndex;
        runOnJS(setCurrentIndex)(prevIndex);
        translateX.value = withSpring(-prevIndex * SCREEN_WIDTH, {
          damping: DAMPING,
          stiffness: STIFFNESS,
        });
      } else {
        translateX.value = withSpring(
          -currentIndexShared.value * SCREEN_WIDTH,
          {
            damping: DAMPING,
            stiffness: STIFFNESS,
          },
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const isLastScreen = currentIndex === SCREENS.length - 1;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.screensContainer, animatedStyle]}>
          {SCREENS.map((ScreenComponent, index) => {
            const isFinalScreen = index === SCREENS.length - 1;
            const isVisible = Math.abs(index - currentIndex) <= 1; // Only render current and adjacent screens
            const isActive = index === currentIndex; // Only current screen is active

            return (
              <View key={index} style={styles.screenWrapper}>
                {isVisible &&
                  (isFinalScreen ? (
                    <ScreenComponent onStart={onComplete} isActive={isActive} />
                  ) : (
                    <ScreenComponent isActive={isActive} />
                  ))}
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Pagination Dots */}
        <View style={onboardingStyles.paginationContainer}>
          {SCREENS.map((_, index) => (
            <View
              key={index}
              style={[
                onboardingStyles.paginationDot,
                index === currentIndex && onboardingStyles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        {!isLastScreen && (
          <View style={onboardingStyles.buttonContainer}>
            <TouchableOpacity
              style={onboardingStyles.secondaryButton}
              onPress={onComplete}
              activeOpacity={0.7}
            >
              <Text style={onboardingStyles.secondaryButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={onboardingStyles.primaryButton}
              onPress={goToNext}
              activeOpacity={0.8}
            >
              <Text style={onboardingStyles.primaryButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  screensContainer: {
    flexDirection: "row",
    flex: 1,
  },
  screenWrapper: {
    width: SCREEN_WIDTH,
  },
  bottomControls: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
});
