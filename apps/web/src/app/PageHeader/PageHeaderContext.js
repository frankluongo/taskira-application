import { createContext, useContext, useEffect } from "react";

export const PageHeaderContext = createContext(null);

export function usePageHeader({ title, action = null }) {
  const setPageHeader = useContext(PageHeaderContext);

  useEffect(() => {
    setPageHeader({ title, action });
  }, [setPageHeader, title, action]);
}
