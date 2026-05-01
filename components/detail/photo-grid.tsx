import React, { useEffect } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { ImagePlus } from "lucide-react-native";
import { Photo } from "@/types/day-entry";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

interface PhotoGridProps {
  photos: Photo[];
  onPhotoPress: (photo: Photo, index: number) => void;
  isLoading?: boolean;
  mosaicStyle?: number;
}

function PhotoSkeleton({ index, width }: { index: number; width: string }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        true,
      ),
    );
  }, [index, shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(shimmer.value, [0, 1], [0.98, 1]) }],
  }));

  return (
    <Box className={`p-1 aspect-square ${width}`}>
      <Animated.View
        style={animatedStyle}
        className="w-full h-full rounded-2xl bg-background-200"
      />
    </Box>
  );
}

// --- Layout variant definitions per photo count ---
// Each count maps to an array of layout renderer functions.
// Photos are always rendered in order (index 0, 1, 2...) — only the grid shape changes.

type LayoutRenderer = (
  photos: Photo[],
  renderPhoto: (
    photo: Photo,
    index: number,
    className: string,
  ) => React.ReactNode,
) => React.ReactNode;

const LAYOUTS_2: LayoutRenderer[] = [
  // A: side by side
  (p, r) => (
    <Box className="flex-row aspect-[16/10]">
      {r(p[0], 0, "w-1/2 h-full")}
      {r(p[1], 1, "w-1/2 h-full")}
    </Box>
  ),
  // B: stacked
  (p, r) => (
    <Box className="aspect-[16/10]">
      {r(p[0], 0, "w-full h-1/2")}
      {r(p[1], 1, "w-full h-1/2")}
    </Box>
  ),
  // C: hero left + small right
  (p, r) => (
    <Box className="flex-row aspect-[16/10]">
      {r(p[0], 0, "w-2/3 h-full")}
      {r(p[1], 1, "w-1/3 h-full")}
    </Box>
  ),
];

const LAYOUTS_3: LayoutRenderer[] = [
  // A: big left, 2 stacked right
  (p, r) => (
    <Box className="flex-row aspect-[16/10]">
      <Box className="w-2/3 h-full">{r(p[0], 0, "w-full h-full")}</Box>
      <Box className="w-1/3 h-full">
        {r(p[1], 1, "w-full h-1/2")}
        {r(p[2], 2, "w-full h-1/2")}
      </Box>
    </Box>
  ),
  // B: 2 stacked left, big right
  (p, r) => (
    <Box className="flex-row aspect-[16/10]">
      <Box className="w-1/3 h-full">
        {r(p[0], 0, "w-full h-1/2")}
        {r(p[1], 1, "w-full h-1/2")}
      </Box>
      <Box className="w-2/3 h-full">{r(p[2], 2, "w-full h-full")}</Box>
    </Box>
  ),
  // C: top row 1, bottom row 2
  (p, r) => (
    <Box className="aspect-[16/10]">
      {r(p[0], 0, "w-full h-1/2")}
      <Box className="flex-row w-full h-1/2">
        {r(p[1], 1, "w-1/2 h-full")}
        {r(p[2], 2, "w-1/2 h-full")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_4: LayoutRenderer[] = [
  // A: asymmetric zigzag
  (p, r) => (
    <Box className="flex-row aspect-[16/10]">
      <Box className="w-1/2 h-full">
        {r(p[0], 0, "w-full h-2/3")}
        {r(p[1], 1, "w-full h-1/3")}
      </Box>
      <Box className="w-1/2 h-full">
        {r(p[2], 2, "w-full h-1/3")}
        {r(p[3], 3, "w-full h-2/3")}
      </Box>
    </Box>
  ),
  // B: 2x2 even grid
  (p, r) => (
    <Box className="flex-row flex-wrap aspect-[16/10]">
      {r(p[0], 0, "w-1/2 h-1/2")}
      {r(p[1], 1, "w-1/2 h-1/2")}
      {r(p[2], 2, "w-1/2 h-1/2")}
      {r(p[3], 3, "w-1/2 h-1/2")}
    </Box>
  ),
  // C: hero top, 3 bottom
  (p, r) => (
    <Box className="aspect-[16/12]">
      {r(p[0], 0, "w-full h-1/2")}
      <Box className="flex-row w-full h-1/2">
        {r(p[1], 1, "w-1/3 h-full")}
        {r(p[2], 2, "w-1/3 h-full")}
        {r(p[3], 3, "w-1/3 h-full")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_5: LayoutRenderer[] = [
  // A: big left + 2 stacked right columns
  (p, r) => (
    <Box className="flex-row aspect-[16/12]">
      <Box className="w-3/5 h-full">
        {r(p[0], 0, "w-full h-2/3")}
        <Box className="flex-row w-full h-1/3">
          {r(p[1], 1, "w-1/2 h-full")}
          {r(p[2], 2, "w-1/2 h-full")}
        </Box>
      </Box>
      <Box className="w-2/5 h-full">
        {r(p[3], 3, "w-full h-1/2")}
        {r(p[4], 4, "w-full h-1/2")}
      </Box>
    </Box>
  ),
  // B: top 2, bottom 3
  (p, r) => (
    <Box className="aspect-[16/12]">
      <Box className="flex-row w-full h-1/2">
        {r(p[0], 0, "w-1/2 h-full")}
        {r(p[1], 1, "w-1/2 h-full")}
      </Box>
      <Box className="flex-row w-full h-1/2">
        {r(p[2], 2, "w-1/3 h-full")}
        {r(p[3], 3, "w-1/3 h-full")}
        {r(p[4], 4, "w-1/3 h-full")}
      </Box>
    </Box>
  ),
  // C: top 3, bottom 2
  (p, r) => (
    <Box className="aspect-[16/12]">
      <Box className="flex-row w-full h-1/2">
        {r(p[0], 0, "w-1/3 h-full")}
        {r(p[1], 1, "w-1/3 h-full")}
        {r(p[2], 2, "w-1/3 h-full")}
      </Box>
      <Box className="flex-row w-full h-1/2">
        {r(p[3], 3, "w-1/2 h-full")}
        {r(p[4], 4, "w-1/2 h-full")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_6: LayoutRenderer[] = [
  // A: cross pattern
  (p, r) => (
    <Box className="flex-row aspect-[16/12]">
      <Box className="w-1/2 h-full">
        {r(p[0], 0, "w-full h-1/2")}
        <Box className="flex-row w-full h-1/2">
          {r(p[1], 1, "w-1/2 h-full")}
          {r(p[2], 2, "w-1/2 h-full")}
        </Box>
      </Box>
      <Box className="w-1/2 h-full">
        <Box className="flex-row w-full h-1/2">
          {r(p[3], 3, "w-1/2 h-full")}
          {r(p[4], 4, "w-1/2 h-full")}
        </Box>
        {r(p[5], 5, "w-full h-1/2")}
      </Box>
    </Box>
  ),
  // B: 3x2 even
  (p, r) => (
    <Box className="flex-row flex-wrap aspect-[16/12]">
      {r(p[0], 0, "w-1/3 h-1/2")}
      {r(p[1], 1, "w-1/3 h-1/2")}
      {r(p[2], 2, "w-1/3 h-1/2")}
      {r(p[3], 3, "w-1/3 h-1/2")}
      {r(p[4], 4, "w-1/3 h-1/2")}
      {r(p[5], 5, "w-1/3 h-1/2")}
    </Box>
  ),
  // C: hero top, 2 middle, 2 bottom
  (p, r) => (
    <Box className="aspect-[16/14]">
      {r(p[0], 0, "w-full h-2/5")}
      <Box className="flex-row w-full h-1/5">
        {r(p[1], 1, "w-1/2 h-full")}
        {r(p[2], 2, "w-1/2 h-full")}
      </Box>
      <Box className="flex-row w-full h-2/5">
        {r(p[3], 3, "w-1/3 h-full")}
        {r(p[4], 4, "w-1/3 h-full")}
        {r(p[5], 5, "w-1/3 h-full")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_7: LayoutRenderer[] = [
  // A: big left column + small right column
  (p, r) => (
    <Box className="flex-row aspect-[16/14]">
      <Box className="w-2/3 h-full">
        {r(p[0], 0, "w-full h-1/2")}
        <Box className="flex-row w-full h-1/4">
          {r(p[1], 1, "w-1/2 h-full")}
          {r(p[2], 2, "w-1/2 h-full")}
        </Box>
        <Box className="flex-row w-full h-1/4">
          {r(p[3], 3, "w-1/2 h-full")}
          {r(p[4], 4, "w-1/2 h-full")}
        </Box>
      </Box>
      <Box className="w-1/3 h-full">
        {r(p[5], 5, "w-full h-1/2")}
        {r(p[6], 6, "w-full h-1/2")}
      </Box>
    </Box>
  ),
  // B: top 3, middle 2, bottom 2
  (p, r) => (
    <Box className="aspect-[16/14]">
      <Box className="flex-row w-full h-2/5">
        {r(p[0], 0, "w-1/3 h-full")}
        {r(p[1], 1, "w-1/3 h-full")}
        {r(p[2], 2, "w-1/3 h-full")}
      </Box>
      <Box className="flex-row w-full h-1/5">
        {r(p[3], 3, "w-1/2 h-full")}
        {r(p[4], 4, "w-1/2 h-full")}
      </Box>
      <Box className="flex-row w-full h-2/5">
        {r(p[5], 5, "w-1/2 h-full")}
        {r(p[6], 6, "w-1/2 h-full")}
      </Box>
    </Box>
  ),
  // C: hero + 6 small in 3x2
  (p, r) => (
    <Box className="aspect-[16/14]">
      {r(p[0], 0, "w-full h-2/5")}
      <Box className="flex-row flex-wrap w-full h-3/5">
        {r(p[1], 1, "w-1/3 h-1/2")}
        {r(p[2], 2, "w-1/3 h-1/2")}
        {r(p[3], 3, "w-1/3 h-1/2")}
        {r(p[4], 4, "w-1/3 h-1/2")}
        {r(p[5], 5, "w-1/3 h-1/2")}
        {r(p[6], 6, "w-1/3 h-1/2")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_8: LayoutRenderer[] = [
  // A: 2 columns, asymmetric
  (p, r) => (
    <Box className="flex-row aspect-[16/16]">
      <Box className="w-1/2 h-full">
        {r(p[0], 0, "w-full h-1/2")}
        <Box className="flex-row w-full h-1/4">
          {r(p[1], 1, "w-1/2 h-full")}
          {r(p[2], 2, "w-1/2 h-full")}
        </Box>
        <Box className="flex-row w-full h-1/4">
          {r(p[3], 3, "w-1/2 h-full")}
          {r(p[4], 4, "w-1/2 h-full")}
        </Box>
      </Box>
      <Box className="w-1/2 h-full">
        <Box className="flex-row w-full h-1/4">
          {r(p[5], 5, "w-1/2 h-full")}
          {r(p[6], 6, "w-1/2 h-full")}
        </Box>
        {r(p[7], 7, "w-full h-3/4")}
      </Box>
    </Box>
  ),
  // B: 4x2 even grid
  (p, r) => (
    <Box className="flex-row flex-wrap aspect-[16/16]">
      {r(p[0], 0, "w-1/4 h-1/2")}
      {r(p[1], 1, "w-1/4 h-1/2")}
      {r(p[2], 2, "w-1/4 h-1/2")}
      {r(p[3], 3, "w-1/4 h-1/2")}
      {r(p[4], 4, "w-1/4 h-1/2")}
      {r(p[5], 5, "w-1/4 h-1/2")}
      {r(p[6], 6, "w-1/4 h-1/2")}
      {r(p[7], 7, "w-1/4 h-1/2")}
    </Box>
  ),
  // C: hero top, 3 middle, 4 bottom
  (p, r) => (
    <Box className="aspect-[16/16]">
      {r(p[0], 0, "w-full h-2/5")}
      <Box className="flex-row w-full h-1/5">
        {r(p[1], 1, "w-1/3 h-full")}
        {r(p[2], 2, "w-1/3 h-full")}
        {r(p[3], 3, "w-1/3 h-full")}
      </Box>
      <Box className="flex-row w-full h-2/5">
        {r(p[4], 4, "w-1/4 h-full")}
        {r(p[5], 5, "w-1/4 h-full")}
        {r(p[6], 6, "w-1/4 h-full")}
        {r(p[7], 7, "w-1/4 h-full")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_9: LayoutRenderer[] = [
  // A: 3x3 grid
  (p, r) => (
    <Box className="flex-row flex-wrap aspect-[16/16]">
      {r(p[0], 0, "w-1/3 h-1/3")}
      {r(p[1], 1, "w-1/3 h-1/3")}
      {r(p[2], 2, "w-1/3 h-1/3")}
      {r(p[3], 3, "w-1/3 h-1/3")}
      {r(p[4], 4, "w-1/3 h-1/3")}
      {r(p[5], 5, "w-1/3 h-1/3")}
      {r(p[6], 6, "w-1/3 h-1/3")}
      {r(p[7], 7, "w-1/3 h-1/3")}
      {r(p[8], 8, "w-1/3 h-1/3")}
    </Box>
  ),
  // B: big hero top, 8 small bottom (4x2)
  (p, r) => (
    <Box className="aspect-[16/16]">
      {r(p[0], 0, "w-full h-1/3")}
      <Box className="flex-row flex-wrap w-full h-2/3">
        {r(p[1], 1, "w-1/4 h-1/2")}
        {r(p[2], 2, "w-1/4 h-1/2")}
        {r(p[3], 3, "w-1/4 h-1/2")}
        {r(p[4], 4, "w-1/4 h-1/2")}
        {r(p[5], 5, "w-1/4 h-1/2")}
        {r(p[6], 6, "w-1/4 h-1/2")}
        {r(p[7], 7, "w-1/4 h-1/2")}
        {r(p[8], 8, "w-1/4 h-1/2")}
      </Box>
    </Box>
  ),
  // C: hero left, 8 small right (2x4 columns)
  (p, r) => (
    <Box className="flex-row aspect-[16/16]">
      {r(p[0], 0, "w-2/3 h-full")}
      <Box className="flex-row flex-wrap w-1/3 h-full">
        {r(p[1], 1, "w-1/2 h-1/4")}
        {r(p[2], 2, "w-1/2 h-1/4")}
        {r(p[3], 3, "w-1/2 h-1/4")}
        {r(p[4], 4, "w-1/2 h-1/4")}
        {r(p[5], 5, "w-1/2 h-1/4")}
        {r(p[6], 6, "w-1/2 h-1/4")}
        {r(p[7], 7, "w-1/2 h-1/4")}
        {r(p[8], 8, "w-1/2 h-1/4")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_10: LayoutRenderer[] = [
  // A: 2x5 grid
  (p, r) => (
    <Box className="flex-row flex-wrap aspect-[16/18]">
      {r(p[0], 0, "w-1/2 h-1/5")}
      {r(p[1], 1, "w-1/2 h-1/5")}
      {r(p[2], 2, "w-1/2 h-1/5")}
      {r(p[3], 3, "w-1/2 h-1/5")}
      {r(p[4], 4, "w-1/2 h-1/5")}
      {r(p[5], 5, "w-1/2 h-1/5")}
      {r(p[6], 6, "w-1/2 h-1/5")}
      {r(p[7], 7, "w-1/2 h-1/5")}
      {r(p[8], 8, "w-1/2 h-1/5")}
      {r(p[9], 9, "w-1/2 h-1/5")}
    </Box>
  ),
  // B: 2 hero top, 8 small bottom
  (p, r) => (
    <Box className="aspect-[16/18]">
      <Box className="flex-row w-full h-1/3">
        {r(p[0], 0, "w-1/2 h-full")}
        {r(p[1], 1, "w-1/2 h-full")}
      </Box>
      <Box className="flex-row flex-wrap w-full h-2/3">
        {r(p[2], 2, "w-1/4 h-1/2")}
        {r(p[3], 3, "w-1/4 h-1/2")}
        {r(p[4], 4, "w-1/4 h-1/2")}
        {r(p[5], 5, "w-1/4 h-1/2")}
        {r(p[6], 6, "w-1/4 h-1/2")}
        {r(p[7], 7, "w-1/4 h-1/2")}
        {r(p[8], 8, "w-1/4 h-1/2")}
        {r(p[9], 9, "w-1/4 h-1/2")}
      </Box>
    </Box>
  ),
  // C: 1 hero left, 9 small right (3x3)
  (p, r) => (
    <Box className="flex-row aspect-[16/18]">
      {r(p[0], 0, "w-1/2 h-full")}
      <Box className="flex-row flex-wrap w-1/2 h-full">
        {r(p[1], 1, "w-1/3 h-1/3")}
        {r(p[2], 2, "w-1/3 h-1/3")}
        {r(p[3], 3, "w-1/3 h-1/3")}
        {r(p[4], 4, "w-1/3 h-1/3")}
        {r(p[5], 5, "w-1/3 h-1/3")}
        {r(p[6], 6, "w-1/3 h-1/3")}
        {r(p[7], 7, "w-1/3 h-1/3")}
        {r(p[8], 8, "w-1/3 h-1/3")}
        {r(p[9], 9, "w-1/3 h-1/3")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_11: LayoutRenderer[] = [
  // A: 1 hero top, 10 small bottom (5x2)
  (p, r) => (
    <Box className="aspect-[16/20]">
      {r(p[0], 0, "w-full h-1/4")}
      <Box className="flex-row flex-wrap w-full h-3/4">
        {r(p[1], 1, "w-1/5 h-1/2")}
        {r(p[2], 2, "w-1/5 h-1/2")}
        {r(p[3], 3, "w-1/5 h-1/2")}
        {r(p[4], 4, "w-1/5 h-1/2")}
        {r(p[5], 5, "w-1/5 h-1/2")}
        {r(p[6], 6, "w-1/5 h-1/2")}
        {r(p[7], 7, "w-1/5 h-1/2")}
        {r(p[8], 8, "w-1/5 h-1/2")}
        {r(p[9], 9, "w-1/5 h-1/2")}
        {r(p[10], 10, "w-1/5 h-1/2")}
      </Box>
    </Box>
  ),
  // B: 3 top, 4 middle, 4 bottom
  (p, r) => (
    <Box className="aspect-[16/20]">
      <Box className="flex-row w-full h-1/3">
        {r(p[0], 0, "w-1/3 h-full")}
        {r(p[1], 1, "w-1/3 h-full")}
        {r(p[2], 2, "w-1/3 h-full")}
      </Box>
      <Box className="flex-row w-full h-1/3">
        {r(p[3], 3, "w-1/4")}
        {r(p[4], 4, "w-1/4")}
        {r(p[5], 5, "w-1/4")}
        {r(p[6], 6, "w-1/4")}
      </Box>
      <Box className="flex-row w-full h-1/3">
        {r(p[7], 7, "w-1/4")}
        {r(p[8], 8, "w-1/4")}
        {r(p[9], 9, "w-1/4")}
        {r(p[10], 10, "w-1/4")}
      </Box>
    </Box>
  ),
  // C: 2 hero left, 9 right (3x3)
  (p, r) => (
    <Box className="flex-row aspect-[16/20]">
      <Box className="w-1/2 h-full">
        {r(p[0], 0, "w-full h-1/2")}
        {r(p[1], 1, "w-full h-1/2")}
      </Box>
      <Box className="flex-row flex-wrap w-1/2 h-full">
        {r(p[2], 2, "w-1/3 h-1/3")}
        {r(p[3], 3, "w-1/3 h-1/3")}
        {r(p[4], 4, "w-1/3 h-1/3")}
        {r(p[5], 5, "w-1/3 h-1/3")}
        {r(p[6], 6, "w-1/3 h-1/3")}
        {r(p[7], 7, "w-1/3 h-1/3")}
        {r(p[8], 8, "w-1/3 h-1/3")}
        {r(p[9], 9, "w-1/3 h-1/3")}
        {r(p[10], 10, "w-1/3 h-1/3")}
      </Box>
    </Box>
  ),
];

const LAYOUTS_12: LayoutRenderer[] = [
  // A: 3x4 grid
  (p, r) => (
    <Box className="flex-row flex-wrap aspect-[16/20]">
      {r(p[0], 0, "w-1/3 h-1/4")}
      {r(p[1], 1, "w-1/3 h-1/4")}
      {r(p[2], 2, "w-1/3 h-1/4")}
      {r(p[3], 3, "w-1/3 h-1/4")}
      {r(p[4], 4, "w-1/3 h-1/4")}
      {r(p[5], 5, "w-1/3 h-1/4")}
      {r(p[6], 6, "w-1/3 h-1/4")}
      {r(p[7], 7, "w-1/3 h-1/4")}
      {r(p[8], 8, "w-1/3 h-1/4")}
      {r(p[9], 9, "w-1/3 h-1/4")}
      {r(p[10], 10, "w-1/3 h-1/4")}
      {r(p[11], 11, "w-1/3 h-1/4")}
    </Box>
  ),
  // B: 4x3 grid
  (p, r) => (
    <Box className="flex-row flex-wrap aspect-[16/12]">
      {r(p[0], 0, "w-1/4 h-1/3")}
      {r(p[1], 1, "w-1/4 h-1/3")}
      {r(p[2], 2, "w-1/4 h-1/3")}
      {r(p[3], 3, "w-1/4 h-1/3")}
      {r(p[4], 4, "w-1/4 h-1/3")}
      {r(p[5], 5, "w-1/4 h-1/3")}
      {r(p[6], 6, "w-1/4 h-1/3")}
      {r(p[7], 7, "w-1/4 h-1/3")}
      {r(p[8], 8, "w-1/4 h-1/3")}
      {r(p[9], 9, "w-1/4 h-1/3")}
      {r(p[10], 10, "w-1/4 h-1/3")}
      {r(p[11], 11, "w-1/4 h-1/3")}
    </Box>
  ),
  // C: 4 hero (2 top, 2 bottom), 8 small middle
  (p, r) => (
    <Box className="aspect-[16/20]">
      <Box className="flex-row w-full h-1/4">
        {r(p[0], 0, "w-1/2 h-full")}
        {r(p[1], 1, "w-1/2 h-full")}
      </Box>
      <Box className="flex-row flex-wrap w-full h-1/2">
        {r(p[2], 2, "w-1/4 h-1/2")}
        {r(p[3], 3, "w-1/4 h-1/2")}
        {r(p[4], 4, "w-1/4 h-1/2")}
        {r(p[5], 5, "w-1/4 h-1/2")}
        {r(p[6], 6, "w-1/4 h-1/2")}
        {r(p[7], 7, "w-1/4 h-1/2")}
        {r(p[8], 8, "w-1/4 h-1/2")}
        {r(p[9], 9, "w-1/4 h-1/2")}
      </Box>
      <Box className="flex-row w-full h-1/4">
        {r(p[10], 10, "w-1/2 h-full")}
        {r(p[11], 11, "w-1/2 h-full")}
      </Box>
    </Box>
  ),
];

// Map from photo count to layout variants
const LAYOUT_VARIANTS: Record<number, LayoutRenderer[]> = {
  2: LAYOUTS_2,
  3: LAYOUTS_3,
  4: LAYOUTS_4,
  5: LAYOUTS_5,
  6: LAYOUTS_6,
  7: LAYOUTS_7,
  8: LAYOUTS_8,
  9: LAYOUTS_9,
  10: LAYOUTS_10,
  11: LAYOUTS_11,
  12: LAYOUTS_12,
};

/** How many style variants exist for a given photo count */
export function getVariantCount(photoCount: number): number {
  return LAYOUT_VARIANTS[photoCount]?.length ?? 1;
}

interface GridPhotoProps {
  photo: Photo;
  index: number;
  className: string;
  onPress: (photo: Photo, index: number) => void;
}

const GridPhoto = React.memo(function GridPhoto({
  photo,
  index,
  className,
  onPress,
}: GridPhotoProps) {
  return (
    <Pressable
      onPress={() => onPress(photo, index)}
      className={`p-1 ${className} active:opacity-90 active:scale-[0.98]`}
    >
      <Image
        source={{ uri: photo.uri }}
        className="w-full h-full rounded-2xl"
        alt={`Photo ${index + 1}`}
      />
    </Pressable>
  );
});

export const PhotoGrid = React.memo(function PhotoGrid({
  photos,
  onPhotoPress,
  isLoading,
  mosaicStyle = 0,
}: PhotoGridProps) {
  if (isLoading) {
    return (
      <Box className="flex-row flex-wrap">
        {Array.from({ length: photos.length }, (_, i) => i).map((i) => (
          <PhotoSkeleton key={i} index={i} width="w-1/2" />
        ))}
      </Box>
    );
  }

  if (photos.length === 0) {
    return (
      <Box className="items-center justify-center py-12 bg-background-0 rounded-3xl border-2 border-dashed border-outline-100">
        <Box className="bg-background-50 p-4 rounded-full mb-4">
          <Icon as={ImagePlus} size="xl" className="text-primary-500" />
        </Box>
        <Text className="text-typography-900 font-semibold text-center text-base">
          Your canvas is empty
        </Text>
        <Text className="text-typography-400 text-center text-sm px-6 mt-1">
          Capture a memory or pick one from your library to start your day.
        </Text>
      </Box>
    );
  }

  const renderPhoto = (photo: Photo, index: number, className: string) => (
    <GridPhoto
      key={photo.id}
      photo={photo}
      index={index}
      className={className}
      onPress={onPhotoPress}
    />
  );

  // Single photo — only one layout
  if (photos.length === 1) {
    return (
      <Box className="w-full aspect-[16/10]">
        {renderPhoto(photos[0], 0, "w-full h-full")}
      </Box>
    );
  }

  // Use layout variants for 2-8 photos
  const variants = LAYOUT_VARIANTS[photos.length];
  if (variants) {
    const idx = mosaicStyle % variants.length;
    return <>{variants[idx](photos, renderPhoto)}</>;
  }

  // Fallback for > 8 photos
  return (
    <Box className="flex-row flex-wrap">
      {photos.map((photo, index) => (
        <Box key={photo.id} className="w-1/2 aspect-square">
          {renderPhoto(photo, index, "w-full h-full")}
        </Box>
      ))}
    </Box>
  );
});
