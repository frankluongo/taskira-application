import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  cancelAllPendingNotifications,
  requestNotificationPermission,
  scheduleAllHabitNotifications,
  scheduleAllTaskNotifications,
} from "@/lib/notifications";
import { Spinner } from "@/base";
import { AppNavigation } from "./AppNavigation";
import { PageHeaderContext } from "./PageHeaderContext";
import css from "./Taskira.module.css";

export function Taskira() {
  const { initialize, initialized } = useStore();
  const { user } = useAuth();
  const [pageHeader, setPageHeader] = useState({ title: "", action: null });

  useEffect(() => {
    if (user) initialize();
  }, [user, initialize]);

  useEffect(() => {
    if (!initialized) return;
    // Read once at startup; store actions handle each change after that
    const { habits, tasks } = useStore.getState();
    requestNotificationPermission()
      .then(cancelAllPendingNotifications)
      .then(() => {
        scheduleAllHabitNotifications(habits);
        scheduleAllTaskNotifications(tasks);
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
              <Outlet />
            </div>
          </main>
          <AppNavigation />
        </>
      ) : (
        <Outlet />
      )}
    </PageHeaderContext.Provider>
  );
}
