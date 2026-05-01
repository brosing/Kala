import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { FlatList, Dimensions, View, StyleSheet } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

interface DateItemViewProps {
  item: DateItem;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  dayName: string;
  handlePress: (date: string) => void;
  selectionOpacity: SharedValue<number>;
}

const DateItemView = React.memo(function DateItemView({
  item,
  isSelected,
  isToday,
  isFuture,
  dayName,
  handlePress,
  selectionOpacity,
}: DateItemViewProps) {
  const animatedBgStyle = useAnimatedStyle(() => {
    return {
      opacity: isSelected ? selectionOpacity.value : 0,
      transform: [
        {
          scale: isSelected
            ? interpolate(
                selectionOpacity.value,
                [0, 1],
                [0.8, 1],
                Extrapolation.CLAMP,
              )
            : 1,
        },
      ],
    };
  });

  return (
    <Pressable
      onPress={() => !isFuture && handlePress(item.dateStr)}
      disabled={isFuture}
      style={{ width: ITEM_WIDTH, marginHorizontal: ITEM_MARGIN }}
      className={`items-center py-1 rounded-xl bg-background-50 ${
        isFuture ? "opacity-30" : ""
      }`}
    >
      {/* Animated Background for Selection */}
      {isSelected && (
        <AnimatedBox
          style={[StyleSheet.absoluteFill, animatedBgStyle]}
          className="bg-primary-500 rounded-xl"
        />
      )}

      {/* Text content - we need to make sure text is readable over the animated bg */}
      <Box className="items-center z-10">
        <Text
          className={`text-xs ${
            isSelected
              ? "text-typography-0 font-semibold"
              : isToday
                ? "text-primary-500 font-medium"
                : "text-typography-400"
          }`}
        >
          {dayName}
        </Text>
        <Text
          className={`text-lg font-bold mt-0.5 ${
            isSelected
              ? "text-typography-0"
              : isToday
                ? "text-primary-500"
                : "text-typography-900"
          }`}
        >
          {item.date.getDate()}
        </Text>
      </Box>
    </Pressable>
  );
});

const ITEM_WIDTH = 56;
const ITEM_MARGIN = 2; // mx-0.5 = 2px each side
const ITEM_TOTAL_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SIDE_PADDING = (SCREEN_WIDTH - ITEM_TOTAL_WIDTH) / 2;
const DAYS_BEFORE = 60;
const DAYS_AFTER = 60;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DateStripProps {
  currentDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
}

interface DateItem {
  date: Date;
  dateStr: string;
}

function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const getItemLayout = (_: any, index: number) => ({
  length: ITEM_TOTAL_WIDTH,
  offset: ITEM_TOTAL_WIDTH * index + SIDE_PADDING,
  index,
});

export function DateStrip({ currentDate, onDateSelect }: DateStripProps) {
  const listRef = useRef<FlatList>(null);
  const isFirstMount = useRef(true);
  const selectionOpacity = useSharedValue(0);
  const [isReady, setIsReady] = React.useState(false);

  const dates = useMemo(() => {
    const base = new Date(currentDate + "T00:00:00");
    const result: DateItem[] = [];
    for (let i = -DAYS_BEFORE; i <= DAYS_AFTER; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      result.push({ date: d, dateStr: formatDateStr(d) });
    }
    return result;
  }, [currentDate]);

  const selectedIndex = DAYS_BEFORE;

  useEffect(() => {
    // Reset opacity when date changes
    selectionOpacity.value = 0;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: false,
          viewPosition: 0.5,
        });
        selectionOpacity.value = withTiming(1, { duration: 300 });
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      listRef.current?.scrollToIndex({
        index: selectedIndex,
        animated: true,
        viewPosition: 0.5,
      });
      selectionOpacity.value = withTiming(1, { duration: 300 });
      setIsReady(true);
    }
  }, [currentDate, selectedIndex, selectionOpacity]);

  const today = useMemo(() => new Date(), []);

  const handlePress = useCallback(
    (dateStr: string) => {
      if (dateStr !== currentDate) {
        onDateSelect(dateStr);
      }
    },
    [currentDate, onDateSelect],
  );

  const HeaderFooter = useMemo(
    () => <View style={{ width: SIDE_PADDING }} />,
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DateItem; index: number }) => {
      const isSelected = index === selectedIndex;
      const isToday = isSameDay(item.date, today);
      const dayName = DAY_NAMES[item.date.getDay()];
      const isFuture = item.date.getTime() > today.getTime() && !isToday;

      return (
        <DateItemView
          item={item}
          isSelected={isSelected && isReady}
          isToday={isToday}
          isFuture={isFuture}
          dayName={dayName}
          handlePress={handlePress}
          selectionOpacity={selectionOpacity}
        />
      );
    },
    [selectedIndex, today, handlePress, selectionOpacity, isReady],
  );

  return (
    <Box className="bg-background-0 py-2">
      <FlatList
        ref={listRef}
        data={dates}
        keyExtractor={(item) => item.dateStr}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={selectedIndex}
        ListHeaderComponent={HeaderFooter}
        ListFooterComponent={HeaderFooter}
      />
    </Box>
  );
}
