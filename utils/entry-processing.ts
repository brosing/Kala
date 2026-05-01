import { DayEntry } from "@/types/day-entry";

export const processEntries = (
  entries: Record<string, DayEntry>,
): Record<string, { photoCount: number; thumbnails: string[] }> => {
  const entryMap: Record<string, { photoCount: number; thumbnails: string[] }> =
    {};

  // Performance Optimization: Use `for...in` instead of `Object.entries().forEach`
  // to avoid intermediate array allocations and closure overhead.
  for (const date in entries) {
    if (!Object.prototype.hasOwnProperty.call(entries, date)) continue;

    const entry = entries[date];
    let photoCount = 0;
    let lastPhotoUri: string | undefined = undefined;

    // Performance Optimization: Use a standard indexed loop instead of `for...of`
    // to eliminate iterator instantiation overhead.
    const sections = entry.sections;
    const sectionsLen = sections.length;
    for (let i = 0; i < sectionsLen; i++) {
      const section = sections[i];
      const pLen = section.photos.length;
      photoCount += pLen;
      if (pLen > 0) {
        lastPhotoUri = section.photos[pLen - 1].uri;
      }
    }

    entryMap[date] = {
      photoCount,
      thumbnails: lastPhotoUri ? [lastPhotoUri] : [],
    };
  }

  return entryMap;
};
