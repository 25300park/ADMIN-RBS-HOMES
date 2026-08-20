"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "./sidebar";
import Header from "./header";
import PageHeader from "./page-header";
import FullPageLoading from "./fullpage-loading";
import type { MenuItemType } from "@/utils/constants/menu";

interface LayoutProps {
  children: React.ReactNode;
  authorizedMenus: MenuItemType[];
  showAdminAlerts?: boolean;
}

export default function RouteClientLayout({ children, authorizedMenus, showAdminAlerts = true }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const findCurrentMenu = (menus: MenuItemType[], path: string): MenuItemType | undefined => {
    for (const menu of menus) {
      if (menu.path === path) return menu;
      if (menu.children) {
        const found = findCurrentMenu(menu.children, path);
        if (found) return found;
      }
    }
    return undefined;
  };

  const getMainPath = (path: string): string => {
    if (path === "/") return "/";
    return `/${path.split("/").filter(Boolean)[0]}`;
  };

  const currentPath = pathname === "/" ? "/" : getMainPath(pathname);
  const currentMenu = findCurrentMenu(authorizedMenus, pathname);
  const displayMenu = currentMenu || authorizedMenus.find((m) => m.path === currentPath);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "loading") {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* 1. 좌측 사이드바 */}
      <Sidebar menus={authorizedMenus} collapsed={collapsed} currentPath={currentPath} />
      
      {/* 2. 메인 컨텐츠 영역 (사이드바 너비에 따라 마진 조정) */}
      <main 
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Header
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          email={session?.user?.email || ""}
          showAdminAlerts={showAdminAlerts}
        />
        
        {/* 내부 컨테이너 (여백 24px) */}
        <div className="flex-1 p-6 space-y-6">
          {displayMenu && currentPath !== "/" && (
            <PageHeader title={displayMenu.label} subtitle={displayMenu.description} />
          )}
          
          <div className="bg-white rounded-xl shadow-sm border border-border min-h-[calc(100vh-210px)] p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
