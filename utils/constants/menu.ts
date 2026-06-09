export const ADMIN_LEVEL = {
  SUPER_ADMIN: 0,
  ADMIN: 10,
} as const;

export type AdminLevel = (typeof ADMIN_LEVEL)[keyof typeof ADMIN_LEVEL];

export type MenuItemType = {
  key: string;
  iconName:
    | "TeamOutlined"
    | "HomeOutlined"
    | "CalendarOutlined"
    | "DashboardOutlined"
    | "UserOutlined"
    | "SolutionOutlined"
    | "StarOutlined"
    | "CommentOutlined"
    | "ContactsOutlined"
    | "MailOutlined"
    | "FileTextOutlined"
    | "SendOutlined"
    | "UnorderedListOutlined"
    | "BankOutlined"
    | "DollarOutlined"
    | "ToolOutlined"
    | "MessageOutlined";
  label: string;
  path: string;
  description: string;
  allowedLevels: number[];
  children?: MenuItemType[]; // 서브메뉴를 위한 필드 추가
};

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: "Dashboard",
    iconName: "DashboardOutlined",
    label: "Dashboard",
    path: "/",
    description: "",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "users",
    iconName: "TeamOutlined",
    label: "User Management",
    path: "/users",
    description: "Manage all registered users and their permissions",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN],
  },
  {
    key: "units",
    iconName: "HomeOutlined",
    label: "Property Units",
    path: "/units",
    description: "Manage property listings and unit information",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "add-unit",
    iconName: "HomeOutlined",
    label: "Unit registration",
    path: "/add-unit",
    description: "Property registration",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "schedules",
    iconName: "CalendarOutlined",
    label: "Tour Schedules",
    path: "/schedules",
    description: "View and manage property tour schedules",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "visitors",
    iconName: "SolutionOutlined",
    label: "Visitors Logs",
    path: "/visitors",
    description: "View and manage property visitors logs",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "featured-units",
    iconName: "StarOutlined",
    label: "Featured Units",
    path: "/featured",
    description: "Featured listings",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "messages",
    iconName: "MailOutlined",
    label: "Message Management",
    path: "/messages",
    description: "Manage messages and communications",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
    children: [
      {
        key: "message-templates",
        iconName: "FileTextOutlined",
        label: "Template Management",
        path: "/messages/templates",
        description: "Create and manage message templates",
        allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
      },
      {
        key: "send-message",
        iconName: "SendOutlined",
        label: "Send Message",
        path: "/messages/send",
        description: "Send messages to users",
        allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
      },
      {
        key: "message-list",
        iconName: "UnorderedListOutlined",
        label: "Message List",
        path: "/messages/list",
        description: "View all messages",
        allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
      },
    ],
  },
  {
    key: "Popups",
    iconName: "StarOutlined",
    label: "Popup Management",
    path: "/popup",
    description: "View and manage popups",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "Complain",
    iconName: "CommentOutlined",
    label: "Complain Management",
    path: "/complain",
    description: "View and manage Complain",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "Contact",
    iconName: "ContactsOutlined",
    label: "Contact Management",
    path: "/contact",
    description: "View and manage Contact",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "banners",
    iconName: "ContactsOutlined",
    label: "Banners",
    path: "/banners",
    description: "Manage banner advertisements",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  // ── PMS ──────────────────────────────────────────────────────
  {
    key: "leases",
    iconName: "BankOutlined",
    label: "Lease Contracts",
    path: "/leases",
    description: "Manage lease contracts between landlords and tenants",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "payments",
    iconName: "DollarOutlined",
    label: "Payments",
    path: "/payments",
    description: "Review and verify monthly rent payment schedules",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "care",
    iconName: "ToolOutlined",
    label: "Care Service",
    path: "/care",
    description: "Manage home care service requests",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
  {
    key: "community",
    iconName: "MessageOutlined",
    label: "Community",
    path: "/community",
    description: "Manage condo community board posts",
    allowedLevels: [ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN],
  },
];