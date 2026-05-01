import React, { useCallback } from "react";
import { useColorScheme } from "nativewind";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Plus, Camera, Image } from "lucide-react-native";
import { PhotoSource } from "@/types/photo";

const FAB_SIZE = 56;
const OPTION_HEIGHT = 44;
const OPTION_GAP = 12;
const SPRING_CONFIG = { damping: 14, stiffness: 200, mass: 0.7 };
const SPRING_FAST = { damping: 18, stiffness: 300, mass: 0.5 };

// Option positions relative to FAB center (translationY from press start)
const OPT1_Y = -(FAB_SIZE / 2 + OPTION_GAP + OPTION_HEIGHT / 2);
const OPT2_Y = -(
  FAB_SIZE / 2 +
  OPTION_GAP +
  OPTION_HEIGHT +
  OPTION_GAP +
  OPTION_HEIGHT / 2
);
const HIT_RADIUS_Y = OPTION_HEIGHT / 2 + 4;
const HIT_RADIUS_X = 70;

interface FloatingActionButtonProps {
  onSelectAction: (action: PhotoSource) => void;
}

export function FloatingActionButton({
  onSelectAction,
}: FloatingActionButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#444444" : "#E5E5E5";
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const hoveredOption = useSharedValue(0);

  const triggerAction = useCallback(
    (action: PhotoSource) => {
      onSelectAction(action);
    },
    [onSelectAction],
  );

  const triggerImpact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const triggerSelection = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const triggerSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const startY = useSharedValue(0);
  const startX = useSharedValue(0);

  const gesture = Gesture.Manual()
    .onTouchesDown((e) => {
      runOnJS(triggerImpact)();
      progress.value = withSpring(1, SPRING_CONFIG);
      rotation.value = withSpring(1, SPRING_CONFIG);
      hoveredOption.value = 0;
      if (e.allTouches.length > 0) {
        startX.value = e.allTouches[0].absoluteX;
        startY.value = e.allTouches[0].absoluteY;
      }
    })
    .onTouchesMove((e) => {
      if (e.allTouches.length === 0) return;
      const dx = e.allTouches[0].absoluteX - startX.value;
      const dy = e.allTouches[0].absoluteY - startY.value;

      const inOpt1Y = Math.abs(dy - OPT1_Y) < HIT_RADIUS_Y;
      const inOpt1X = Math.abs(dx) < HIT_RADIUS_X;
      const inOpt2Y = Math.abs(dy - OPT2_Y) < HIT_RADIUS_Y;
      const inOpt2X = Math.abs(dx) < HIT_RADIUS_X;

      if (inOpt1X && inOpt1Y) {
        if (hoveredOption.value !== 1) runOnJS(triggerSelection)();
        hoveredOption.value = 1;
      } else if (inOpt2X && inOpt2Y) {
        if (hoveredOption.value !== 2) runOnJS(triggerSelection)();
        hoveredOption.value = 2;
      } else {
        hoveredOption.value = 0;
      }
    })
    .onTouchesUp(() => {
      const selected = hoveredOption.value;
      if (selected !== 0) {
        runOnJS(triggerSuccess)();
      }
      if (selected === 1) {
        runOnJS(triggerAction)("camera");
      } else if (selected === 2) {
        runOnJS(triggerAction)("photos");
      }
      progress.value = withSpring(0, SPRING_FAST);
      rotation.value = withSpring(0, SPRING_FAST);
      hoveredOption.value = 0;
    })
    .onTouchesCancelled(() => {
      progress.value = withSpring(0, SPRING_FAST);
      rotation.value = withSpring(0, SPRING_FAST);
      hoveredOption.value = 0;
    });

  const fabAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.1, 0.95]);
    return { transform: [{ scale }] };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotation.value, [0, 1], [0, 45]);
    return { transform: [{ rotate: `${rotate}deg` }] };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.35]),
    pointerEvents: progress.value > 0.1 ? ("auto" as const) : ("none" as const),
  }));

  const option1Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, -(OPTION_HEIGHT + OPTION_GAP)],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 0.3, 1],
      [0.3, 0.8, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.2, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    );
    const hoverScale = hoveredOption.value === 1 ? 1.08 : 1;
    return {
      transform: [{ translateY }, { scale: scale * hoverScale }],
      opacity,
    };
  });

  const option2Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, -2 * (OPTION_HEIGHT + OPTION_GAP)],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 0.4, 1],
      [0.3, 0.8, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.3, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    );
    const hoverScale = hoveredOption.value === 2 ? 1.08 : 1;
    return {
      transform: [{ translateY }, { scale: scale * hoverScale }],
      opacity,
    };
  });

  const optionBgStyle = useAnimatedStyle(() => {
    const baseColor = isDark ? "#F5F5F5" : "#181818"; // bg-background-50ish in reverse
    const hoverColor = isDark ? "#E5E5E5" : "#333333";
    return {
      backgroundColor: hoveredOption.value > 0 ? hoverColor : baseColor,
    };
  });

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        className="absolute top-0 left-0 right-0 bottom-0 bg-background-950 z-[90]"
        style={backdropStyle}
      />

      {/* FAB Container */}
      <Box
        className="absolute bottom-10 right-6 z-[100] items-end"
        pointerEvents="box-none"
      >
        {/* Option 2: Import (further up) */}
        <Animated.View
          className="absolute bottom-0 right-0"
          style={option2Style}
          pointerEvents="none"
        >
          <Animated.View
            className="flex-row flex-nowrap items-center rounded-full gap-2 shadow-hard-2 h-11 w-[104px] pl-4 pr-2"
            style={optionBgStyle}
          >
            <Text className="text-typography-0 text-[15px] font-semibold">
              Photos
            </Text>
            <Box className="w-8 h-8 rounded-full bg-background-800 items-center justify-center">
              <Image size={20} color={iconColor} />
            </Box>
          </Animated.View>
        </Animated.View>

        {/* Option 1: Take Photo (closer to FAB) */}
        <Animated.View
          className="absolute bottom-0 right-0"
          style={option1Style}
          pointerEvents="none"
        >
          <Animated.View
            className="flex-row flex-nowrap items-center rounded-full gap-2 shadow-hard-2 h-11 w-[110px] pl-4 pr-2"
            style={optionBgStyle}
          >
            <Text className="text-typography-0 text-[15px] font-semibold">
              Camera
            </Text>
            <Box className="w-8 h-8 rounded-full bg-background-800 items-center justify-center">
              <Camera size={20} color={iconColor} />
            </Box>
          </Animated.View>
        </Animated.View>

        {/* Main FAB */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            className="w-14 h-14 rounded-full bg-background-950 items-center justify-center shadow-hard-2"
            style={fabAnimatedStyle}
          >
            <Animated.View style={iconAnimatedStyle}>
              <Plus size={28} color={iconColor} strokeWidth={2.5} />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </Box>
    </>
  );
}
