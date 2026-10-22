export function taskReminder(task, now = new Date()) {
  if (task.completed_at || !task.due_date || !task.alarm_time) return null;
  const at = new Date(`${task.due_date}T${task.alarm_time}`);
  if (at <= now) return null;
  return { id: task.id, title: "Task Reminder", body: task.name, at };
}
