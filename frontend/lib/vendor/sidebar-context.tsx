"use client";

import { createContext, useContext, useState } from "react";

const SidebarCtx = createContext<{
  collapsed: boolean;
  setCollapsed: (v: boolean | ((v: boolean) => boolean)) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCtx.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarCtx);
}
