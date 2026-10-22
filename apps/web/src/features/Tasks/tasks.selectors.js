import { INBOX_PROJECT_ID } from "./tasks.constants";

const byPriorityThenOrder = (a, b) =>
  b.priority - a.priority || a.sort_order - b.sort_order;

export function getInboxTasks(tasks, { todayOnly, today }) {
  return tasks
    .filter((t) => !t.parent_task_id && t.project_id === INBOX_PROJECT_ID)
    .filter((t) => !todayOnly || t.due_date === today)
    .sort(byPriorityThenOrder);
}

export function getSubtasks(tasks, parentId) {
  return tasks.filter((t) => t.parent_task_id === parentId);
}

// Open top-level tasks due on a date, highest priority first.
export function getTasksDueOn(tasks, date) {
  return tasks
    .filter((t) => !t.parent_task_id && !t.completed_at && t.due_date === date)
    .sort((a, b) => b.priority - a.priority);
}

// Top-level non-inbox tasks, for one project or "all".
export function getProjectTasks(tasks, { projectId, includeCompleted }) {
  return tasks
    .filter((t) => t.project_id !== INBOX_PROJECT_ID && !t.parent_task_id)
    .filter((t) => projectId === "all" || t.project_id === projectId)
    .filter((t) => includeCompleted || !t.completed_at)
    .sort(byPriorityThenOrder);
}
