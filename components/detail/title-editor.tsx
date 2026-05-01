import React, { useEffect, useRef } from "react";
import { View, Keyboard, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Check, X } from "lucide-react-native";
import { Portal } from "@/components/ui/portal";

interface TitleEditorProps {
  initialTitle: string;
  onSave: (title: string) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export const TitleEditor = React.memo(function TitleEditor({
  initialTitle,
  onSave,
  onCancel,
  isDarkMode,
}: TitleEditorProps) {
  const textRef = useRef(initialTitle);
  const popupOpacity = useSharedValue(0);
  const popupBottom = useSharedValue(0);
  const translateY = useSharedValue(70);

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

  useEffect(() => {
    popupOpacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 250 });
  }, [popupOpacity, translateY]);

  const animatedPopupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ translateY: translateY.value }],
    bottom: popupBottom.value + 12,
  }));

  const handlePressSave = () => {
    onSave(textRef.current);
  };

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
        <View className="w-[90%] bg-background-0 border border-outline-100 shadow-lg rounded-full overflow-hidden">
          <HStack className="items-center p-3 gap-3">
            <Input
              variant="rounded"
              size="md"
              className="flex-1 h-10 border-outline-300!"
            >
              <InputField
                autoFocus
                defaultValue={initialTitle}
                onChangeText={(text) => (textRef.current = text)}
                placeholder="Section Title"
                placeholderTextColor={isDarkMode ? "#8E8E93" : "#C7C7CC"}
                onSubmitEditing={() => onSave(textRef.current)}
                className="font-bold text-typography-900 border-none"
              />
            </Input>
            <HStack className="gap-1">
              <Pressable
                onPress={handlePressSave}
                className="p-2 bg-primary-900 rounded-full active:bg-primary-600"
              >
                <Check size={20} color={isDarkMode ? "#000" : "#fff"} />
              </Pressable>
              <Pressable
                onPress={onCancel}
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
});
