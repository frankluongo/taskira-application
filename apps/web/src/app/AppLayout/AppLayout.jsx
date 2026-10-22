import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useStore } from "@/store";
import { signOut, useAuth } from "@/services/auth";
import { Header, Main, Spinner } from "@taskira/ui";
import { bootstrap } from "../bootstrap";
import { AppNavigation } from "../AppNavigation/AppNavigation";
import { PageHeader, PageHeaderContext } from "../PageHeader";
import css from "./AppLayout.module.css";

export function AppLayout() {
  const initialized = useStore((s) => s.initialized);
  const { user } = useAuth();
  const [pageHeader, setPageHeader] = useState({ title: "", action: null });

  useEffect(() => {
    if (user) bootstrap();
  }, [user]);

  if (user && !initialized) return <Spinner />;

  function handleLogout() {
    signOut();
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
