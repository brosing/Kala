import React, { useState, useRef, useCallback, useEffect } from "react";
import { Alert, View } from "react-native";
import { useColorScheme } from "nativewind";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  Trash2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Photo, Section } from "@/types/day-entry";
import { PhotoSource } from "@/types/photo";
import { usePhotoActions } from "@/hooks/use-photo-actions";
import { PhotoGrid, getVariantCount } from "@/components/detail/photo-grid";
import { NoteSection } from "@/components/detail/note-section";
import { TitleEditor } from "./title-editor";

interface SectionItemProps {
  section: Section;
  index: number;

  isLoading: boolean;
  isCollapsed: boolean;
  hasMultipleSections: boolean;
  onToggle: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<Section>,
    immediate?: boolean,
  ) => void;
  onRemove: (id: string) => void;
  onPhotoPress: (
    index: number,
    sectionPhotos: Photo[],
    onDelete?: (photo: Photo) => void,
    onUpdate?: (photo: Photo, uri: string) => Promise<void>,
  ) => void;
  onDate: string;
  initialAction?: PhotoSource;
  onFocus?: (y: number) => void;
}

export const SectionItem = React.memo(function SectionItem({
  section,
  index,
  isLoading,
  isCollapsed,
  hasMultipleSections,
  onToggle,
  onUpdate,
  onRemove,
  onPhotoPress,
  onDate,
  initialAction,
  onFocus,
}: SectionItemProps) {
  const containerRef = useRef<View>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const actionTriggered = useRef(false);
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const handleUpdate = useCallback(
    (updates: Partial<Section>, immediate?: boolean) => {
      onUpdate(section.id, updates, immediate);
    },
    [onUpdate, section.id],
  );

  const { takePhoto, importPhoto, deletePhoto, updatePhoto } = usePhotoActions({
    date: onDate,
    photos: section.photos,
    updatePhotos: (newPhotos) => handleUpdate({ photos: newPhotos }),
    saveEntryWithPhotos: async (newPhotos) =>
      handleUpdate({ photos: newPhotos }, true), // Immediate save for photos
    setIsLoading: setIsLocalLoading,
  });

  const isSectionLoading = isLoading || isLocalLoading;

  useEffect(() => {
    if (initialAction && actionTriggered.current === false) {
      actionTriggered.current = true;
      const timer = setTimeout(() => {
        if (initialAction === "camera") takePhoto();
        if (initialAction === "photos") importPhoto();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialAction, takePhoto, importPhoto]);

  const handleDeleteSection = () => {
    Alert.alert(
      "Delete Section",
      "This will permanently delete this section and all its photos and notes. You cannot undo this action.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onRemove(section.id),
        },
      ],
    );
  };

  const handleSaveTitle = useCallback(
    (title: string) => {
      handleUpdate({ title });
      setIsEditingTitle(false);
    },
    [handleUpdate],
  );

  const handleCancelTitle = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleToggle = useCallback(() => {
    onToggle(section.id);
  }, [onToggle, section.id]);

  const handlePhotoPress = useCallback(
    (photo: Photo, idx: number) => {
      onPhotoPress(
        idx,
        section.photos,
        (p) => deletePhoto(p),
        (p, uri) => updatePhoto(p, uri),
      );
    },
    [onPhotoPress, section.photos, deletePhoto, updatePhoto],
  );

  return (
    <VStack ref={containerRef} className="bg-background-0">
      {/* Section Header */}
      <HStack className="items-center justify-between px-4 h-16 border-t border-outline-50">
        <Pressable
          onPress={handleToggle}
          disabled={!hasMultipleSections}
          className="flex-1"
        >
          <HStack className="items-center gap-2">
            <Text className="text-sm font-bold text-typography-900">
              {hasMultipleSections
                ? section.title || `Section ${index + 1}`
                : "Photos"}
            </Text>
            {hasMultipleSections && (
              <Icon
                as={isCollapsed ? ChevronDown : ChevronUp}
                size="sm"
                className="text-typography-500"
              />
            )}
          </HStack>
        </Pressable>

        {!isCollapsed && (
          <HStack className="items-center gap-2">
            {hasMultipleSections && (
              <Pressable
                onPress={() => setIsEditingTitle(true)}
                className="p-2 rounded-full"
              >
                <Edit size={18} color={isDarkMode ? "#fff" : "#000"} />
              </Pressable>
            )}
            {section.photos.length >= 2 && (
              <Pressable
                onPress={() => {
                  const count = getVariantCount(section.photos.length);
                  const next = ((section.mosaicStyle ?? 0) + 1) % count;
                  handleUpdate({ mosaicStyle: next });
                  Haptics.selectionAsync();
                }}
                className="p-2 rounded-full"
              >
                <RefreshCw size={18} color={isDarkMode ? "#fff" : "#000"} />
              </Pressable>
            )}
            <Pressable onPress={takePhoto} className="p-2 rounded-full">
              <Camera size={18} color={isDarkMode ? "#fff" : "#000"} />
            </Pressable>
            <Pressable onPress={importPhoto} className="p-2 rounded-full">
              <ImageIcon size={18} color={isDarkMode ? "#fff" : "#000"} />
            </Pressable>
            {index > 0 && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteSection();
                }}
                className="p-2 ml-1"
              >
                <Trash2 size={18} color="#ef4444" />
              </Pressable>
            )}
          </HStack>
        )}
      </HStack>

      {(!hasMultipleSections || !isCollapsed) && (
        <VStack className="p-3 pt-0 gap-2">
          <PhotoGrid
            photos={section.photos}
            onPhotoPress={handlePhotoPress}
            isLoading={isSectionLoading}
            mosaicStyle={section.mosaicStyle ?? 0}
          />

          <NoteSection
            onNoteChange={(text) => handleUpdate({ note: text })}
            isLoading={isLoading}
            defaultValue={section.note}
            onFocus={() => {
              // Measure the whole section item to get its position in the ScrollView
              containerRef.current?.measure(
                (_x, y, _width, _height, _pageX, _pageY) => {
                  // We scroll to the section's top position
                  onFocus?.(y);
                },
              );
            }}
          />
        </VStack>
      )}

      {isEditingTitle && (
        <TitleEditor
          initialTitle={section.title || `Section ${index + 1}`}
          onSave={handleSaveTitle}
          onCancel={handleCancelTitle}
          isDarkMode={isDarkMode}
        />
      )}
    </VStack>
  );
});
