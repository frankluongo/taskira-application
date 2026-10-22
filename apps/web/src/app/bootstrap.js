import { useStore } from "@/store";
import {
  requestNotificationPermission,
  rescheduleReminders,
} from "@/services/notifications";
import { todayISO } from "@/shared/date";
import { rollDailyForward } from "@/shared/recurrence";
import {
  deleteHabits,
  fetchHabits,
  fetchTodayCompletions,
} from "@/features/Habits/habits.api";
import {
  habitReminder,
  partitionExpiredHabits,
} from "@/features/Habits/habits.rules";
import {
  fetchChoreLists,
  fetchChores,
  updateChore,
} from "@/features/Chores/chores.api";
import { choreReminder } from "@/features/Chores/chores.rules";
import { fetchTasks, updateTask } from "@/features/Tasks/tasks.api";
import { taskReminder } from "@/features/Tasks/tasks.rules";
import { fetchProjects } from "@/features/Projects/projects.api";
import {
  fetchChecklistItems,
  fetchChecklistSections,
  fetchChecklists,
} from "@/features/Checklists/checklists.api";

let inFlight = null;

// Initial load + startup cleanup + reminder reschedule. Concurrent calls
// (e.g. StrictMode's double effect in dev) share one run.
export function bootstrap() {
  inFlight ??= run().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run() {
  const today = todayISO();
  const [
    habits,
    habit_completions,
    chore_lists,
    chores,
    projects,
    tasks,
    checklists,
    checklist_sections,
    checklist_items,
  ] = await Promise.all([
    fetchHabits(),
    fetchTodayCompletions(today),
    fetchChoreLists(),
    fetchChores(),
    fetchProjects(),
    fetchTasks(),
    fetchChecklists(),
    fetchChecklistSections(),
    fetchChecklistItems(),
  ]);

  const { live, expired } = partitionExpiredHabits(habits, today);
  const freshChores = rollDailyForward(chores, today);
  const freshTasks = rollDailyForward(tasks, today);

  useStore.setState({
    habits: live,
    habit_completions,
    chore_lists,
    chores: freshChores.items,
    projects,
    tasks: freshTasks.items,
    checklists,
    checklist_sections,
    checklist_items,
    initialized: true,
  });

  if (expired.length > 0) await deleteHabits(expired.map((h) => h.id));
  await Promise.all(
    freshChores.stale.map((c) => updateChore(c.id, { due_date: today })),
  );
  await Promise.all(
    freshTasks.stale.map((t) => updateTask(t.id, { due_date: today })),
  );

  await requestNotificationPermission();
  const state = useStore.getState();
  rescheduleReminders(state.chores, choreReminder);
  rescheduleReminders(state.habits, habitReminder);
  rescheduleReminders(state.tasks, taskReminder);
}
