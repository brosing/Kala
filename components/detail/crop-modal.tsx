import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Dimensions,
  Image as RNImage,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  cancelAnimation,
} from "react-native-reanimated";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { X, Check, RotateCw } from "lucide-react-native";
import { ASPECT_RATIOS } from "@/constants/measure";

const SCREEN = Dimensions.get("window");
const CROP_PADDING = 24;
const MAX_CROP_W = SCREEN.width - CROP_PADDING * 2;
const MAX_CROP_H = SCREEN.height * 0.55;

function getCropFrameSize(
  ratio: [number, number] | null,
  imgW: number,
  imgH: number,
) {
  const r = ratio ? ratio[0] / ratio[1] : imgW / imgH;
  let w = MAX_CROP_W;
  let h = w / r;
  if (h > MAX_CROP_H) {
    h = MAX_CROP_H;
    w = h * r;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

interface CropModalProps {
  uri: string | null;
  visible: boolean;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
}

export function CropModal({
  uri,
  visible,
  onConfirm,
  onCancel,
}: CropModalProps) {
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<
    (typeof ASPECT_RATIOS)[number]
  >(ASPECT_RATIOS[0]);
  const [isCropping, setIsCropping] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const limitX = useSharedValue(0);
  const limitY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const [workingUri, setWorkingUri] = useState<string | null>(null);

  useEffect(() => {
    const initImage = async () => {
      if (visible && uri) {
        setSelectedRatio(ASPECT_RATIOS[0]);
        setImgDims(null);
        translateX.value = 0;
        translateY.value = 0;
        savedX.value = 0;
        savedY.value = 0;
        scale.value = 1;
        savedScale.value = 1;

        let activeUri = uri;

        // Pre-convert HEIC to JPEG to avoid rotation/scaling bugs during crop
        if (uri.toLowerCase().endsWith(".heic")) {
          try {
            const result = await ImageManipulator.manipulateAsync(
              uri,
              [{ rotate: 90 }], // rotate: 0 causing bug
              { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 },
            );
            activeUri = result.uri;
          } catch (e) {
            console.error("Failed to pre-convert HEIC:", e);
          }
        }

        setWorkingUri(activeUri);

        RNImage.getSize(
          activeUri,
          (w, h) => setImgDims({ w, h }),
          () => setImgDims(null),
        );
      } else {
        setWorkingUri(null);
      }
    };

    initImage();
  }, [visible, uri, translateX, translateY, savedX, savedY, scale, savedScale]);

  const handleRotate = useCallback(async () => {
    if (!workingUri) return;
    setIsCropping(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        workingUri,
        [{ rotate: 90 }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 1 },
      );
      setWorkingUri(result.uri);

      // Reset transforms
      translateX.value = 0;
      translateY.value = 0;
      savedX.value = 0;
      savedY.value = 0;
      scale.value = 1;
      savedScale.value = 1;

      // Update dims
      RNImage.getSize(
        result.uri,
        (w, h) => setImgDims({ w, h }),
        () => setImgDims(null),
      );
    } catch (e) {
      console.error("Failed to rotate image:", e);
      Alert.alert("Error", "Failed to rotate image.");
    } finally {
      setIsCropping(false);
    }
  }, [workingUri, translateX, translateY, savedX, savedY, scale, savedScale]);

  // Reset pan when ratio changes
  useEffect(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedX.value = 0;
    savedY.value = 0;
    scale.value = withSpring(1);
    savedScale.value = 1;
  }, [
    selectedRatio,
    translateX,
    translateY,
    savedX,
    savedY,
    scale,
    savedScale,
  ]);

  // Compute layout values (safe defaults when imgDims is null)
  const cropFrame = getCropFrameSize(
    selectedRatio.ratio,
    imgDims?.w ?? 1,
    imgDims?.h ?? 1,
  );
  const imgRatio = imgDims ? imgDims.w / imgDims.h : 1;
  const frameRatio = cropFrame.width / cropFrame.height;
  let displayW: number;
  let displayH: number;
  if (imgRatio > frameRatio) {
    displayH = cropFrame.height;
    displayW = cropFrame.height * imgRatio;
  } else {
    displayW = cropFrame.width;
    displayH = cropFrame.width / imgRatio;
  }

  useEffect(() => {
    limitX.value = Math.max(0, (displayW - cropFrame.width) / 2);
    limitY.value = Math.max(0, (displayH - cropFrame.height) / 2);
  }, [displayW, displayH, cropFrame.width, cropFrame.height, limitX, limitY]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      "worklet";
      cancelAnimation(translateX);
      cancelAnimation(translateY);
    })
    .onUpdate((e) => {
      "worklet";
      const s = scale.value;
      const lx = Math.max(0, (displayW * s - cropFrame.width) / 2);
      const ly = Math.max(0, (displayH * s - cropFrame.height) / 2);

      translateX.value = Math.min(
        lx,
        Math.max(-lx, savedX.value + e.translationX),
      );
      translateY.value = Math.min(
        ly,
        Math.max(-ly, savedY.value + e.translationY),
      );
    })
    .onEnd(() => {
      "worklet";
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      "worklet";
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
    })
    .onUpdate((e) => {
      "worklet";
      const oldScale = scale.value;
      const newScale = Math.max(1, savedScale.value * e.scale);
      scale.value = newScale;

      // Focal point scaling
      // focalX/Y are relative to the focal point of the gesture
      // We want to adjust translateX/Y so the focal point stays in the same place relative to the image
      const scaleUpdate = newScale / oldScale;

      // Convert focal point to be relative to the center of the crop frame
      // Since GestureDetector is on the Box, e.focalX is already relative to the Box top-left
      const focalX = e.focalX - cropFrame.width / 2;
      const focalY = e.focalY - cropFrame.height / 2;

      translateX.value =
        translateX.value - (focalX - translateX.value) * (scaleUpdate - 1);
      translateY.value =
        translateY.value - (focalY - translateY.value) * (scaleUpdate - 1);

      // Clamp during pinch to prevent "detaching"
      const lx = Math.max(0, (displayW * newScale - cropFrame.width) / 2);
      const ly = Math.max(0, (displayH * newScale - cropFrame.height) / 2);
      translateX.value = Math.min(lx, Math.max(-lx, translateX.value));
      translateY.value = Math.min(ly, Math.max(-ly, translateY.value));
    })
    .onEnd(() => {
      "worklet";
      savedScale.value = scale.value;
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleConfirm = useCallback(async () => {
    if (!imgDims || !uri) return;

    // Original = no crop unless panned/zoomed
    const isPannedOrZoomed =
      scale.value > 1.01 ||
      Math.abs(translateX.value) > 1 ||
      Math.abs(translateY.value) > 1;
    if (!selectedRatio.ratio && !isPannedOrZoomed) {
      onConfirm(uri);
      return;
    }

    const getSaveFormat = (imageUri: string) => {
      const ext = imageUri.toLowerCase().split(".").pop();
      if (ext === "png") return ImageManipulator.SaveFormat.PNG;
      if (ext === "webp") return ImageManipulator.SaveFormat.WEBP;
      // HEIC is not supported for writing, so we fall back to JPEG
      return ImageManipulator.SaveFormat.JPEG;
    };

    const isHeicOriginal = uri.toLowerCase().endsWith(".heic");

    const proceedWithCrop = async () => {
      if (!workingUri) return;
      setIsCropping(true);
      try {
        const currentScale = scale.value;
        const currentScaleVal = imgDims.w / (displayW * currentScale);

        const panXImg = -translateX.value * currentScaleVal;
        const panYImg = -translateY.value * currentScaleVal;

        const cropWImg = Math.min(
          imgDims.w,
          Math.floor(cropFrame.width * currentScaleVal),
        );
        const cropHImg = Math.min(
          imgDims.h,
          Math.floor(cropFrame.height * currentScaleVal),
        );

        const originX = Math.max(
          0,
          Math.min(
            imgDims.w - cropWImg,
            Math.floor((imgDims.w - cropWImg) / 2 + panXImg),
          ),
        );
        const originY = Math.max(
          0,
          Math.min(
            imgDims.h - cropHImg,
            Math.floor((imgDims.h - cropHImg) / 2 + panYImg),
          ),
        );

        const finalW = Math.min(cropWImg, imgDims.w - originX);
        const finalH = Math.min(cropHImg, imgDims.h - originY);

        const result = await ImageManipulator.manipulateAsync(
          workingUri,
          [
            { rotate: 0 },
            {
              crop: {
                originX,
                originY,
                width: finalW,
                height: finalH,
              },
            },
          ],
          { compress: 1, format: getSaveFormat(workingUri) },
        );
        onConfirm(result.uri);
      } catch (error) {
        console.error("Error cropping photo:", error);
        Alert.alert("Error", "Failed to crop photo. Please try again.");
      } finally {
        setIsCropping(false);
      }
    };

    if (isHeicOriginal) {
      Alert.alert(
        "Convert to JPEG?",
        "HEIC images must be converted to JPEG to be cropped. This might slightly affect metadata, but quality will remain high. ✨",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Crop & Convert",
            onPress: proceedWithCrop,
          },
        ],
      );
    } else {
      await proceedWithCrop();
    }
  }, [
    imgDims,
    uri,
    selectedRatio,
    translateX,
    translateY,
    displayW,
    cropFrame,
    onConfirm,
    scale,
    workingUri,
  ]);

  // Early returns AFTER all hooks
  if (!workingUri || !imgDims) {
    if (visible) {
      return (
        <Modal visible transparent animationType="fade">
          <Box className="flex-1 bg-black items-center justify-center">
            <ActivityIndicator size="large" color="#fff" />
          </Box>
        </Modal>
      );
    }
    return null;
  }

  const cropFrameTop = (SCREEN.height - cropFrame.height) / 2 - 40;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Box className="flex-1 bg-background-950">
        {/* Top bar */}
        <HStack className="absolute top-12 left-4 right-4 z-20 justify-between">
          <Pressable
            onPress={onCancel}
            className="p-2 bg-background-900/50 rounded-full"
          >
            <Icon as={X} size="lg" className="text-white" />
          </Pressable>
          <HStack space="md" className="items-center">
            <Pressable
              onPress={handleRotate}
              className="p-2 bg-background-900/50 rounded-full mr-2"
              disabled={isCropping}
            >
              <Icon as={RotateCw} size="lg" className="text-white" />
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="p-2 bg-background-0 rounded-full"
              disabled={isCropping}
            >
              {isCropping ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Icon as={Check} size="lg" className="text-typography-900" />
              )}
            </Pressable>
          </HStack>
        </HStack>

        {/* Crop area */}
        <GestureDetector gesture={combinedGesture}>
          <Box
            style={{
              position: "absolute",
              top: cropFrameTop,
              left: (SCREEN.width - cropFrame.width) / 2,
              width: cropFrame.width,
              height: cropFrame.height,
              overflow: "hidden",
              borderRadius: 8,
              backgroundColor: "#000",
            }}
          >
            <Animated.View
              style={[
                {
                  width: displayW,
                  height: displayH,
                  position: "absolute",
                  left: -(displayW - cropFrame.width) / 2,
                  top: -(displayH - cropFrame.height) / 2,
                },
                animatedStyle,
              ]}
            >
              <Animated.Image
                source={{ uri: workingUri }}
                style={{ width: displayW, height: displayH }}
                resizeMode="cover"
              />
            </Animated.View>
          </Box>
        </GestureDetector>

        {/* Crop frame border */}
        <Box
          style={{
            position: "absolute",
            top: cropFrameTop,
            left: (SCREEN.width - cropFrame.width) / 2,
            width: cropFrame.width,
            height: cropFrame.height,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.7)",
            borderRadius: 8,
          }}
          pointerEvents="none"
        />

        {/* Dimmed overlay areas */}
        <Box
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: cropFrameTop,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          pointerEvents="none"
        />
        <Box
          style={{
            position: "absolute",
            top: cropFrameTop + cropFrame.height,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          pointerEvents="none"
        />
        <Box
          style={{
            position: "absolute",
            top: cropFrameTop,
            left: 0,
            width: (SCREEN.width - cropFrame.width) / 2,
            height: cropFrame.height,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          pointerEvents="none"
        />
        <Box
          style={{
            position: "absolute",
            top: cropFrameTop,
            right: 0,
            width: (SCREEN.width - cropFrame.width) / 2,
            height: cropFrame.height,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          pointerEvents="none"
        />

        {/* Aspect ratio selector */}
        <Box className="absolute bottom-12 left-0 right-0 z-10">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {ASPECT_RATIOS.map((option) => {
              const isSelected = selectedRatio.label === option.label;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setSelectedRatio(option)}
                  className={`px-4 py-2 rounded-full ${
                    isSelected ? "bg-background-0" : "bg-background-800/40"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-typography-900" : "text-typography-0"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Box>
      </Box>
    </Modal>
  );
}
