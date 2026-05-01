import React from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft, Plus } from "lucide-react-native";

interface DetailHeaderProps {
  formattedDate: string;
  onBack: () => void;
  onAddSection?: () => void;
}

export function DetailHeader({
  formattedDate,
  onBack,
  onAddSection,
}: DetailHeaderProps) {
  return (
    <HStack className="justify-between items-center px-4 py-4 bg-background-0">
      <Pressable
        onPress={onBack}
        className="p-2 rounded-full bg-background-50 active:bg-background-100"
      >
        <Icon as={ArrowLeft} size="md" className="text-typography-900" />
      </Pressable>

      <Text className="text-lg font-semibold text-typography-900">
        {formattedDate}
      </Text>

      {onAddSection ? (
        <Pressable
          onPress={onAddSection}
          className="p-2 rounded-full bg-background-50 active:bg-background-100"
        >
          <Icon as={Plus} size="md" className="text-typography-900" />
        </Pressable>
      ) : (
        <Box className="w-10" />
      )}
    </HStack>
  );
}
