import * as FileSystem from "expo-file-system/legacy";
import { storage } from "@/services/storage";
import { DayEntry } from "@/types/day-entry";
import { htmlToMarkdown } from "@/utils/markdown";

const REGEX_INVALID_CHARS = /[/\\?%*:|"<>]/g;
const REGEX_DOUBLE_DOTS = /\.\./g;

export type ExportResult = {
  status: "success" | "no_data";
  exportedCount: number;
  exportDir?: string;
  message?: string;
};

export async function prepareExport(
  monthEntriesArr: Record<string, DayEntry>,
  folderName: string,
  onProgress: (progress: number) => void,
  username?: string,
): Promise<ExportResult> {
  const monthEntries = Object.entries(monthEntriesArr);

  if (monthEntries.length === 0) {
    return { status: "no_data", exportedCount: 0 };
  }

  const exportBase = `${FileSystem.cacheDirectory}export/`;
  const safeUsername = username
    ?.replace(REGEX_INVALID_CHARS, "_")
    .replace(REGEX_DOUBLE_DOTS, "__");
  // Security enhancement: Prevent path traversal in export folder names
  const safeFolderName = folderName
    .replace(REGEX_INVALID_CHARS, "_")
    .replace(REGEX_DOUBLE_DOTS, "__");
  const nameSuffix = safeUsername
    ? `${safeUsername}-${safeFolderName}`
    : safeFolderName;
  const exportDir = `${exportBase}Kala-${nameSuffix}/`;

  const baseInfo = await FileSystem.getInfoAsync(exportBase);
  if (baseInfo.exists) {
    await FileSystem.deleteAsync(exportBase, { idempotent: true });
  }
  await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });

  let exportedCount = 0;
  const totalEntries = monthEntries.length;
  onProgress(0);

  // Phase 1: Collect directories
  const dirsToCreate: string[] = [];

  for (const [date, entry] of monthEntries as [string, DayEntry][]) {
    const validSections = entry.sections.filter(
      (s) => s.note.trim().length > 0 || (s.photos && s.photos.length > 0),
    );

    if (validSections.length === 0) {
      continue;
    }

    const safeDate = date
      .replace(REGEX_INVALID_CHARS, "_")
      .replace(REGEX_DOUBLE_DOTS, "__");
    const dayDir = `${exportDir}${safeDate}/`;

    if (validSections.length === 1) {
      dirsToCreate.push(dayDir);
    } else {
      let defaultSectionCounter = 1;
      const usedFolderNames = new Set<string>();

      for (const section of validSections) {
        const sectionTitle =
          section.title?.trim() || `Section ${defaultSectionCounter++}`;
        const safeSectionTitle = sectionTitle
          .replace(REGEX_INVALID_CHARS, "_")
          .replace(REGEX_DOUBLE_DOTS, "__");

        let finalFolderName = safeSectionTitle;
        let duplicateCounter = 1;
        while (usedFolderNames.has(finalFolderName.toLowerCase())) {
          finalFolderName = `${safeSectionTitle}_${duplicateCounter++}`;
        }
        usedFolderNames.add(finalFolderName.toLowerCase());

        const sectionDir = `${dayDir}${finalFolderName}/`;
        dirsToCreate.push(sectionDir);
      }
    }
  }

  // Phase 2: Create directories sequentially to avoid bridge overload
  for (const dir of dirsToCreate) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  // Phase 3: Process file operations
  for (const [date, entry] of monthEntries as [string, DayEntry][]) {
    const validSections = entry.sections.filter(
      (s) => s.note.trim().length > 0 || (s.photos && s.photos.length > 0),
    );

    if (validSections.length === 0) {
      continue;
    }

    const safeDate = date
      .replace(REGEX_INVALID_CHARS, "_")
      .replace(REGEX_DOUBLE_DOTS, "__");
    const dayDir = `${exportDir}${safeDate}/`;

    if (validSections.length === 1) {
      const section = validSections[0];
      const trimmedNote = section.note.trim();
      const hasPhotos = section.photos && section.photos.length > 0;

      // Direct photos to dayDir
      if (hasPhotos) {
        await Promise.all(
          section.photos.map(async (photo) => {
            try {
              const photoUri = await storage.getPhotoUri(photo.filename);
              if (photoUri) {
                const exportPhotoPath = `${dayDir}Kala-${photo.filename}`;
                await FileSystem.copyAsync({
                  from: photoUri,
                  to: exportPhotoPath,
                });
              }
            } catch (error) {
              console.error(`Error copying photo ${photo.filename}:`, error);
            }
          }),
        );
      }

      // Direct note to dayDir
      if (trimmedNote.length > 0) {
        let markdown = `# ${date}\n`;
        if (section.title?.trim()) {
          markdown += `## ${section.title.trim()}\n`;
        }
        markdown += `\n${htmlToMarkdown(trimmedNote)}\n\n`;

        await FileSystem.writeAsStringAsync(
          `${dayDir}Kala-${safeDate}.md`,
          markdown,
          {
            encoding: FileSystem.EncodingType.UTF8,
          },
        );
      }
    } else {
      let defaultSectionCounter = 1;
      const usedFolderNames = new Set<string>();

      for (const section of validSections) {
        const trimmedNote = section.note.trim();
        const hasPhotos = section.photos && section.photos.length > 0;

        // Determine folder name
        const sectionTitle =
          section.title?.trim() || `Section ${defaultSectionCounter++}`;
        const safeSectionTitle = sectionTitle
          .replace(REGEX_INVALID_CHARS, "_")
          .replace(REGEX_DOUBLE_DOTS, "__");

        let finalFolderName = safeSectionTitle;
        let duplicateCounter = 1;
        while (usedFolderNames.has(finalFolderName.toLowerCase())) {
          finalFolderName = `${safeSectionTitle}_${duplicateCounter++}`;
        }
        usedFolderNames.add(finalFolderName.toLowerCase());

        const sectionDir = `${dayDir}${finalFolderName}/`;

        // Move photos to section directory
        if (hasPhotos) {
          await Promise.all(
            section.photos.map(async (photo) => {
              try {
                const photoUri = await storage.getPhotoUri(photo.filename);
                if (photoUri) {
                  const exportPhotoPath = `${sectionDir}Kala-${photo.filename}`;
                  await FileSystem.copyAsync({
                    from: photoUri,
                    to: exportPhotoPath,
                  });
                }
              } catch (error) {
                console.error(`Error copying photo ${photo.filename}:`, error);
              }
            }),
          );
        }

        // Write note to section directory
        if (trimmedNote.length > 0) {
          let markdown = `# ${date}\n`;
          if (section.title?.trim()) {
            markdown += `## ${section.title.trim()}\n`;
          }
          markdown += `\n${htmlToMarkdown(trimmedNote)}\n\n`;

          const safeFileName = finalFolderName.substring(0, 30);
          await FileSystem.writeAsStringAsync(
            `${sectionDir}Kala-${safeDate}-${safeFileName}.md`,
            markdown,
            {
              encoding: FileSystem.EncodingType.UTF8,
            },
          );
        }
      }
    }

    exportedCount++;
    onProgress(Math.round((exportedCount / totalEntries) * 100));
  }

  return {
    status: "success",
    exportedCount,
    exportDir,
  };
}
