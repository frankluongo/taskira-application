import { createHashRouter } from "react-router";

import { LoginPage } from "@/features/Auth/LoginPage";
import { ProtectedRoute } from "@/features/Auth/ProtectedRoute";
import { ChecklistDetailPage } from "@/features/Checklists/ChecklistDetailPage";
import { ChecklistsPage } from "@/features/Checklists/ChecklistsPage";
import { ChoresPage } from "@/features/Chores/ChoresPage";
import { HabitsPage } from "@/features/Habits/HabitsPage";
import { KitchenSinkPage } from "@/features/KitchenSink/KitchenSinkPage";
import { ProjectsPage } from "@/features/Projects/ProjectsPage";
import { Taskira } from "@/features/Taskira/Taskira";
import { TasksPage } from "@/features/Tasks/TasksPage";
import { TodayPage } from "@/features/Today/TodayPage";

export const router = createHashRouter([
  {
    element: <Taskira />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: "habits", element: <HabitsPage /> },
          { path: "chores", element: <ChoresPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "checklists", element: <ChecklistsPage /> },
          { path: "checklists/:id", element: <ChecklistDetailPage /> },
          { path: "kitchen-sink", element: <KitchenSinkPage /> },
        ],
      },
    ],
  },
]);
