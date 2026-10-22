import { nextRecurrenceDate } from "@/shared/recurrence";

const LATER_LIMIT = 5;

const bySortOrder = (a, b) => a.sort_order - b.sort_order;
const byDueDate = (a, b) => a.due_date.localeCompare(b.due_date);

// Buckets the Chores page shows. `later` is capped at the next few chores.
export function groupChoresByDue(chores, { listId, today, tomorrow }) {
  const inList = chores.filter((c) => listId === "all" || c.list_id === listId);
  return {
    overdue: inList
      .filter(
        (c) => c.due_date && c.due_date < today && c.recurrence !== "daily",
      )
      .sort(byDueDate),
    today: inList.filter((c) => c.due_date === today).sort(bySortOrder),
    tomorrow: inList.filter((c) => c.due_date === tomorrow).sort(bySortOrder),
    later: inList
      .filter((c) => c.due_date && c.due_date > tomorrow)
      .sort(byDueDate)
      .slice(0, LATER_LIMIT),
    someday: inList
      .filter((c) => !c.due_date)
      .sort((a, b) => (a.created_at > b.created_at ? 1 : -1)),
  };
}

// Recurring chores move to their next date; one-off chores are deleted.
export function choreCompletionOutcome(chore, now = new Date()) {
  if (chore.recurrence === "daily" || (chore.recurrence && chore.due_date)) {
    return { type: "reschedule", due_date: nextRecurrenceDate(chore, now) };
  }
  return { type: "delete" };
}

export function choreReminder(chore, now = new Date()) {
  if (!chore.due_date || !chore.alarm_time) return null;
  const at = new Date(`${chore.due_date}T${chore.alarm_time}`);
  if (at <= now) return null;
  return { id: chore.id, title: "Chore Reminder", body: chore.name, at };
}
