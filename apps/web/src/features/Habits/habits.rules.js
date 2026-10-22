import { toISODate } from "@/shared/date";

// Day-of-week (0 = Sunday) match for each habit recurrence.
const DAY_MATCHERS = {
  daily: () => true,
  weekdays: (dow) => dow >= 1 && dow <= 5,
  weekends: (dow) => dow === 0 || dow === 6,
  specific_days: (dow, habit) => Boolean(habit.recurrence_days?.includes(dow)),
};

export function isHabitScheduledOn(habit, date) {
  const day = toISODate(date);
  if (habit.start_date && habit.start_date > day) return false;
  if (habit.end_date && habit.end_date < day) return false;
  const matches = DAY_MATCHERS[habit.recurrence];
  return matches ? matches(date.getDay(), habit) : true;
}

// The next alarm time after now on a day the habit recurs, within a week.
export function nextHabitOccurrence(habit, now = new Date()) {
  const [h, m] = habit.alarm_time.split(":").map(Number);
  const matches = DAY_MATCHERS[habit.recurrence];
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    candidate.setHours(h, m, 0, 0);
    if (candidate <= now) continue;
    if (matches?.(candidate.getDay(), habit)) return candidate;
  }
  return null;
}

export function habitReminder(habit, now = new Date()) {
  if (!habit.alarm_time) return null;
  const at = nextHabitOccurrence(habit, now);
  if (!at) return null;
  return { id: habit.id, title: "Habit Reminder", body: habit.name, at };
}
