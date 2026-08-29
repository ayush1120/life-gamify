/**
 * Converts a Date object or ISO timestamp string into a local YYYY-MM-DD string.
 * Using local date components prevents timezone drift bugs when computing daily streaks and counts.
 */
export const toLocalDateString = (dateInput: Date | string = new Date()): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatContextDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().slice(2);
  const weekday = date.toLocaleString('default', { weekday: 'long' });
  return `${day} ${month}, ${year} ${weekday}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const getWeekDays = (baseDate: Date = new Date()): Date[] => {
  const days: Date[] = [];
  const currentDay = baseDate.getDay();
  // Go back to Sunday
  const startDate = new Date(baseDate);
  startDate.setDate(baseDate.getDate() - currentDay);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};
