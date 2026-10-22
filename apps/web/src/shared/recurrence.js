import { addDays, addMonths, addWeeks, addYears } from "date-fns";
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

  // TODO(§8 #8): new Date("yyyy-MM-dd") parses as UTC midnight, which is the
  // previous local day west of UTC.
  const base =
    item.repeat_from === "completion_date" ? now : new Date(item.due_date);

  let step = FIXED_STEPS[item.recurrence];
  if (!step && item.recurrence?.startsWith("custom:")) {
    const [, n, unit] = item.recurrence.split(":");
    step = [parseInt(n, 10), unit];
  }
  const add = step && ADDERS[step[1]];
  return add ? toISODate(add(base, step[0])) : null;
}
