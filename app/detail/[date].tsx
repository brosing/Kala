import React, { useState, useEffect, useRef, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Photo, Section } from "@/types/day-entry";
import { PhotoSource } from "@/types/photo";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useDayEntry } from "@/hooks/use-day-entry";
import { DetailHeader } from "@/components/detail/detail-header";
import { PhotoPreviewModal } from "@/components/detail/photo-preview-modal";
import { DateStrip } from "@/components/detail/date-strip";
import * as Haptics from "expo-haptics";
import { SectionItem } from "@/components/detail/section-item";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DayDetail() {
  const router = useRouter();
  const { date: activeDate, action } = useLocalSearchParams<{
    date: string;
    action?: PhotoSource;
  }>();

  const {
    sections,
    loadGeneration,
    isLoading,
    handleSectionChange,
    addSection,
    removeSection,
    flushAndSave,
  } = useDayEntry(activeDate);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewPhotos, setPreviewPhotos] = useState<Photo[]>([]);
  const [deleteHandler, setDeleteHandler] = useState<
    ((photo: Photo) => void) | null
  >(null);
  const [updateHandler, setUpdateHandler] = useState<
    ((photo: Photo, uri: string) => Promise<void>) | null
  >(null);
  const scrollRef = useRef<Animated.FlatList<Section>>(null);

  const handleScrollToSection = useCallback((y: number) => {
    // Scroll so the section is near the top of the viewport
    // This keeps it well clear of the bottom toolbar and keyboard
    scrollRef.current?.scrollToOffset({
      offset: Math.max(0, y + 60),
      animated: true,
    });
  }, []);

  const formattedDate = activeDate
    ? new Date(activeDate + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "";

  const handlePhotoPress = useCallback(
    (
      index: number,
      sectionPhotos: Photo[],
      onDelete?: (photo: Photo) => void,
      onUpdate?: (photo: Photo, uri: string) => Promise<void>,
    ) => {
      setPreviewPhotos(sectionPhotos);
      setPreviewIndex(index);
      setDeleteHandler(() => onDelete || null);
      setUpdateHandler(() => onUpdate || null);
      setPreviewVisible(true);
    },
    [],
  );

  const handleBack = () => {
    flushAndSave();
    router.back();
  };

  const contentOpacity = useSharedValue(1);
  const isTransitioning = useRef(false);
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    flex: 1,
  }));

  useEffect(() => {
    if (isTransitioning.current) {
      isTransitioning.current = false;
      contentOpacity.value = withTiming(1, {
        duration: 80,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [loadGeneration, contentOpacity]);

  const handleDateSelect = (newDate: string) => {
    if (newDate === activeDate) return;
    flushAndSave();

    // Update the URL and clear actions - this will trigger a reactive update of activeDate
    router.setParams({ date: newDate, action: undefined });

    // Animate content transition
    isTransitioning.current = true;
    contentOpacity.value = 0; // Start fade out before the new data arrives
    contentOpacity.value = withTiming(1, {
      duration: 150,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const handleAddSection = () => {
    try {
      addSection();
      shouldScrollToBottom.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Cannot Add Section", error.message);
    }
  };

  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const shouldScrollToBottom = useRef(false);

  useEffect(() => {
    if (shouldScrollToBottom.current) {
      shouldScrollToBottom.current = false;
      // Small delay to allow the new section to layout
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [sections.length]);

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
    Haptics.selectionAsync();
  }, []);

  useEffect(() => {
    setCollapsedSections({});
  }, [activeDate]);

  const renderSectionItem = useCallback(
    ({ item: section, index }: { item: Section; index: number }) => (
      <SectionItem
        key={`${activeDate}-${section.id}`}
        section={section}
        index={index}
        isLoading={isLoading}
        isCollapsed={collapsedSections[section.id] || false}
        hasMultipleSections={sections.length > 1}
        onToggle={toggleSection}
        onUpdate={handleSectionChange}
        onRemove={removeSection}
        onPhotoPress={handlePhotoPress}
        onDate={activeDate}
        initialAction={index === 0 ? action : undefined}
        onFocus={handleScrollToSection}
      />
    ),
    [
      activeDate,
      isLoading,
      collapsedSections,
      sections.length,
      toggleSection,
      handleSectionChange,
      removeSection,
      handlePhotoPress,
      action,
      handleScrollToSection,
    ],
  );

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <DetailHeader
        formattedDate={formattedDate}
        onBack={handleBack}
        onAddSection={handleAddSection}
      />
      <DateStrip currentDate={activeDate} onDateSelect={handleDateSelect} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Animated.View style={animatedContentStyle}>
          <Animated.FlatList
            ref={scrollRef as any}
            data={sections}
            renderItem={renderSectionItem}
            keyExtractor={(item: Section) => `${activeDate}-${item.id}`}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            removeClippedSubviews={Platform.OS === "android"}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        </Animated.View>
      </KeyboardAvoidingView>

      <PhotoPreviewModal
        photos={previewPhotos}
        initialIndex={previewIndex}
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        onDelete={async (_photo: Photo) => {
          if (deleteHandler) {
            deleteHandler(_photo);
          }
          setPreviewVisible(false);
        }}
        onUpdatePhoto={async (photo, newUri) => {
          // Find the section this photo belongs to and trigger its update
          // However, since handlePhotoPress sets previewPhotos as a static copy,
          // we update it locally for immediate effect.
          setPreviewPhotos((prev) =>
            prev.map((p) => (p.id === photo.id ? { ...p, uri: newUri } : p)),
          );

          // The handlePhotoPress now also receives the update handler
          if (updateHandler) {
            await updateHandler(photo, newUri);
          }
        }}
      />
    </SafeAreaView>
  );
}
