import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { DayEntry, Photo, User, Section } from "@/types/day-entry";

const MONTHLY_ENTRIES_PREFIX = "@daily_entries_";
const USERS_KEY = "@kala_users";
const CURRENT_USER_ID_KEY = "@kala_current_user_id";
const BASE_PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

// Performance Optimization: Hoist static array to module level to eliminate
// dynamic array allocation and callback overhead during getEntriesForYear execution.
const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

class StorageService {
  private entriesCache: Record<string, Record<string, DayEntry>> = {};
  private currentUser: User | null = null;
  private users: User[] = [];
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // Load users
      const usersData = await AsyncStorage.getItem(USERS_KEY);
      try {
        this.users = usersData ? JSON.parse(usersData) : [];
      } catch (error) {
        console.error("Error parsing users data:", error);
        this.users = [];
      }

      const currentUserId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
      this.currentUser =
        this.users.find((u) => u.id === currentUserId) || this.users[0] || null;

      if (!this.currentUser) {
        // Create default user if none exists
        const defaultUser: User = {
          id: "default",
          name: "Me",
          avatar: "M",

        };
        this.users = [defaultUser];
        this.currentUser = defaultUser;
        await this.saveUsers();
      }

      const dirInfo = await FileSystem.getInfoAsync(this.getPhotosDir());
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.getPhotosDir(), {
          intermediates: true,
        });
      }
    })();

    return this.initPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      await this.init();
    } else {
      await this.initPromise;
    }
  }

  private getPhotosDir(user: User | null = this.currentUser): string {
    const username = user?.name || "default";
    let safeUsername = username;
    const trimmedUsername = username.trim();

    // Prevent '.' or '..' from being evaluated as directory traversal
    if (trimmedUsername === "." || trimmedUsername === "..") {
      safeUsername = "_";
    } else {
      // Sanitize username to prevent path traversal and ensure valid directory name
      safeUsername = safeUsername
        .replace(/[/\\?%*:|"<>]/g, "_")
        .replace(/\.\./g, "__");
    }
    return `${BASE_PHOTOS_DIR}${safeUsername}/`;
  }

  private validateDateString(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Invalid date format. Expected YYYY-MM-DD");
    }
  }

  private validateYearMonth(year: number, month: number): void {
    if (!Number.isInteger(year) || year < 1000 || year > 9999) {
      throw new Error("Invalid year format. Expected 4-digit integer");
    }
    if (!Number.isInteger(month) || month < 0 || month > 11) {
      throw new Error("Invalid month format. Expected integer 0-11");
    }
  }

  private validateFilename(filename: string): void {
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      throw new Error("Invalid filename: Path traversal detected");
    }
  }

  private getMonthKey(year: number, month: number): string {
    const userPrefix =
      this.currentUser?.id === "default" ? "" : `${this.currentUser?.id}_`;
    return `${userPrefix}${MONTHLY_ENTRIES_PREFIX}${year}_${String(month + 1).padStart(2, "0")}`;
  }

  private getMonthKeyFromDate(dateStr: string): string {
    const [year, month] = dateStr.split("-");
    const userPrefix =
      this.currentUser?.id === "default" ? "" : `${this.currentUser?.id}_`;
    return `${userPrefix}${MONTHLY_ENTRIES_PREFIX}${year}_${month}`;
  }

  private async saveUsers(): Promise<void> {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    if (this.currentUser) {
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, this.currentUser.id);
    }
  }

  async getUsers(): Promise<User[]> {
    await this.ensureInitialized();
    return this.users;
  }

  async getCurrentUser(): Promise<User | null> {
    await this.ensureInitialized();
    return this.currentUser;
  }

  async setCurrentUser(userId: string): Promise<void> {
    await this.ensureInitialized();
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUser = user;
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
      this.entriesCache = {}; // Clear cache when switching users
    }
  }

  async addUser(name: string): Promise<User> {
    await this.ensureInitialized();
    const trimmedName = name?.trim() || "";
    if (trimmedName.length === 0) {
      throw new Error("User name cannot be empty");
    }

    // Explicitly reject purely relative path components to prevent directory wipes
    if (trimmedName === "." || trimmedName === "..") {
      throw new Error("User name contains invalid characters");
    }

    // Prevent path traversal and invalid directory characters
    if (/[/\\?%*:|"<>]/g.test(trimmedName) || trimmedName.includes("..")) {
      throw new Error("User name contains invalid characters");
    }

    // Prevent duplicate usernames (case-insensitive) to avoid directory collisions
    const duplicate = this.users.find(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicate) {
      throw new Error("A user with this name already exists");
    }

    const newUser: User = {
      id: Crypto.randomUUID(),
      name: trimmedName,
      avatar: trimmedName.charAt(0).toUpperCase(),

    };
    this.users.push(newUser);
    await this.saveUsers();
    return newUser;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.ensureInitialized();
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    if (this.users.length <= 1) {
      throw new Error("Cannot delete the last remaining user");
    }

    const userToDelete = this.users[userIndex];
    const userPhotosDir = this.getPhotosDir(userToDelete);

    // 1. Delete all monthly entries for this user FIRST (to avoid orphaned references)
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userEntryKeys = allKeys.filter((key) => {
        if (userId === "default") {
          return key.startsWith(MONTHLY_ENTRIES_PREFIX);
        }
        return key.startsWith(`${userId}_${MONTHLY_ENTRIES_PREFIX}`);
      });

      if (userEntryKeys.length > 0) {
        await AsyncStorage.multiRemove(userEntryKeys);
      }
    } catch (error) {
      console.error(
        `Error deleting storage entries for user ${userId}:`,
        error,
      );
    }

    // 2. Delete user's photos directory
    try {
      await FileSystem.deleteAsync(userPhotosDir, { idempotent: true });
    } catch (error) {
      console.error(
        `Error deleting photos directory for user ${userId}:`,
        error,
      );
    }

    // 3. Remove user from users list
    const isCurrent = this.currentUser?.id === userId;
    this.users.splice(userIndex, 1);

    // 4. If current user, switch to another one
    if (isCurrent) {
      this.currentUser = this.users[0];
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, this.currentUser.id);
    }

    await this.saveUsers();
    this.entriesCache = {}; // Clear cache
  }



  async getEntriesForMonth(
    year: number,
    month: number,
  ): Promise<Record<string, DayEntry>> {
    await this.ensureInitialized();
    this.validateYearMonth(year, month);
    const key = this.getMonthKey(year, month);

    if (this.entriesCache[key]) {
      return this.entriesCache[key];
    }

    try {
      const data = await AsyncStorage.getItem(key);
      const parsed: Record<string, any> = data ? JSON.parse(data) : {};

      const dates = Object.keys(parsed);
      for (let d = 0, len = dates.length; d < len; d++) {
        const entry = parsed[dates[d]];
        const sections = entry.sections;
        for (let i = 0, sLen = sections.length; i < sLen; i++) {
          const photos = sections[i].photos;
          for (let j = 0, pLen = photos.length; j < pLen; j++) {
            photos[j] = this.resolvePhoto(photos[j]);
          }
        }
      }

      this.entriesCache[key] = parsed as Record<string, DayEntry>;
      return parsed as Record<string, DayEntry>;
    } catch (error) {
      console.error(`Error loading entries for ${key}:`, error);
      return {};
    }
  }

  async getEntriesForMonths(
    months: { year: number; month: number }[],
  ): Promise<Record<string, DayEntry>> {
    await this.ensureInitialized();
    // Check cache first
    const monthKeys = months.map((m) => {
      this.validateYearMonth(m.year, m.month);
      return {
        ...m,
        key: this.getMonthKey(m.year, m.month),
      };
    });

    const cachedEntries: Record<string, DayEntry>[] = [];
    const keysToFetch: string[] = [];

    for (const { key } of monthKeys) {
      if (this.entriesCache[key]) {
        cachedEntries.push(this.entriesCache[key]);
      } else {
        keysToFetch.push(key);
      }
    }

    if (keysToFetch.length === 0) {
      return Object.assign({}, ...cachedEntries);
    }

    try {
      const result = await AsyncStorage.multiGet(keysToFetch);
      const fetchedEntries: Record<string, DayEntry>[] = [];
      let lastYield = Date.now();

      for (const [key, data] of result) {
        if (!key) continue;
        const parsed: Record<string, any> = data ? JSON.parse(data) : {};

        const dates = Object.keys(parsed);
        for (let d = 0, len = dates.length; d < len; d++) {
          const entry = parsed[dates[d]];
          const sections = entry.sections;
          for (let i = 0, sLen = sections.length; i < sLen; i++) {
            const photos = sections[i].photos;
            for (let j = 0, pLen = photos.length; j < pLen; j++) {
              photos[j] = this.resolvePhoto(photos[j]);
            }
          }
        }

        this.entriesCache[key] = parsed as Record<string, DayEntry>;
        fetchedEntries.push(parsed as Record<string, DayEntry>);

        // Yield to event loop to keep UI responsive
        if (Date.now() - lastYield > 8) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          lastYield = Date.now();
        }
      }

      return Object.assign({}, ...cachedEntries, ...fetchedEntries);
    } catch (error) {
      console.error(`Error loading entries for months:`, error);
      return {};
    }
  }

  async getEntriesForYear(year: number): Promise<Record<string, DayEntry>> {
    await this.ensureInitialized();
    if (!Number.isInteger(year) || year < 1000 || year > 9999) {
      throw new Error("Invalid year format. Expected 4-digit integer");
    }
    // Check cache first
    const monthKeys = MONTHS.map((month) => ({
      month,
      key: this.getMonthKey(year, month),
    }));

    const cachedEntries: Record<string, DayEntry>[] = [];
    const keysToFetch: string[] = [];

    for (const { key } of monthKeys) {
      if (this.entriesCache[key]) {
        cachedEntries.push(this.entriesCache[key]);
      } else {
        keysToFetch.push(key);
      }
    }

    if (keysToFetch.length === 0) {
      return Object.assign({}, ...cachedEntries);
    }

    try {
      const result = await AsyncStorage.multiGet(keysToFetch);
      const fetchedEntries: Record<string, DayEntry>[] = [];
      let lastYield = Date.now();

      for (const [key, data] of result) {
        if (!key) continue;
        const parsed: Record<string, any> = data ? JSON.parse(data) : {};

        const dates = Object.keys(parsed);
        for (let d = 0, len = dates.length; d < len; d++) {
          const entry = parsed[dates[d]];
          const sections = entry.sections;
          for (let i = 0, sLen = sections.length; i < sLen; i++) {
            const photos = sections[i].photos;
            for (let j = 0, pLen = photos.length; j < pLen; j++) {
              photos[j] = this.resolvePhoto(photos[j]);
            }
          }
        }

        this.entriesCache[key] = parsed as Record<string, DayEntry>;
        fetchedEntries.push(parsed as Record<string, DayEntry>);

        // Yield to event loop to keep UI responsive
        if (Date.now() - lastYield > 8) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          lastYield = Date.now();
        }
      }

      return Object.assign({}, ...cachedEntries, ...fetchedEntries);
    } catch (error) {
      console.error(`Error loading entries for year ${year}:`, error);
      return {};
    }
  }

  async getAllEntries(): Promise<Record<string, DayEntry>> {
    await this.ensureInitialized();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      // Filter keys to only include those belonging to the current user
      const entryKeys = allKeys.filter((key) => {
        if (this.currentUser?.id === "default") {
          return key.startsWith(MONTHLY_ENTRIES_PREFIX);
        }
        return key.startsWith(
          `${this.currentUser?.id}_${MONTHLY_ENTRIES_PREFIX}`,
        );
      });

      const allEntries: Record<string, DayEntry> = {};

      if (entryKeys.length > 0) {
        const result = await AsyncStorage.multiGet(entryKeys);
        let lastYield = Date.now();
        for (const [, data] of result) {
          if (data) {
            const monthEntries = JSON.parse(data);
            Object.assign(allEntries, monthEntries);

            // Yield to event loop to keep UI responsive
            if (Date.now() - lastYield > 8) {
              await new Promise((resolve) => setTimeout(resolve, 0));
              lastYield = Date.now();
            }
          }
        }
      }

      return allEntries;
    } catch (error) {
      console.error("Error loading all entries:", error);
      return {};
    }
  }

  async getEntry(date: string): Promise<DayEntry | null> {
    this.validateDateString(date);
    const [year, month] = date.split("-").map(Number);
    const entries = await this.getEntriesForMonth(year, month - 1);
    return entries[date] || null;
  }

  async saveEntry(entry: DayEntry): Promise<void> {
    await this.ensureInitialized();
    try {
      this.validateDateString(entry.date);
      const [year, month] = entry.date.split("-").map(Number);
      const key = this.getMonthKey(year, month - 1);

      const entries = await this.getEntriesForMonth(year, month - 1);

      // Create a copy for storage without URIs to reduce JSON bloat
      // URIs are absolute paths and redundant since we have filenames
      // We still need to map here because this is user data that should not be mutated in-place
      // before being saved/cached if it might affect existing references.
      const entryToSave = {
        ...entry,
        sections: entry.sections.map((s: Section) => ({
          ...s,
          photos: s.photos.map(({ uri: _, ...rest }) => rest),
        })),
      };

      entries[entry.date] = entryToSave as any;

      // Update cache with the FULL entry (including URIs) for immediate use
      this.entriesCache[key] = {
        ...entries,
        [entry.date]: entry,
      };

      await AsyncStorage.setItem(key, JSON.stringify(entries));
    } catch (error) {
      console.error("Error saving entry:", error);
      throw error;
    }
  }

  async deleteEntry(date: string): Promise<void> {
    await this.ensureInitialized();
    try {
      this.validateDateString(date);
      const [year, month] = date.split("-").map(Number);
      const key = this.getMonthKey(year, month - 1);
      const entries = await this.getEntriesForMonth(year, month - 1);
      const entry = entries[date];

      if (entry) {
        const deletePromises = entry.sections.flatMap(section =>
          section.photos.map(photo => this.deletePhoto(photo.filename))
        );
        await Promise.all(deletePromises);

        delete entries[date];
        this.entriesCache[key] = entries;
        await AsyncStorage.setItem(key, JSON.stringify(entries));
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  }

  resolvePhoto(photo: Photo): Photo {
    this.validateFilename(photo.filename);
    return {
      ...photo,
      uri: `${this.getPhotosDir()}${photo.filename}`,
    };
  }

  async savePhoto(uri: string, date: string): Promise<Photo> {
    await this.ensureInitialized();
    this.validateDateString(date);
    // Extract extension or default to jpg
    const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = ["jpg", "jpeg", "png", "webp", "heic"].includes(
      extension,
    )
      ? extension === "jpeg"
        ? "jpg"
        : extension
      : "jpg";

    const filename = `${date}_${Crypto.randomUUID()}.${safeExtension}`;
    const destinationUri = `${this.getPhotosDir()}${filename}`;

    try {
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.getPhotosDir());
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.getPhotosDir(), {
          intermediates: true,
        });
      }

      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });

      return {
        id: Crypto.randomUUID(),
        uri: destinationUri,
        filename,
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error("Error saving photo:", error);
      throw error;
    }
  }

  async deletePhoto(filename: string): Promise<void> {
    await this.ensureInitialized();
    try {
      this.validateFilename(filename);
      const uri = `${this.getPhotosDir()}${filename}`;
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  }

  async getPhotoUri(filename: string): Promise<string | null> {
    await this.ensureInitialized();
    this.validateFilename(filename);
    const uri = `${this.getPhotosDir()}${filename}`;
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? uri : null;
  }

  async getOnboardingCompleted(): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const value = await AsyncStorage.getItem("@kala_onboarding_completed");
      return value === "true";
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  }

  async setOnboardingCompleted(): Promise<void> {
    await this.ensureInitialized();
    try {
      await AsyncStorage.setItem("@kala_onboarding_completed", "true");
    } catch (error) {
      console.error("Error setting onboarding status:", error);
      throw error;
    }
  }

  async isTipDismissed(tipId: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const value = await AsyncStorage.getItem(`@tip_status_${tipId}`);
      return value === "dismissed";
    } catch (error) {
      console.error(`Error checking tip status for ${tipId}:`, error);
      return false;
    }
  }

  async dismissTip(tipId: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await AsyncStorage.setItem(`@tip_status_${tipId}`, "dismissed");
    } catch (error) {
      console.error(`Error dismissing tip ${tipId}:`, error);
      throw error;
    }
  }

  async getHomeTheme(): Promise<"minimal" | "super-minimal"> {
    await this.ensureInitialized();
    try {
      const theme = await AsyncStorage.getItem("@home_theme");
      return (theme as "minimal" | "super-minimal") || "minimal";
    } catch (error) {
      console.error("Error getting home theme:", error);
      return "minimal";
    }
  }

  async setHomeTheme(theme: "minimal" | "super-minimal"): Promise<void> {
    await this.ensureInitialized();
    try {
      await AsyncStorage.setItem("@home_theme", theme);
    } catch (error) {
      console.error("Error setting home theme:", error);
      throw error;
    }
  }

  async getThemeMode(): Promise<"light" | "dark" | "system"> {
    await this.ensureInitialized();
    try {
      const mode = await AsyncStorage.getItem("@theme_mode");
      return (mode as "light" | "dark" | "system") || "light";
    } catch (error) {
      console.error("Error getting theme mode:", error);
      return "light";
    }
  }

  async setThemeMode(mode: "light" | "dark" | "system"): Promise<void> {
    await this.ensureInitialized();
    try {
      await AsyncStorage.setItem("@theme_mode", mode);
    } catch (error) {
      console.error("Error setting theme mode:", error);
      throw error;
    }
  }
}

export const storage = new StorageService();
