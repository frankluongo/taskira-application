import { createHashRouter } from "react-router";
import Today from "@/pages/Today";
import KitchenSink from "@/pages/KitchenSink";

import { ChecklistDetailPage, ChecklistsPage } from "@/features/Checklists";
import { ChoresPage } from "@/features/Chores";
import { HabitsPage } from "@/features/Habits";
import { ProjectsPage } from "@/features/Projects";
import { TasksPage } from "@/features/Tasks";
import { AppLayout } from "./AppLayout/AppLayout";
import { LoginRoute, ProtectedRoute } from "@/pages";

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/login", element: <LoginRoute /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Today /> },
          { path: "habits", element: <HabitsPage /> },
          { path: "chores", element: <ChoresPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "checklists", element: <ChecklistsPage /> },
          { path: "checklists/:id", element: <ChecklistDetailPage /> },
          { path: "kitchen-sink", element: <KitchenSink /> },
        ],
      },
    ],
  },
]);
