"use client";

import { useState, useEffect } from "react";
import { Layout } from "antd";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "./sidebar";
import Header from "./header";
import PageHeader from "./page-header";
import FullPageLoading from "./fullpage-loading";
import type { MenuItemType } from "@/utils/constants/menu";

const { Content } = Layout;

interface LayoutProps {
  children: React.ReactNode;
  authorizedMenus: MenuItemType[];
}

export default function RouteClientLayout({
  children,
  authorizedMenus,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // 현재 메뉴 찾기 (서브메뉴도 고려)
  const findCurrentMenu = (
    menus: MenuItemType[],
    path: string
  ): MenuItemType | undefined => {
    for (const menu of menus) {
      // 정확한 경로 매칭
      if (menu.path === path) {
        return menu;
      }
      
      // 서브메뉴 확인
      if (menu.children) {
        const found = findCurrentMenu(menu.children, path);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  };

  // 사이드바에서 표시할 경로 (첫 번째 세그먼트)
  const getMainPath = (path: string): string => {
    if (path === "/") return "/";
    const segments = path.split("/").filter(Boolean);
    return `/${segments[0]}`;
  };

  const currentPath =
    pathname === "/"
      ? "/"
      : getMainPath(pathname);

  const currentMenu = findCurrentMenu(authorizedMenus, pathname);
  
  // 페이지 헤더에 보여줄 메뉴는 현재 페이지의 메뉴 또는 부모 메뉴
  const displayMenu = currentMenu || authorizedMenus.find(m => m.path === currentPath);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "loading") {
    return <FullPageLoading />;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar
        menus={authorizedMenus}
        collapsed={collapsed}
        currentPath={currentPath}
      />
      <Layout>
        <Header
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          email={session?.user?.email || ""}
        />
        <Content>
          {displayMenu && currentPath !== "/" && (
            <PageHeader
              title={displayMenu.label}
              subtitle={displayMenu.description}
            />
          )}
          <div
            style={{
              padding: "24px",
              background: "white",
            }}
            className="min-h-[calc(100vh-210px)]"
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}