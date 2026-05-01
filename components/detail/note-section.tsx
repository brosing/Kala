import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  memo,
} from "react";
import {
  View,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  Keyboard,
  Platform,
} from "react-native";
import { useColorScheme } from "nativewind";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { Icon } from "@/components/ui/icon";
import { Portal } from "@/components/ui/portal";
import { EnrichedTextInput } from "react-native-enriched";
import type { EnrichedTextInputInstance } from "react-native-enriched";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Code,
  KeyboardOffIcon,
} from "lucide-react-native";

interface NoteSectionProps {
  onNoteChange: (text: string) => void;
  isLoading?: boolean;
  defaultValue?: string;
  onFocus?: () => void;
}

interface StyleState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  h1: boolean;
  h2: boolean;
  blockQuote: boolean;
  orderedList: boolean;
  unorderedList: boolean;
  inlineCode: boolean;
}

const INITIAL_STATE: StyleState = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  h1: false,
  h2: false,
  blockQuote: false,
  orderedList: false,
  unorderedList: false,
  inlineCode: false,
};

const ToolbarItem = memo(
  ({
    item,
    isActive,
    isDark,
  }: {
    item: { key: string; icon: any; action: () => void };
    isActive: boolean;
    isDark: boolean;
  }) => (
    <Pressable
      onPress={item.action}
      style={{
        padding: 6,
        borderRadius: 8,
        backgroundColor: isActive
          ? isDark
            ? "#3A3A3C"
            : "#E5E5EA"
          : "transparent",
      }}
    >
      <Icon
        as={item.icon}
        size="sm"
        className={isActive ? "text-typography-900" : "text-typography-500"}
      />
    </Pressable>
  ),
);
ToolbarItem.displayName = "ToolbarItem";

const NoteToolbar = memo(
  ({
    isFocused,
    isDark,
    styleState,
    noteInputRef,
    animatedToolbarStyle,
  }: {
    isFocused: boolean;
    isDark: boolean;
    styleState: StyleState;
    noteInputRef: React.RefObject<EnrichedTextInputInstance | null>;
    animatedToolbarStyle: any;
  }) => {
    const toolbarItems = useMemo(
      () => [
        {
          key: "bold",
          icon: Bold,
          action: () => noteInputRef.current?.toggleBold(),
        },
        {
          key: "italic",
          icon: Italic,
          action: () => noteInputRef.current?.toggleItalic(),
        },
        {
          key: "underline",
          icon: Underline,
          action: () => noteInputRef.current?.toggleUnderline(),
        },
        {
          key: "strikeThrough",
          icon: Strikethrough,
          action: () => noteInputRef.current?.toggleStrikeThrough(),
        },
        {
          key: "h1",
          icon: Heading1,
          action: () => noteInputRef.current?.toggleH1(),
        },
        {
          key: "h2",
          icon: Heading2,
          action: () => noteInputRef.current?.toggleH2(),
        },
        {
          key: "blockQuote",
          icon: Quote,
          action: () => noteInputRef.current?.toggleBlockQuote(),
        },
        {
          key: "orderedList",
          icon: ListOrdered,
          action: () => noteInputRef.current?.toggleOrderedList(),
        },
        {
          key: "unorderedList",
          icon: List,
          action: () => noteInputRef.current?.toggleUnorderedList(),
        },
        {
          key: "inlineCode",
          icon: Code,
          action: () => noteInputRef.current?.toggleInlineCode(),
        },
      ],
      [noteInputRef],
    );

    if (!isFocused) return null;

    return (
      <Portal isOpen={true}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 100,
            },
            animatedToolbarStyle,
          ]}
        >
          <View
            className="border border-outline-100 shadow-lg"
            style={{
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: isDark
                ? "rgba(28, 28, 30, 0.8)"
                : "rgba(255, 255, 255, 0.8)",
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{
                gap: 2,
                padding: 6,
              }}
            >
              {toolbarItems.map((item) => (
                <ToolbarItem
                  key={item.key}
                  item={item}
                  isActive={styleState[item.key as keyof StyleState]}
                  isDark={isDark}
                />
              ))}
              <View
                style={{
                  width: 1,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.1)",
                  marginHorizontal: 4,
                  alignSelf: "center",
                  height: 16,
                }}
              />
              <Pressable
                onPress={() => noteInputRef.current?.blur()}
                style={{ padding: 6, borderRadius: 8 }}
              >
                <Icon
                  as={KeyboardOffIcon}
                  size="sm"
                  className="text-typography-400"
                />
              </Pressable>
            </ScrollView>
          </View>
        </Animated.View>
      </Portal>
    );
  },
);
NoteToolbar.displayName = "NoteToolbar";

function NoteSkeleton({
  delay,
  width,
  height,
}: {
  delay: number;
  width: any;
  height: number;
}) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          height,
          width,
          marginBottom: 12,
          borderRadius: 12,
        },
      ]}
      className="bg-background-50"
    />
  );
}

export function NoteSection({
  onNoteChange,
  isLoading,
  defaultValue,
  onFocus,
}: NoteSectionProps) {
  const noteInputRef = useRef<EnrichedTextInputInstance | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [styleState, setStyleState] = useState<StyleState>(INITIAL_STATE);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const toolbarOpacity = useSharedValue(0);
  const toolbarBottom = useSharedValue(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View>(null);

  const stableDefaultValue = useRef(defaultValue);

  const handleNoteChange = useCallback(
    (text: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onNoteChange(text);
      }, 500);
    },
    [onNoteChange],
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      toolbarBottom.value = withTiming(height, { duration: 250 });
    };
    const onHide = () => {
      setKeyboardHeight(0);
      toolbarBottom.value = withTiming(0, { duration: 250 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [toolbarBottom]);

  useEffect(() => {
    toolbarOpacity.value = withTiming(isFocused ? 1 : 0, {
      duration: 200,
    });
  }, [isFocused, toolbarOpacity]);

  const handleChangeState = useCallback((e: NativeSyntheticEvent<any>) => {
    const s = e.nativeEvent;
    setStyleState({
      bold: s.bold?.isActive ?? false,
      italic: s.italic?.isActive ?? false,
      underline: s.underline?.isActive ?? false,
      strikeThrough: s.strikeThrough?.isActive ?? false,
      h1: s.h1?.isActive ?? false,
      h2: s.h2?.isActive ?? false,
      blockQuote: s.blockQuote?.isActive ?? false,
      orderedList: s.orderedList?.isActive ?? false,
      unorderedList: s.unorderedList?.isActive ?? false,
      inlineCode: s.inlineCode?.isActive ?? false,
    });
  }, []);

  const animatedToolbarStyle = useAnimatedStyle(
    () => ({
      opacity: toolbarOpacity.value,
      transform: [
        {
          translateY: withTiming(isFocused && keyboardHeight > 0 ? 0 : 70, {
            duration: 250,
          }),
        },
      ],
      bottom: toolbarBottom.value + 12,
    }),
    [isFocused, keyboardHeight],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    requestAnimationFrame(() => {
      if (onFocus && containerRef.current) {
        containerRef.current.measure(() => {
          onFocus?.();
        });
      }
    });
  }, [onFocus]);

  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <NoteSkeleton delay={0} width="60%" height={24} />
        <NoteSkeleton delay={100} width="90%" height={16} />
        <NoteSkeleton delay={200} width="85%" height={16} />
        <NoteSkeleton delay={300} width="95%" height={16} />
      </View>
    );
  }

  return (
    <View ref={containerRef} collapsable={false}>
      <EnrichedTextInput
        ref={noteInputRef}
        defaultValue={stableDefaultValue.current}
        onChangeHtml={(e) => handleNoteChange(e.nativeEvent.value)}
        onChangeState={handleChangeState}
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        style={{
          minHeight: isFocused ? 100 : 40,
          fontSize: 16,
          padding: 4,
          textAlignVertical: "top",
          color: isDark ? "#F5F5F5" : "#262627",
        }}
        placeholder="Write about your day..."
        placeholderTextColor={
          isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"
        }
      />
      <NoteToolbar
        isFocused={isFocused}
        isDark={isDark}
        styleState={styleState}
        noteInputRef={noteInputRef}
        animatedToolbarStyle={animatedToolbarStyle}
      />
    </View>
  );
}
