export function choreReminder(chore, now = new Date()) {
  if (!chore.due_date || !chore.alarm_time) return null;
  const at = new Date(`${chore.due_date}T${chore.alarm_time}`);
  if (at <= now) return null;
  return { id: chore.id, title: "Chore Reminder", body: chore.name, at };
}
