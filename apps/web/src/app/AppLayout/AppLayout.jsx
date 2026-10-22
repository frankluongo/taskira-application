import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useStore } from "@/lib/store";
import { useAuth } from "@/services/auth";
import { supabase } from "@/services/supabase";
import {
  requestNotificationPermission,
  rescheduleReminders,
} from "@/services/notifications";
import { habitReminder } from "@/features/Habits/habits.rules";
import { choreReminder } from "@/features/Chores/chores.rules";
import { taskReminder } from "@/features/Tasks/tasks.rules";
import { Header, Main, Spinner } from "@taskira/ui";
import { AppNavigation } from "../AppNavigation/AppNavigation";
import { PageHeader, PageHeaderContext } from "../PageHeader";
import css from "./AppLayout.module.css";

export function AppLayout() {
  const { initialize, initialized, chores, habits, tasks } = useStore();
  const { user } = useAuth();
  const [pageHeader, setPageHeader] = useState({ title: "", action: null });

  useEffect(() => {
    if (user) initialize();
  }, [user]);

  useEffect(() => {
    if (!initialized) return;
    requestNotificationPermission().then(() => {
      rescheduleReminders(chores, choreReminder);
      rescheduleReminders(habits, habitReminder);
      rescheduleReminders(tasks, taskReminder);
    });
  }, [initialized]);

  if (user && !initialized) return <Spinner />;

  function handleLogout() {
    supabase.auth.signOut();
  }

  return (
    <PageHeaderContext.Provider value={setPageHeader}>
      {user ? (
        <>
          <Header variant="site">
            <h1 className={css.siteTitle}>Taskira</h1>
            <button onClick={handleLogout} className={css.signOut}>
              Sign out
            </button>
          </Header>
          <Main>
            <PageHeader {...pageHeader} />
            <Outlet />
          </Main>
          <AppNavigation />
        </>
      ) : (
        <Outlet />
      )}
    </PageHeaderContext.Provider>
  );
}
