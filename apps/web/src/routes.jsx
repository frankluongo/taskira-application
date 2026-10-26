import { createHashRouter } from "react-router";

import { LoginPage, ProtectedRoute } from "@/features/Auth";
import { ChecklistDetailPage, ChecklistsPage } from "@/features/Checklists";
import { ChoresPage } from "@/features/Chores";
import { HabitsPage } from "@/features/Habits";
import { KitchenSinkPage } from "@/features/KitchenSink";
import { ProjectsPage } from "@/features/Projects";
import { Taskira } from "@/features/Taskira";
import { TasksPage } from "@/features/Tasks";
import { TodayPage } from "@/features/Today";

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
