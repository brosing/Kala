import React, { useEffect } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Home, Settings } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { Pressable, DeviceEventEmitter } from "react-native";
import { useColorScheme } from "nativewind";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";

const ANIM_CONFIG = { duration: 250, easing: Easing.out(Easing.ease) };

export function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const activeColor = isDark ? "#E5E5E5" : "#444444";
  const iconColor = isDark ? "#444444" : "#E5E5E5";

  const isHome = pathname === "/" || pathname === "/index";
  const isSettings = pathname === "/settings";

  const homeProgress = useSharedValue(isHome ? 1 : 0);
  const settingsProgress = useSharedValue(isSettings ? 1 : 0);

  useEffect(() => {
    homeProgress.value = withTiming(isHome ? 1 : 0, ANIM_CONFIG);
    settingsProgress.value = withTiming(isSettings ? 1 : 0, ANIM_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome, isSettings]);

  const homeBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      homeProgress.value,
      [0, 1],
      ["transparent", activeColor],
    ),
    opacity: 0.7 + homeProgress.value * 0.6,
    transform: [{ scale: 0.92 + homeProgress.value * 0.08 }],
  }));

  const settingsBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      settingsProgress.value,
      [0, 1],
      ["transparent", activeColor],
    ),
    opacity: 0.7 + settingsProgress.value * 0.6,
    transform: [{ scale: 0.92 + settingsProgress.value * 0.08 }],
  }));

  const lastTap = React.useRef(0);

  const goHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      DeviceEventEmitter.emit("RESET_TO_TODAY");
    }
    lastTap.current = now;

    if (!isHome) {
      router.navigate("/");
    }
  };

  const goSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isSettings) {
      router.navigate("/settings");
    }
  };

  return (
    <Box className="absolute bottom-10 left-6 z-[100]" pointerEvents="box-none">
      <HStack className="bg-background-950 rounded-full items-center shadow-hard-2 p-1.5 gap-1">
        <Pressable onPress={goHome}>
          <Animated.View
            style={homeBgStyle}
            className="rounded-full items-center justify-center px-3.5 h-11 flex-row gap-1.5"
          >
            <Home size={18} color={iconColor} />
            <Text className="text-xs font-semibold text-typography-0">
              Home
            </Text>
          </Animated.View>
        </Pressable>

        <Pressable onPress={goSettings}>
          <Animated.View
            style={settingsBgStyle}
            className="rounded-full items-center justify-center px-3.5 h-11 flex-row gap-1.5"
          >
            <Settings size={18} color={iconColor} />
            <Text className="text-xs font-semibold text-typography-0">
              Settings
            </Text>
          </Animated.View>
        </Pressable>
      </HStack>
    </Box>
  );
}
