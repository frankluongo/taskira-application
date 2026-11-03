// "daily", and older rows with no recurrence, happen every day
export function occursOn(habit, dayOfWeek) {
  if (habit.recurrence === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (habit.recurrence === "weekends")
    return dayOfWeek === 0 || dayOfWeek === 6;
  if (habit.recurrence === "specific_days")
    return Boolean(habit.recurrence_days?.includes(dayOfWeek));
  return true;
}
