"use client";

import { Typography, Breadcrumb } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU_ITEMS, ROUTES } from "@/utils/constants";

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <div className="bg-white">
      <div className="p-4 bg-gray-50">
        <Breadcrumb
          items={[
            { title: <Link href={ROUTES.HOME}>Home</Link> },
            ...paths.map((path) => ({
              title:
                MENU_ITEMS.find((item) => item.key === path)?.label || path,
            })),
          ]}
        />
      </div>

      <div className="p-4">
        <Title level={2} className="!mb-0">{title}</Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </div>
    </div>
  );
}
