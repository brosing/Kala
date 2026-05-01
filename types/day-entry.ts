export interface Photo {
  id: string;
  uri: string;
  filename: string;
  createdAt: number;
}

export interface Section {
  id: string;
  title?: string;
  photos: Photo[];
  note: string;
  mosaicStyle?: number;
  createdAt: number;
}

export interface DayEntry {
  date: string; // Format: YYYY-MM-DD
  sections: Section[];
  updatedAt: number;
}

export interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string; // Initial name or image URI
}

export type MonthData = CalendarDay[][];
