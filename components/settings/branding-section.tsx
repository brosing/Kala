import React from "react";
import { Image } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { APP_CONFIG } from "@/constants";

export function BrandingSection() {
  return (
    <VStack className="flex-row px-4 pb-10 pt-4 gap-4">
      <Box className="shadow-2xl shadow-black/10 bg-background-0 rounded-[20px] p-1.5 border border-outline-50">
        <Image
          source={require("@/assets/images/icon.png")}
          className="w-24 h-24 rounded-[16px]"
          resizeMode="contain"
        />
      </Box>
      <VStack className="flex-1 break-all justify-center">
        <HStack className="items-center gap-1.5">
          <Text className="text-2xl font-bold text-typography-900 tracking-tight">
            Kala
          </Text>
          <Text className="text-xs text-typography-500">
            ({APP_CONFIG.VERSION})
          </Text>
        </HStack>

        <Text className="text-sm text-typography-500">
          Simple daily photo journal app. Capture photos each day, add notes,
          and build a visual diary of your life.
        </Text>
      </VStack>
    </VStack>
  );
}
