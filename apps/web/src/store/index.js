import { create } from "zustand";
import { createHabitsSlice } from "@/features/Habits/habits.slice";
import { createChoresSlice } from "@/features/Chores/chores.slice";
import { createTasksSlice } from "@/features/Tasks/tasks.slice";
import { createProjectsSlice } from "@/features/Projects/projects.slice";
import { createChecklistsSlice } from "@/features/Checklists/checklists.slice";

export const useStore = create((...a) => ({
  initialized: false,
  ...createHabitsSlice(...a),
  ...createChoresSlice(...a),
  ...createTasksSlice(...a),
  ...createProjectsSlice(...a),
  ...createChecklistsSlice(...a),
}));
