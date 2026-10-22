import { addDays, addMonths, addWeeks, addYears, parseISO } from "date-fns";
import { toISODate, tomorrowISO } from "./date";

// Recurrence strings: "daily" | "weekly" | "monthly" | "yearly" | "custom:<n>:<unit>"
export const RECURRENCE_UNITS = ["days", "weeks", "months", "years"];

const RECURRENCE_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const DEFAULT_CUSTOM = { customInterval: "3", customUnit: "months" };

const ADDERS = {
  days: addDays,
  weeks: addWeeks,
  months: addMonths,
  years: addYears,
};

const FIXED_STEPS = {
  weekly: [1, "weeks"],
  monthly: [1, "months"],
  yearly: [1, "years"],
};

// Recurrence value → form state.
export function parseRecurrence(value) {
  if (!value) return { recurrence: "", ...DEFAULT_CUSTOM };
  if (value.startsWith("custom:")) {
    const [, n, unit] = value.split(":");
    return { recurrence: "custom", customInterval: n, customUnit: unit };
  }
  return { recurrence: value, ...DEFAULT_CUSTOM };
}

// Form state → recurrence value.
export function serializeRecurrence({
  recurrence,
  customInterval,
  customUnit,
}) {
  if (recurrence === "custom") {
    const n = parseInt(customInterval, 10);
    return n > 0 ? `custom:${n}:${customUnit}` : null;
  }
  return recurrence || null;
}

export function supportsRepeatFrom(recurrence) {
  return ["weekly", "monthly", "yearly", "custom"].includes(recurrence);
}

export function recurrenceLabel(value) {
  if (!value) return null;
  if (RECURRENCE_LABELS[value]) return RECURRENCE_LABELS[value];
  if (value.startsWith("custom:")) {
    const [, n, unit] = value.split(":");
    return `Every ${n} ${unit}`;
  }
  return null;
}

export function nextRecurrenceDate(item, now = new Date()) {
  if (item.recurrence === "daily") return tomorrowISO(now);

  let step = FIXED_STEPS[item.recurrence];
  if (!step && item.recurrence?.startsWith("custom:")) {
    const [, n, unit] = item.recurrence.split(":");
    step = [parseInt(n, 10), unit];
  }
  const add = step && ADDERS[step[1]];
  if (!add) return null;

  // parseISO reads "yyyy-MM-dd" as local midnight. new Date() would read it
  // as UTC midnight, which is the previous day west of UTC (spec §8 #8).
  const base =
    item.repeat_from === "completion_date" ? now : parseISO(item.due_date);
  return toISODate(add(base, step[0]));
}

// Daily items left with a past due date move to today. Returns the updated
// list and the items that were stale.
export function rollDailyForward(items, today) {
  const isStale = (item) =>
    item.recurrence === "daily" && item.due_date && item.due_date < today;
  return {
    items: items.map((item) =>
      isStale(item) ? { ...item, due_date: today } : item,
    ),
    stale: items.filter(isStale),
  };
}
