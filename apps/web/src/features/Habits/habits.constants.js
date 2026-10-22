export const HABIT_GROUPS = ["AM", "Misc", "PM"];

const HABIT_RECURRENCES = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "specific_days", label: "Specific days" },
];

export const HABIT_RECURRENCE_OPTIONS = HABIT_RECURRENCES;

export const HABIT_RECURRENCE_LABELS = Object.fromEntries(
  HABIT_RECURRENCES.map(({ value, label }) => [value, label]),
);

export const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
