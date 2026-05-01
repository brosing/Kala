import React, { useEffect, useRef } from "react";
import { Keyboard, Platform, View } from "react-native";
import { useColorScheme } from "nativewind";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Check, X } from "lucide-react-native";
import { Portal } from "@/components/ui/portal";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void> | void;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onConfirm,
}: CreateUserModalProps) {
  const nameRef = useRef("");
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const popupOpacity = useSharedValue(0);
  const popupBottom = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      nameRef.current = "";
      popupOpacity.value = withTiming(1, { duration: 200 });
    } else {
      popupOpacity.value = 0;
    }
  }, [isOpen, popupOpacity]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const height = e.endCoordinates.height;
      popupBottom.value = withTiming(height, { duration: 250 });
    };
    const onHide = () => {
      popupBottom.value = withTiming(0, { duration: 250 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [popupBottom]);

  const animatedPopupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [
      {
        translateY: withTiming(isOpen ? 0 : 70, {
          duration: 250,
        }),
      },
    ],
    bottom: popupBottom.value + 12,
  }));

  const handleConfirm = async () => {
    if (nameRef.current.trim()) {
      await onConfirm(nameRef.current.trim());
      onClose();
      Keyboard.dismiss();
    }
  };

  const handleCancel = () => {
    nameRef.current = "";
    onClose();
    Keyboard.dismiss();
  };

  if (!isOpen) return null;

  return (
    <Portal isOpen={true}>
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 1000,
          },
          animatedPopupStyle,
        ]}
      >
        <View className="w-[90%] bg-background-0 border border-outline-100 shadow-2xl rounded-full overflow-hidden">
          <HStack className="items-center p-3 gap-3">
            <Input
              variant="rounded"
              size="md"
              className="flex-1 h-10 border-outline-300!"
            >
              <InputField
                key={isOpen ? "open" : "closed"}
                defaultValue=""
                onChangeText={(text) => (nameRef.current = text)}
                autoFocus
                placeholder="User Name"
                placeholderTextColor={isDarkMode ? "#8E8E93" : "#C7C7CC"}
                onSubmitEditing={handleConfirm}
                className="font-bold text-typography-900 border-none"
              />
            </Input>
            <HStack className="gap-1">
              <Pressable
                onPress={handleConfirm}
                className="p-2 bg-primary-900 rounded-full active:bg-primary-600"
              >
                <Check size={20} color={isDarkMode ? "#000" : "#fff"} />
              </Pressable>
              <Pressable
                onPress={handleCancel}
                className="p-2 bg-background-200 rounded-full active:bg-background-300"
              >
                <X size={20} color={isDarkMode ? "#fff" : "#000"} />
              </Pressable>
            </HStack>
          </HStack>
        </View>
      </Animated.View>
    </Portal>
  );
}
