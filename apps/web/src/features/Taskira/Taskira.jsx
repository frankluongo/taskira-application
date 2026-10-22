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
import { PageHeaderContext } from "./PageHeaderContext";
import css from "./Taskira.module.css";

export function Taskira() {
  const { initialize, initialized, chores, habits, tasks } = useStore();
  const { user } = useAuth();
  // Stored but not rendered yet (spec §8 #1); Phase 2 renders it.
  // eslint-disable-next-line no-unused-vars
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

  const outlet = (
    <PageHeaderContext.Provider value={setPageHeader}>
      <Outlet />
    </PageHeaderContext.Provider>
  );

  if (!user) return outlet;

  return (
    <>
      <Header variant="site">
        <h1 className={css.siteTitle}>Taskira</h1>
        <button onClick={handleLogout} className={css.signOut}>
          Sign out
        </button>
      </Header>
      <Main>
        <PageHeaderContext.Provider value={setPageHeader}>
          <Outlet />
        </PageHeaderContext.Provider>
      </Main>
      <AppNavigation />
    </>
  );
}
