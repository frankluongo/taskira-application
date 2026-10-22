export function getVisibleProjects(projects, { showArchived }) {
  return projects
    .filter((p) => showArchived || !p.completed_at)
    .sort((a, b) => a.sort_order - b.sort_order);
}
