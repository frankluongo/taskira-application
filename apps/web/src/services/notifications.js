import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

// Stable numeric ID derived from a UUID string (Capacitor requires integer IDs)
function notifId(uuid) {
  let hash = 5381;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash << 5) + hash + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function nextHabitOccurrence(habit) {
  const [h, m] = habit.alarm_time.split(":").map(Number);
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    candidate.setHours(h, m, 0, 0);
    if (candidate <= now) continue;
    const dow = candidate.getDay();
    if (habit.recurrence === "daily") return candidate;
    if (habit.recurrence === "weekdays" && dow >= 1 && dow <= 5)
      return candidate;
    if (habit.recurrence === "weekends" && (dow === 0 || dow === 6))
      return candidate;
    if (
      habit.recurrence === "specific_days" &&
      habit.recurrence_days?.includes(dow)
    )
      return candidate;
  }
  return null;
}

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") {
    await LocalNotifications.requestPermissions();
  }
}

export async function scheduleChoreNotification(chore) {
  if (!Capacitor.isNativePlatform()) return;
  if (!chore.due_date || !chore.alarm_time) return;
  const at = new Date(`${chore.due_date}T${chore.alarm_time}`);
  if (at <= new Date()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: notifId(chore.id),
        title: "Chore Reminder",
        body: chore.name,
        schedule: { at },
      },
    ],
  });
}

export async function cancelChoreNotification(choreId) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({
    notifications: [{ id: notifId(choreId) }],
  });
}

export async function rescheduleAllChoreNotifications(chores) {
  if (!Capacitor.isNativePlatform()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;

  const ids = chores
    .filter((e) => e.alarm_time)
    .map((e) => ({ id: notifId(e.id) }));
  if (ids.length > 0) await LocalNotifications.cancel({ notifications: ids });

  const now = new Date();
  const toSchedule = chores
    .filter((e) => e.due_date && e.alarm_time)
    .map((e) => ({ chore: e, at: new Date(`${e.due_date}T${e.alarm_time}`) }))
    .filter(({ at }) => at > now)
    .map(({ chore, at }) => ({
      id: notifId(chore.id),
      title: "Chore Reminder",
      body: chore.name,
      schedule: { at },
    }));

  if (toSchedule.length > 0)
    await LocalNotifications.schedule({ notifications: toSchedule });
}

export async function scheduleHabitNotification(habit) {
  if (!Capacitor.isNativePlatform()) return;
  if (!habit.alarm_time) return;
  const at = nextHabitOccurrence(habit);
  if (!at) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: notifId(habit.id),
        title: "Habit Reminder",
        body: habit.name,
        schedule: { at },
      },
    ],
  });
}

export async function cancelHabitNotification(habitId) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({
    notifications: [{ id: notifId(habitId) }],
  });
}

export async function rescheduleAllHabitNotifications(habits) {
  if (!Capacitor.isNativePlatform()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;

  const ids = habits
    .filter((h) => h.alarm_time)
    .map((h) => ({ id: notifId(h.id) }));
  if (ids.length > 0) await LocalNotifications.cancel({ notifications: ids });

  const toSchedule = habits
    .filter((h) => h.alarm_time)
    .map((h) => ({ habit: h, at: nextHabitOccurrence(h) }))
    .filter(({ at }) => at != null)
    .map(({ habit, at }) => ({
      id: notifId(habit.id),
      title: "Habit Reminder",
      body: habit.name,
      schedule: { at },
    }));

  if (toSchedule.length > 0)
    await LocalNotifications.schedule({ notifications: toSchedule });
}

export async function scheduleTaskNotification(task) {
  if (!Capacitor.isNativePlatform()) return;
  if (task.completed_at || !task.due_date || !task.alarm_time) return;
  const at = new Date(`${task.due_date}T${task.alarm_time}`);
  if (at <= new Date()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: notifId(task.id),
        title: "Task Reminder",
        body: task.name,
        schedule: { at },
      },
    ],
  });
}

export async function cancelTaskNotification(taskId) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: notifId(taskId) }] });
}

export async function rescheduleAllTaskNotifications(tasks) {
  if (!Capacitor.isNativePlatform()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;

  const ids = tasks
    .filter((t) => t.alarm_time)
    .map((t) => ({ id: notifId(t.id) }));
  if (ids.length > 0) await LocalNotifications.cancel({ notifications: ids });

  const now = new Date();
  const toSchedule = tasks
    .filter((t) => !t.completed_at && t.due_date && t.alarm_time)
    .map((t) => ({ task: t, at: new Date(`${t.due_date}T${t.alarm_time}`) }))
    .filter(({ at }) => at > now)
    .map(({ task, at }) => ({
      id: notifId(task.id),
      title: "Task Reminder",
      body: task.name,
      schedule: { at },
    }));

  if (toSchedule.length > 0)
    await LocalNotifications.schedule({ notifications: toSchedule });
}
