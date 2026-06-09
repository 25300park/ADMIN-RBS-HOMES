"use client";

import { Layout, Menu, Typography } from "antd";
import {
  TeamOutlined,
  HomeOutlined,
  CalendarOutlined,
  DashboardOutlined,
  SolutionOutlined,
  StarOutlined,
  CommentOutlined,
  ContactsOutlined,
  MailOutlined,
  FileTextOutlined,
  SendOutlined,
  UnorderedListOutlined,
  BankOutlined,
  DollarOutlined,
  ToolOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import type { MenuItemType } from "@/utils/constants/menu";
import type { MenuProps } from "antd";

const { Sider } = Layout;
const { Text } = Typography;

const IconMap = {
  TeamOutlined,
  HomeOutlined,
  CalendarOutlined,
  DashboardOutlined,
  SolutionOutlined,
  StarOutlined,
  CommentOutlined,
  ContactsOutlined,
  MailOutlined,
  FileTextOutlined,
  SendOutlined,
  UnorderedListOutlined,
  BankOutlined,
  DollarOutlined,
  ToolOutlined,
  MessageOutlined,
};

interface SidebarProps {
  collapsed: boolean;
  menus: MenuItemType[];
  currentPath: string;
}

export default function Sidebar({
  collapsed,
  menus,
  currentPath,
}: SidebarProps) {
  // 서브메뉴가 있는 메뉴 항목을 처리하는 재귀 함수
  const buildMenuItems = (menuItems: MenuItemType[]): MenuProps["items"] => {
    return menuItems.map((item) => {
      const Icon = IconMap[item.iconName as keyof typeof IconMap];

      // 자식 메뉴가 있는 경우
      if (item.children && item.children.length > 0) {
        return {
          key: item.path,
          icon: <Icon />,
          label: item.label,
          children: buildMenuItems(item.children),
        };
      }

      // 자식 메뉴가 없는 경우 (링크)
      return {
        key: item.path,
        icon: <Icon />,
        label: (
          <Link
            href={item.path}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {item.label}
          </Link>
        ),
      };
    });
  };

  // 현재 경로를 기준으로 열려있어야 할 키들을 결정
  const getOpenKeys = () => {
    const keys: string[] = [];
    
    const findParent = (items: MenuItemType[], path: string): void => {
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

  const menuItems = buildMenuItems(menus);

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        height: "100vh",
      }}
      width={250}
    >
      <div
        className="flex items-center justify-center"
        style={{
          height: "64px",
          textAlign: "center",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Text strong style={{ fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? "RH" : "RBS HOMES"}
          </Text>
        </Link>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[currentPath]}
        defaultOpenKeys={getOpenKeys()}
        style={{
          border: "none",
          height: "calc(100vh - 64px)",
          overflowY: "auto",
        }}
        items={menuItems}
      />
    </Sider>
  );
}