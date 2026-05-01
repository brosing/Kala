import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage } from "@/services/storage";
import { Photo } from "@/types/day-entry";
import { MAX_PHOTOS } from "@/constants";

interface UsePhotoActionsParams {
  date: string | undefined;
  photos: Photo[];
  updatePhotos: (newPhotos: Photo[]) => void;
  saveEntryWithPhotos: (newPhotos: Photo[]) => Promise<void>;
  setIsLoading: (loading: boolean) => void;
}

export function usePhotoActions({
  date,
  photos,
  updatePhotos,
  saveEntryWithPhotos,
  setIsLoading,
}: UsePhotoActionsParams) {
  // Use refs for values that might change during async operations
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const dateRef = useRef(date);
  dateRef.current = date;

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraStatus === "granted" && libraryStatus === "granted";
  };

  const saveImage = useCallback(
    async (imageUri: string) => {
      if (!dateRef.current) return;
      setIsLoading(true);
      try {
        const photo = await storage.savePhoto(imageUri, dateRef.current);
        const newPhotos = [...photosRef.current, photo];

        // Update UI state FIRST for immediate response
        updatePhotos(newPhotos);

        // Then persist to storage
        await saveEntryWithPhotos(newPhotos);
      } catch (error) {
        console.error("Error saving photo:", error);
        Alert.alert("Error", "Failed to save photo. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [updatePhotos, saveEntryWithPhotos, setIsLoading],
  );

  const updatePhoto = useCallback(
    async (oldPhoto: Photo, newUri: string) => {
      if (!dateRef.current) return;
      setIsLoading(true);
      try {
        // Save new photo
        const newPhoto = await storage.savePhoto(newUri, dateRef.current);

        // Update photos list: replace old with new
        const newPhotos = photosRef.current.map((p: Photo) =>
          p.id === oldPhoto.id ? newPhoto : p,
        );

        // Update UI state FIRST
        updatePhotos(newPhotos);

        // Delete old photo file
        await storage.deletePhoto(oldPhoto.filename);

        // Save entry
        await saveEntryWithPhotos(newPhotos);
      } catch (error) {
        console.error("Error updating photo:", error);
        Alert.alert("Error", "Failed to update photo. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [updatePhotos, saveEntryWithPhotos, setIsLoading],
  );

  const takePhoto = useCallback(async () => {
    if (photosRef.current.length >= MAX_PHOTOS) {
      Alert.alert(
        "Full House! 🏠",
        `You've reached the ${MAX_PHOTOS} photo limit for today. But hey, the less photos, the more memorable they are! ✨`,
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Please grant camera and photo library permissions.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
      });

      // console.log('result', result.assets[0].type)

      if (!result.canceled && result.assets && result.assets[0]) {
        await saveImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  }, [saveImage]);

  const importPhoto = useCallback(async () => {
    if (photosRef.current.length >= MAX_PHOTOS) {
      Alert.alert(
        "Full House! 🏠",
        `You've reached the ${MAX_PHOTOS} photo limit for today. But hey, the less photos, the more memorable they are! ✨`,
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant photo library permission.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await saveImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error importing photo:", error);
      Alert.alert("Error", "Failed to import photo. Please try again.");
    }
  }, [saveImage]);

  const deletePhoto = useCallback(
    async (photo: Photo) => {
      const newPhotos = photosRef.current.filter(
        (p: Photo) => p.id !== photo.id,
      );

      // Update UI state FIRST
      updatePhotos(newPhotos);

      // Then delete and save
      await storage.deletePhoto(photo.filename);
      await saveEntryWithPhotos(newPhotos);
    },
    [updatePhotos, saveEntryWithPhotos],
  );

  return {
    takePhoto,
    importPhoto,
    deletePhoto,
    updatePhoto,
    maxPhotos: MAX_PHOTOS,
  };
}
