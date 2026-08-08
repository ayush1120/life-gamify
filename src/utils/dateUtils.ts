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
