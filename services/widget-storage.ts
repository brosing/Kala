import { Section } from "@/types/day-entry";
import { ExtensionStorage } from "@bacons/apple-targets";

const APP_GROUP = "group.com.mnmls.kala";

/**
 * Service to handle data sharing with the iOS Widget.
 * Syncs the photo count via App Groups and requests a widget reload.
 */
class WidgetStorageService {
  private storage = new ExtensionStorage(APP_GROUP);

  async updatePhotoCount(date: string, sections: Section[]) {
    // Only update for today's date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (date !== todayStr) return;

    const totalPhotos = sections.reduce(
      (acc, section) => acc + section.photos.length,
      0,
    );

    console.log(
      `[WidgetStorage] Updating photo count for ${date}: ${totalPhotos}`
    );

    try {
      // 1. Sync the value to the shared App Group
      this.storage.set("photoCount", totalPhotos);

      // 2. Request a reload of Home Screen widgets
      ExtensionStorage.reloadWidget();

      // 3. Request a reload of Control Center shortcuts (iOS 18+)
      ExtensionStorage.reloadControls();
    } catch (error) {
      console.error("[WidgetStorage] Failed to sync with widget:", error);
    }
  }
}

export const widgetStorage = new WidgetStorageService();
