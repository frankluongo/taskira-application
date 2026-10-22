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

function toNotification({ id, title, body, at }) {
  return { id: notifId(id), title, body, schedule: { at } };
}

async function hasPermission() {
  const { display } = await LocalNotifications.checkPermissions();
  return display === "granted";
}

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") {
    await LocalNotifications.requestPermissions();
  }
}

// reminder: { id: uuid, title, body, at: Date } | null (null is a no-op)
export async function scheduleReminder(reminder) {
  if (!Capacitor.isNativePlatform()) return;
  if (!reminder) return;
  if (!(await hasPermission())) return;
  await LocalNotifications.schedule({
    notifications: [toNotification(reminder)],
  });
}

export async function cancelReminder(uuid) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: notifId(uuid) }] });
}

// Cancels every item with an alarm, then schedules each non-null reminder.
export async function rescheduleReminders(items, toReminder) {
  if (!Capacitor.isNativePlatform()) return;
  if (!(await hasPermission())) return;

  const ids = items
    .filter((item) => item.alarm_time)
    .map((item) => ({ id: notifId(item.id) }));
  if (ids.length > 0) await LocalNotifications.cancel({ notifications: ids });

  const toSchedule = items
    .map((item) => toReminder(item))
    .filter(Boolean)
    .map(toNotification);
  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
}
