"use client";

import { Menu } from "antd";
import Link from "next/link";
import {
  Users, Home, Calendar, LayoutDashboard, FileCheck, Star,
  MessageSquare, Contact, Mail, FileText, Send, List,
  Landmark, DollarSign, Wrench, MessageCircle, X
} from "lucide-react";
import type { MenuItemType } from "@/utils/constants/menu";
import type { MenuProps } from "antd";
import { useEffect } from "react";

const IconMap: Record<string, React.ElementType> = {
  TeamOutlined: Users,
  HomeOutlined: Home,
  CalendarOutlined: Calendar,
  DashboardOutlined: LayoutDashboard,
  SolutionOutlined: FileCheck,
  StarOutlined: Star,
  CommentOutlined: MessageSquare,
  ContactsOutlined: Contact,
  MailOutlined: Mail,
  FileTextOutlined: FileText,
  SendOutlined: Send,
  UnorderedListOutlined: List,
  BankOutlined: Landmark,
  DollarOutlined: DollarSign,
  ToolOutlined: Wrench,
  MessageOutlined: MessageCircle,
};

interface SidebarProps {
  collapsed: boolean;
  menus: MenuItemType[];
  currentPath: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, menus, currentPath, mobileOpen = false, onMobileClose }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose?.()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen, onMobileClose])

  const buildMenuItems = (menuItems: MenuItemType[]): MenuProps["items"] => {
    return menuItems.map((item) => {
      const IconComponent = IconMap[item.iconName] || FileText;

      if (item.children && item.children.length > 0) {
        return {
          key: item.path,
          icon: <IconComponent size={18} />,
          label: <span className="font-medium">{item.label}</span>,
          children: buildMenuItems(item.children),
        };
      }

      return {
        key: item.path,
        icon: <IconComponent size={18} />,
        label: (
          <Link href={item.path} className="font-medium text-foreground hover:text-primary transition-colors">
            {item.label}
          </Link>
        ),
      };
    });
  };

  const getOpenKeys = () => {
    const keys: string[] = [];
    const findParent = (items: MenuItemType[], path: string) => {
      for (const item of items) {
        if (item.children) {
          if (item.children.some(child => currentPath.startsWith(child.path))) {
            keys.push(item.path);
          }
          findParent(item.children, path);
        }
      }
    };
    findParent(menus, currentPath);
    return keys;
  };

  const content = (mobile = false) => <>
      <div className="flex h-16 items-center justify-center border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          {/* 브랜드 포인트 컬러로 강조 */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            R
          </div>
          {(mobile || !collapsed) && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              RBS HOMES
            </span>
          )}
        </Link>
      </div>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          defaultOpenKeys={getOpenKeys()}
          className="border-none bg-transparent px-2 py-4"
          items={buildMenuItems(menus)}
          onClick={mobile ? onMobileClose : undefined}
        />
      </div>
    </>;

  return (
    <>
      <aside
        data-testid="desktop-sidebar"
        className={`fixed left-0 top-0 z-40 hidden h-screen bg-background border-r border-border transition-all duration-300 md:block ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {content()}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close navigation backdrop"
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <aside
            role="dialog"
            aria-label="Navigation"
            aria-modal="true"
            className="relative h-full w-72 max-w-[85vw] bg-background shadow-xl"
          >
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-2 top-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-lg outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onMobileClose}
            >
              <X size={20} />
            </button>
            {content(true)}
          </aside>
        </div>
      )}
    </>
  );
}
