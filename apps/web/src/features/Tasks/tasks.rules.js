import { nextRecurrenceDate } from "@/shared/recurrence";
import { INBOX_PROJECT_ID } from "./tasks.constants";

// Inbox tasks are deleted, recurring tasks move to their next date, and
// everything else is marked complete.
export function taskCompletionOutcome(task, now = new Date()) {
  if (task.project_id === INBOX_PROJECT_ID) return { type: "delete" };
  if (task.recurrence === "daily" || (task.recurrence && task.due_date)) {
    return { type: "reschedule", due_date: nextRecurrenceDate(task, now) };
  }
  return { type: "complete", completed_at: now.toISOString() };
}

export function taskReminder(task, now = new Date()) {
  if (task.completed_at || !task.due_date || !task.alarm_time) return null;
  const at = new Date(`${task.due_date}T${task.alarm_time}`);
  if (at <= now) return null;
  return { id: task.id, title: "Task Reminder", body: task.name, at };
}
