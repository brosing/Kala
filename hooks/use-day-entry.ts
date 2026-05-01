import { useState, useEffect, useRef, useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { storage } from '@/services/storage';
import { widgetStorage } from '@/services/widget-storage';
import { DayEntry, Section } from '@/types/day-entry';

export function useDayEntry(date: string | undefined) {
  const [entry, setEntry] = useState<DayEntry | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadGeneration, setLoadGeneration] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSectionsRef = useRef<Section[]>([]);
  const [lastDate, setLastDate] = useState(date);

  // Sync state reset when date changes to prevent cross-date data leakage
  if (date !== lastDate) {
    setLastDate(date);
    setIsLoading(true);
    setSections([]);
    setEntry(null);
    latestSectionsRef.current = [];
  }

  const loadEntry = useCallback(async () => {
    if (!date) return;
    setIsLoading(true);
    try {
      const existingEntry = await storage.getEntry(date);
      if (existingEntry) {
        setEntry(existingEntry);
        setSections(existingEntry.sections);
        latestSectionsRef.current = existingEntry.sections;
      } else {
        // Create initial section for new entry
        const initialSection: Section = {
          id: Crypto.randomUUID(),
          photos: [],
          note: '',
          createdAt: Date.now()
        };
        const newEntry: DayEntry = {
          date,
          sections: [initialSection],
          updatedAt: Date.now()
        };
        setEntry(newEntry);
        setSections([initialSection]);
        latestSectionsRef.current = [initialSection];
      }
      setLoadGeneration(g => g + 1);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadEntry();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [date, loadEntry]);

  const saveNow = useCallback(async (currentSections: Section[]) => {
    if (!date) return;
    const newEntry: DayEntry = {
      date,
      sections: currentSections,
      updatedAt: Date.now(),
    };
    await storage.saveEntry(newEntry);
    setEntry(newEntry);
    
    // Sync with widget - ignore errors to not break main flow
    widgetStorage.updatePhotoCount(date, currentSections).catch(console.error);
  }, [date]);

  const handleSectionChange = useCallback((sectionId: string, updates: Partial<Section>, immediate?: boolean) => {
    const newSections = latestSectionsRef.current.map((s: Section) => 
      s.id === sectionId ? { ...s, ...updates } : s
    );
    setSections(newSections);
    latestSectionsRef.current = newSections;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate) {
      saveNow(newSections);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        saveNow(latestSectionsRef.current);
      }, 2000);
    }
  }, [saveNow]);

  const addSection = useCallback(() => {
    // Check if each previous section has at least one photo
    const allHavePhotos = latestSectionsRef.current.every((s: Section) => s.photos.length > 0);
    if (!allHavePhotos) {
      throw new Error('Required at least one photo in each previous section');
    }

    const newSection: Section = {
      id: Crypto.randomUUID(),
      photos: [],
      note: '',
      createdAt: Date.now()
    };
    const newSections = [...latestSectionsRef.current, newSection];
    setSections(newSections);
    latestSectionsRef.current = newSections;
    saveNow(newSections);
  }, [saveNow]);

  const removeSection = useCallback((sectionId: string) => {
    if (latestSectionsRef.current.length <= 1) return;
    const newSections = latestSectionsRef.current.filter((s: Section) => s.id !== sectionId);
    setSections(newSections);
    latestSectionsRef.current = newSections;
    saveNow(newSections);
  }, [saveNow]);

  const flushAndSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    saveNow(latestSectionsRef.current);
  };

  return {
    entry,
    sections,
    loadGeneration,
    isLoading,
    setIsLoading,
    handleSectionChange,
    addSection,
    removeSection,
    flushAndSave,
  };
}
