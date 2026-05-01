import React, { useState, useEffect } from "react";
import { Lightbulb, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { storage } from "@/services/storage";

const TIPS = [
  {
    id: "home_double_tap",
    text: "Lost in space? 🌠 Double tap the Home button to teleport straight back to today!",
  },
  {
    id: "year_swipe",
    text: "Feeling nostalgic? 🕰️ Swipe up or down on the year at the top of Home to travel through the years!",
  },
  {
    id: "crop_heic",
    text: "Keep that HEIC magic! ✨ Cropping HEIC photos converts them to JPG, which might lose a bit of detail. Try to frame your perfect shot! 📸",
  },
  {
    id: "photos_grid_reload",
    text: "Tap reload button on top of photos grid to see your memories in a whole new way! 🖼️",
  },
];

export function SettingsTips() {
  const [activeTipIndex, setActiveTipIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTips = async () => {
      const statuses = await Promise.all(
        TIPS.map((tip) => storage.isTipDismissed(tip.id)),
      );
      for (let i = 0; i < TIPS.length; i++) {
        if (!statuses[i]) {
          setActiveTipIndex(i);
          break;
        }
      }
      setLoading(false);
    };
    loadTips();
  }, []);

  const handleDismiss = async () => {
    if (activeTipIndex === null) return;

    const currentTipId = TIPS[activeTipIndex].id;
    await storage.dismissTip(currentTipId);
    Haptics.selectionAsync();

    // Find next tip
    let nextIndex = null;
    const remainingTips = TIPS.slice(activeTipIndex + 1);
    if (remainingTips.length > 0) {
      const statuses = await Promise.all(
        remainingTips.map((tip) => storage.isTipDismissed(tip.id)),
      );
      for (let i = 0; i < remainingTips.length; i++) {
        if (!statuses[i]) {
          nextIndex = activeTipIndex + 1 + i;
          break;
        }
      }
    }
    setActiveTipIndex(nextIndex);
  };

  if (loading || activeTipIndex === null) return null;

  const tip = TIPS[activeTipIndex];

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      layout={Layout.springify()}
      className="px-4 pt-4 mb-6"
    >
      <Box className="bg-primary-50/25 rounded-2xl p-4 relative overflow-hidden">
        <HStack className="items-start gap-3 pr-6">
          <Box className="bg-primary-500/10 p-2 rounded-full mt-0.5">
            <Lightbulb size={20} color="#3b82f6" />
          </Box>
          <VStack className="flex-1 gap-1">
            <Text className="text-sm font-bold text-primary-900">Pro Tip!</Text>
            <Text className="text-sm text-primary-800 leading-5">
              {tip.text}
            </Text>
          </VStack>
        </HStack>

        <Pressable
          onPress={handleDismiss}
          className="absolute top-2 right-2 p-2 rounded-full active:bg-primary-200"
          testID="dismiss-tip-button"
          accessibilityLabel="Dismiss tip"
        >
          <X size={16} color="#3b82f6" />
        </Pressable>
      </Box>
    </Animated.View>
  );
}
