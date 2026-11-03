import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  requestNotificationPermission,
  rescheduleAllChoreNotifications,
  rescheduleAllHabitNotifications,
  rescheduleAllTaskNotifications,
} from "@/lib/notifications";
import { Spinner } from "@/base";
import { AppNavigation } from "./AppNavigation";
import { PageHeaderContext } from "./PageHeaderContext";
import css from "./Taskira.module.css";

export function Taskira() {
  const { initialize, initialized, chores, habits, tasks } = useStore();
  const { user } = useAuth();
  const [pageHeader, setPageHeader] = useState({ title: "", action: null });

  useEffect(() => {
    if (user) initialize();
  }, [user]);

  useEffect(() => {
    if (!initialized) return;
    requestNotificationPermission().then(() => {
      rescheduleAllChoreNotifications(chores);
      rescheduleAllHabitNotifications(habits);
      rescheduleAllTaskNotifications(tasks);
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
      <header className={css.siteHeader}>
        <h1 className={css.siteTitle}>Taskira</h1>
        <button onClick={handleLogout} className={css.signOut}>
          Sign out
        </button>
      </header>
      <main className={css.main}>
        {pageHeader.title && (
          <header className={css.pageHeader}>
            <h2 className={css.pageTitle}>{pageHeader.title}</h2>
            {pageHeader.action}
          </header>
        )}
        <div className={css.content}>
          <PageHeaderContext.Provider value={setPageHeader}>
            <Outlet />
          </PageHeaderContext.Provider>
        </div>
      </main>
      <AppNavigation />
    </>
  );
}
