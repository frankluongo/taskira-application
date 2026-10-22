import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { todayISO } from "@/shared/date";
import { isHabitDone, isHabitScheduledOn } from "./habits.rules";

// Scheduled today and not yet completed.
export function getHabitsDueToday(habits, completions, now = new Date()) {
  const today = todayISO(now);
  return habits.filter(
    (h) => !isHabitDone(completions, h.id, today) && isHabitScheduledOn(h, now),
  );
}

// One group's habits for the Habits page, sorted. `visible` also hides
// habits completed today unless showCompleted.
export function getGroupHabits(
  habits,
  { group, dueTodayIds, completions, today, showCompleted },
) {
  const all = habits
    .filter((h) => h.group_name === group)
    .filter((h) => !dueTodayIds || dueTodayIds.has(h.id))
    .sort((a, b) => a.sort_order - b.sort_order);
  const visible = showCompleted
    ? all
    : all.filter((h) => !isHabitDone(completions, h.id, today));
  return { all, visible };
}

export function useHabitsDueToday() {
  const { habits, completions } = useStore(
    useShallow((s) => ({ habits: s.habits, completions: s.habit_completions })),
  );
  return useMemo(
    () => getHabitsDueToday(habits, completions, new Date()),
    [habits, completions],
  );
}

export function useIsHabitDone(habitId) {
  return useStore((s) => isHabitDone(s.habit_completions, habitId, todayISO()));
}
