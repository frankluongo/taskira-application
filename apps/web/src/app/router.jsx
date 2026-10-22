import { createHashRouter } from "react-router";
import Today from "@/pages/Today";
import Habits from "@/pages/Habits";
import Chores from "@/pages/Chores";
import KitchenSink from "@/pages/KitchenSink";
import Tasks from "@/pages/Tasks";
import Projects from "@/pages/Projects";
import Checklists from "@/pages/Checklists";

import { Taskira } from "@/features";
import { ChecklistDetailRoute, LoginRoute, ProtectedRoute } from "@/pages";

export const router = createHashRouter([
  {
    element: <Taskira />,
    children: [
      { path: "/login", element: <LoginRoute /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Today /> },
          { path: "habits", element: <Habits /> },
          { path: "chores", element: <Chores /> },
          { path: "tasks", element: <Tasks /> },
          { path: "projects", element: <Projects /> },
          { path: "checklists", element: <Checklists /> },
          { path: "checklists/:id", element: <ChecklistDetailRoute /> },
          { path: "kitchen-sink", element: <KitchenSink /> },
        ],
      },
    ],
  },
]);
