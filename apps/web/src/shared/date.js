import { addDays, format } from "date-fns";

export function toISODate(date) {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(now = new Date()) {
  return toISODate(now);
}

export function tomorrowISO(now = new Date()) {
  return toISODate(addDays(now, 1));
}

export function formatDisplayDate(date, pattern) {
  return format(date, pattern);
}

export function formatTime(time) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
