import { CalendarDay } from "@/types/day-entry";

export const isToday = (day: CalendarDay, today: Date): boolean => {
  return (
    day.date === today.getDate() &&
    day.month === today.getMonth() &&
    day.year === today.getFullYear() &&
    day.isCurrentMonth
  );
};

export const isFutureDay = (day: CalendarDay, today: Date): boolean => {
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDayOfMonth = today.getDate();

  if (day.year > todayYear) return true;
  if (day.year < todayYear) return false;

  if (day.month > todayMonth) return true;
  if (day.month < todayMonth) return false;

  return day.date > todayDayOfMonth;
};

export const generateCalendarDays = (
  year: number,
  month: number,
): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i;
    const monthIndex = month === 0 ? 11 : month - 1;
    const yearValue = month === 0 ? year - 1 : year;
    days.push({
      date,
      month: monthIndex,
      year: yearValue,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: i,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Next month days
  const remainingDays = 42 - days.length; // 6 rows * 7 columns = 42
  for (let i = 1; i <= remainingDays; i++) {
    const monthIndex = month === 11 ? 0 : month + 1;
    const yearValue = month === 11 ? year + 1 : year;
    days.push({
      date: i,
      month: monthIndex,
      year: yearValue,
      isCurrentMonth: false,
    });
  }

  return days;
};
