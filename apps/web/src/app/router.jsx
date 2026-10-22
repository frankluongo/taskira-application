import { createHashRouter } from "react-router";
import Today from "@/pages/Today";
import KitchenSink from "@/pages/KitchenSink";
import Projects from "@/pages/Projects";
import Checklists from "@/pages/Checklists";

import { ChoresPage } from "@/features/Chores";
import { HabitsPage } from "@/features/Habits";
import { TasksPage } from "@/features/Tasks";
import { AppLayout } from "./AppLayout/AppLayout";
import { ChecklistDetailRoute, LoginRoute, ProtectedRoute } from "@/pages";

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
          { path: "projects", element: <Projects /> },
          { path: "checklists", element: <Checklists /> },
          { path: "checklists/:id", element: <ChecklistDetailRoute /> },
          { path: "kitchen-sink", element: <KitchenSink /> },
        ],
      },
    ],
  },
]);
