export function getChoresDueOn(chores, date) {
  return chores.filter((c) => c.due_date === date);
}
