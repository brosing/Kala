import React, { useRef } from "react";
import * as Haptics from "expo-haptics";
import { Trash2 } from "lucide-react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { User } from "@/types/day-entry";

interface UserItemProps {
  user: User;
  isActive: boolean;
  isDarkMode: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

function SwipeAction({
  onPress,
  isDarkMode,
}: {
  onPress: () => void;
  isDarkMode: boolean;
}) {
  return (
    <Box className="w-[80px] h-full pl-2">
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        className={`flex-1 items-center justify-center rounded-full ${
          isDarkMode ? "bg-error-500/10" : "bg-error-50"
        }`}
      >
        <Trash2 size={22} color={isDarkMode ? "#f87171" : "#ef4444"} />
      </Pressable>
    </Box>
  );
}

export function UserItem({
  user,
  isActive,
  isDarkMode,
  onSwitch,
  onDelete,
  canDelete,
}: UserItemProps) {
  const swipeableRef = useRef<any>(null);

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete(user.id);
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={
        canDelete
          ? () => <SwipeAction onPress={handleDelete} isDarkMode={isDarkMode} />
          : undefined
      }
    >
      <Pressable
        onPress={() => onSwitch(user.id)}
        className={`p-4 rounded-full border flex-row items-center gap-4 ${
          isActive
            ? "bg-primary-900 border-primary-900"
            : "bg-background-0 border-outline-100"
        }`}
      >
        <Text
          className={`text-base font-semibold ml-4 ${
            isActive ? "text-typography-0" : "text-typography-900"
          }`}
        >
          {user.name}
        </Text>
        {isActive && (
          <Box
            className={`ml-auto px-2 py-2 rounded-full ${
              isDarkMode ? "bg-primary-100" : "bg-primary-100"
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                isDarkMode ? "text-grey-900" : "text-primary-700"
              }`}
            >
              ACTIVE
            </Text>
          </Box>
        )}
      </Pressable>
    </ReanimatedSwipeable>
  );
}
