import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { occursOn } from "./habits";

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
    if (candidate > now && occursOn(habit, candidate.getDay()))
      return candidate;
  }
  return null;
}

function habitNotification(habit) {
  if (!habit.alarm_time) return null;
  const at = nextHabitOccurrence(habit);
  if (!at) return null;
  return {
    id: notifId(habit.id),
    title: "Habit Reminder",
    body: habit.name,
    schedule: { at },
  };
}

function taskNotification(task) {
  if (!task.due_date || !task.alarm_time) return null;
  const at = new Date(`${task.due_date}T${task.alarm_time}`);
  if (at <= new Date()) return null;
  return {
    id: notifId(task.id),
    title: "Task Reminder",
    body: task.name,
    schedule: { at },
  };
}

async function schedule(notifications) {
  if (!Capacitor.isNativePlatform()) return;
  const toSchedule = notifications.filter(Boolean);
  if (toSchedule.length === 0) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;
  await LocalNotifications.schedule({ notifications: toSchedule });
}

async function cancel(uuid) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: notifId(uuid) }] });
}

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") {
    await LocalNotifications.requestPermissions();
  }
}

export async function cancelAllPendingNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length > 0)
    await LocalNotifications.cancel({ notifications });
}

export function scheduleHabitNotification(habit) {
  return schedule([habitNotification(habit)]);
}

export function cancelHabitNotification(habitId) {
  return cancel(habitId);
}

// Callers must clear pending notifications first; this only adds
export function scheduleAllHabitNotifications(habits) {
  return schedule(habits.map(habitNotification));
}

export function scheduleTaskNotification(task) {
  return schedule([taskNotification(task)]);
}

export function cancelTaskNotification(taskId) {
  return cancel(taskId);
}

// Callers must clear pending notifications first; this only adds
export function scheduleAllTaskNotifications(tasks) {
  return schedule(tasks.map(taskNotification));
}
