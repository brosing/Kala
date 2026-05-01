import React, { useState } from "react";
import { Modal, Alert, useWindowDimensions } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Trash2, X, Crop } from "lucide-react-native";
import { CropModal } from "./crop-modal";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { Photo } from "@/types/day-entry";

interface PhotoPreviewModalProps {
  photos: Photo[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onDelete: (photo: Photo) => Promise<void>;
  onUpdatePhoto?: (photo: Photo, newUri: string) => Promise<void>;
}

export function PhotoPreviewModal({
  photos,
  initialIndex,
  visible,
  onClose,
  onDelete,
  onUpdatePhoto,
}: PhotoPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [isCropVisible, setIsCropVisible] = useState(false);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Shared value to store aspect ratios for all photos to fix zoom/pan bugs
  const aspectRatios = useSharedValue<Record<string, number>>({});

  // Zoom and Pan shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Paging shared values
  const scrollX = useSharedValue(initialIndex * screenWidth);
  const savedScrollX = useSharedValue(initialIndex * screenWidth);
  const activeIndexSV = useSharedValue(initialIndex);

  // Swipe-down to close shared values
  const backgroundOpacity = useSharedValue(1);
  const isSwipingDown = useSharedValue(false);
  const isClosing = useSharedValue(false);

  // Track if modal was previously visible to detect opening
  const wasVisible = React.useRef(false);

  // Synchronize state when modal opens or screen dimensions change
  React.useEffect(() => {
    if (visible && !wasVisible.current) {
      // Modal just opened
      setCurrentIndex(initialIndex);
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      savedTranslateX.value = 0;
      translateY.value = 0;
      savedTranslateY.value = 0;
      scrollX.value = initialIndex * screenWidth;
      savedScrollX.value = initialIndex * screenWidth;
      activeIndexSV.value = initialIndex;
      backgroundOpacity.value = 1;
      isSwipingDown.value = false;
      isClosing.value = false;
    } else if (visible) {
      // Just a screen dimension change or other update while visible
      // Update scroll position to maintain current index with new screenWidth
      scrollX.value = currentIndex * screenWidth;
      savedScrollX.value = currentIndex * screenWidth;
    }
    wasVisible.current = visible;
  }, [
    visible,
    initialIndex,
    screenWidth,
    currentIndex,
    scale,
    savedScale,
    translateX,
    savedTranslateX,
    translateY,
    savedTranslateY,
    scrollX,
    savedScrollX,
    activeIndexSV,
    backgroundOpacity,
    isSwipingDown,
    isClosing,
  ]);

  const currentPhoto = photos[currentIndex];

  const toggleControls = () => {
    setShowControls((prev) => !prev);
  };

  const handleCropConfirm = async (newUri: string) => {
    setIsCropVisible(false);
    if (onUpdatePhoto && currentPhoto) {
      await onUpdatePhoto(currentPhoto, newUri);
    }
  };

  const handleDelete = () => {
    if (!currentPhoto) return;

    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await onDelete(currentPhoto);
          onClose();
        },
      },
    ]);
  };

  const tapGesture = React.useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(10)
        .onStart(() => {
          if (isClosing.value) return;
        })
        .onEnd(() => {
          if (isClosing.value) return;
          runOnJS(toggleControls)();
        }),
    [isClosing],
  );

  const doubleTapGesture = React.useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
          if (isClosing.value) return;
        })
        .onEnd(() => {
          if (isClosing.value) return;
          if (scale.value > 1.1) {
            // Zoom out
            scale.value = withSpring(1);
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            savedScale.value = 1;
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
          } else {
            // Zoom in to 2x
            scale.value = withSpring(2);
            savedScale.value = 2;
          }
        }),
    [
      scale,
      translateX,
      translateY,
      savedScale,
      savedTranslateX,
      savedTranslateY,
      isClosing,
    ],
  );

  const panGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          if (isClosing.value) return;
        })
        .onUpdate((event) => {
          if (isClosing.value) return;
          if (scale.value > 1.05) {
            const photoId = photos[currentIndex]?.id;
            const aspectRatio = aspectRatios.value[photoId] || 1;
            const screenAspectRatio = screenWidth / screenHeight;
            let imgWidth, imgHeight;

            if (aspectRatio > screenAspectRatio) {
              imgWidth = screenWidth;
              imgHeight = screenWidth / aspectRatio;
            } else {
              imgHeight = screenHeight;
              imgWidth = screenHeight * aspectRatio;
            }

            const maxTranslateX = Math.max(
              0,
              (imgWidth * scale.value - screenWidth) / 2,
            );
            const maxTranslateY = Math.max(
              0,
              (imgHeight * scale.value - screenHeight) / 2,
            );

            translateX.value = Math.min(
              Math.max(
                savedTranslateX.value + event.translationX,
                -maxTranslateX,
              ),
              maxTranslateX,
            );
            translateY.value = Math.min(
              Math.max(
                savedTranslateY.value + event.translationY,
                -maxTranslateY,
              ),
              maxTranslateY,
            );
          } else {
            // Horizontal Paging with edge resistance
            const newScrollX = savedScrollX.value - event.translationX;
            const minScrollValue = 0;
            const maxScrollValue = (photos.length - 1) * screenWidth;

            // Detect swipe down if not already paging OR if it's clearly a vertical movement
            if (
              !isSwipingDown.value &&
              event.translationY > 10 &&
              Math.abs(event.translationY) > Math.abs(event.translationX) * 2
            ) {
              isSwipingDown.value = true;
            }

            if (isSwipingDown.value) {
              translateY.value = event.translationY;
              backgroundOpacity.value = Math.max(
                0.2,
                1 - event.translationY / (screenHeight * 0.6),
              );
            } else {
              if (newScrollX < minScrollValue) {
                scrollX.value =
                  minScrollValue + (newScrollX - minScrollValue) * 0.35;
              } else if (newScrollX > maxScrollValue) {
                scrollX.value =
                  maxScrollValue + (newScrollX - maxScrollValue) * 0.35;
              } else {
                scrollX.value = newScrollX;
              }
            }
          }
        })
        .onEnd((event) => {
          if (isClosing.value) return;
          if (scale.value > 1.05) {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
          } else {
            if (isSwipingDown.value) {
              if (translateY.value > 80 || event.velocityY > 600) {
                // Smooth closing animation
                isClosing.value = true;
                runOnJS(onClose)();
                backgroundOpacity.value = withSpring(0, {
                  damping: 20,
                  stiffness: 100,
                });
                translateY.value = withSpring(screenHeight, {
                  damping: 25,
                  stiffness: 150,
                  mass: 1,
                  velocity: event.velocityY,
                });
              } else {
                translateY.value = withSpring(
                  0,
                  { damping: 20, stiffness: 150 },
                  (finished) => {
                    isSwipingDown.value = false;
                  },
                );
                backgroundOpacity.value = withSpring(1, {
                  damping: 20,
                  stiffness: 150,
                });
              }
            } else {
              // Paging logic inspired by Apple Photos
              const threshold = screenWidth / 3;
              const velocityThreshold = 600;
              let nextIndex = currentIndex;

              // Decision based on velocity and translation
              if (
                event.velocityX < -velocityThreshold ||
                event.translationX < -threshold
              ) {
                // Intention: go to next photo
                if (currentIndex < photos.length - 1) {
                  nextIndex = currentIndex + 1;
                }
              } else if (
                event.velocityX > velocityThreshold ||
                event.translationX > threshold
              ) {
                // Intention: go to previous photo
                if (currentIndex > 0) {
                  nextIndex = currentIndex - 1;
                }
              }

              scrollX.value = withSpring(nextIndex * screenWidth, {
                damping: 20,
                stiffness: 150,
                mass: 1,
                overshootClamping: true,
                velocity: event.velocityX,
              });
              savedScrollX.value = nextIndex * screenWidth;
              if (nextIndex !== activeIndexSV.value) {
                activeIndexSV.value = nextIndex;
                runOnJS(setCurrentIndex)(nextIndex);
                // Reset zoom for the new photo
                translateX.value = 0;
                savedTranslateX.value = 0;
                translateY.value = 0;
                savedTranslateY.value = 0;
                scale.value = 1;
                savedScale.value = 1;
              }
            }
          }
        }),
    [
      scale,
      photos,
      aspectRatios,
      screenWidth,
      screenHeight,
      savedTranslateX,
      savedTranslateY,
      translateX,
      translateY,
      scrollX,
      savedScrollX,
      savedScale,
      activeIndexSV,
      currentIndex,
      isSwipingDown,
      backgroundOpacity,
      onClose,
      isClosing,
    ],
  );

  const pinchGesture = React.useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          if (isClosing.value) return;
        })
        .onUpdate((event) => {
          if (isClosing.value) return;
          scale.value = Math.max(1, savedScale.value * event.scale);
        })
        .onEnd(() => {
          if (isClosing.value) return;
          savedScale.value = scale.value;
          if (scale.value < 1.1) {
            scale.value = withSpring(1, { damping: 20, stiffness: 150 });
            savedScale.value = 1;
            translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
          } else {
            // Clamp position after pinch in case scale reduced bounds
            const photoId = photos[activeIndexSV.value]?.id;
            const aspectRatio = aspectRatios.value[photoId] || 1;
            const screenAspectRatio = screenWidth / screenHeight;
            let imgWidth, imgHeight;

            if (aspectRatio > screenAspectRatio) {
              imgWidth = screenWidth;
              imgHeight = screenWidth / aspectRatio;
            } else {
              imgHeight = screenHeight;
              imgWidth = screenHeight * aspectRatio;
            }

            const maxTranslateX = Math.max(
              0,
              (imgWidth * scale.value - screenWidth) / 2,
            );
            const maxTranslateY = Math.max(
              0,
              (imgHeight * scale.value - screenHeight) / 2,
            );

            const targetX = Math.min(
              Math.max(translateX.value, -maxTranslateX),
              maxTranslateX,
            );
            const targetY = Math.min(
              Math.max(translateY.value, -maxTranslateY),
              maxTranslateY,
            );

            translateX.value = withSpring(targetX, {
              damping: 20,
              stiffness: 150,
            });
            translateY.value = withSpring(targetY, {
              damping: 20,
              stiffness: 150,
            });
            savedTranslateX.value = targetX;
            savedTranslateY.value = targetY;
          }
        }),
    [
      scale,
      savedScale,
      translateX,
      translateY,
      savedTranslateX,
      savedTranslateY,
      photos,
      activeIndexSV,
      aspectRatios,
      screenWidth,
      screenHeight,
      isClosing,
    ],
  );

  // Removed Fling gestures as Pan now handles paging smoothly.

  // No longer need a single global animatedStyle as it moves during state updates.

  const scrollStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -scrollX.value }],
    };
  });

  const controlsStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  const gesture = React.useMemo(
    () =>
      Gesture.Simultaneous(
        pinchGesture,
        panGesture,
        Gesture.Exclusive(doubleTapGesture, tapGesture),
      ),
    [pinchGesture, panGesture, doubleTapGesture, tapGesture],
  );

  if (!currentPhoto) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View className="bg-background-0 flex-1 justify-center text-center">
          {showControls && (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 48,
                  left: 16,
                  right: 16,
                  zIndex: 10,
                },
                controlsStyle,
              ]}
            >
              <HStack className="justify-between">
                <HStack className="gap-2">
                  <Pressable
                    onPress={handleDelete}
                    className="p-2 bg-background-50 rounded-full"
                  >
                    <Icon as={Trash2} size="lg" />
                  </Pressable>
                  <Pressable
                    onPress={() => setIsCropVisible(true)}
                    className="p-2 bg-background-50 rounded-full"
                  >
                    <Icon as={Crop} size="lg" />
                  </Pressable>
                </HStack>
                <Pressable
                  onPress={onClose}
                  className="p-2 bg-background-50 rounded-full"
                >
                  <Icon as={X} size="lg" />
                </Pressable>
              </HStack>
            </Animated.View>
          )}

          {/* Photo counter */}
          {showControls && (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  bottom: 32,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  alignItems: "center",
                },
                controlsStyle,
              ]}
            >
              <Text className="text-sm bg-background-50 px-3 py-1 rounded-full">
                {currentIndex + 1} / {photos.length}
              </Text>
            </Animated.View>
          )}

          <Box className="flex-1 w-full overflow-hidden">
            <Animated.View
              style={[
                {
                  flexDirection: "row",
                  width: photos.length * screenWidth,
                  height: "100%",
                },
                scrollStyle,
              ]}
            >
              {photos.map((photo, index) => (
                <PreviewPhotoItem
                  key={photo.id}
                  photo={photo}
                  index={index}
                  screenWidth={screenWidth}
                  activeIndexSV={activeIndexSV}
                  translateX={translateX}
                  translateY={translateY}
                  scale={scale}
                  aspectRatios={aspectRatios}
                  isSwipingDown={isSwipingDown}
                />
              ))}
            </Animated.View>
          </Box>
        </Animated.View>
      </GestureDetector>

      <CropModal
        uri={currentPhoto?.uri || null}
        visible={isCropVisible}
        onConfirm={handleCropConfirm}
        onCancel={() => setIsCropVisible(false)}
      />
    </Modal>
  );
}

interface PreviewPhotoItemProps {
  photo: Photo;
  index: number;
  screenWidth: number;
  activeIndexSV: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  aspectRatios: SharedValue<Record<string, number>>;
  isSwipingDown: SharedValue<boolean>;
}

const PreviewPhotoItem = React.memo(
  ({
    photo,
    index,
    screenWidth,
    activeIndexSV,
    translateX,
    translateY,
    scale,
    aspectRatios,
    isSwipingDown,
  }: PreviewPhotoItemProps) => {
    const itemAnimatedStyle = useAnimatedStyle(() => {
      const isActive = index === activeIndexSV.value;
      const swipingDownScale = isSwipingDown.value
        ? 1 - Math.min(0.2, translateY.value / 1000)
        : 1;

      return {
        transform: [
          { translateX: isActive ? translateX.value : 0 },
          { translateY: isActive ? translateY.value : 0 },
          { scale: isActive ? scale.value * swipingDownScale : 1 },
        ],
      };
    });

    return (
      <Box
        style={{ width: screenWidth, height: "100%" }}
        className="items-center justify-center"
      >
        <Animated.View
          style={[{ width: "100%", height: "100%" }, itemAnimatedStyle]}
        >
          <Image
            source={{ uri: photo.uri }}
            className="w-full h-full"
            resizeMode="contain"
            alt={`Photo ${index + 1}`}
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              aspectRatios.value = {
                ...aspectRatios.value,
                [photo.id]: width / height,
              };
            }}
          />
        </Animated.View>
      </Box>
    );
  },
);

PreviewPhotoItem.displayName = "PreviewPhotoItem";
