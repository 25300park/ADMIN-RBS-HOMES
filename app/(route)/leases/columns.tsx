import { Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

export type LeaseItem = {
  id: number;
  status: string;
  paymentType: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  unit: { id: number; title: string; fullAddress: string | null } | null;
  landlord: { id: number; name: string | null; email: string | null } | null;
  tenant: { id: number; name: string | null; email: string | null } | null;
};

const STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  ACTIVE: { text: "Active", color: "green" },
  EXPIRING_SOON: { text: "Expiring Soon", color: "orange" },
  EXPIRED: { text: "Expired", color: "default" },
  TERMINATED: { text: "Terminated", color: "red" },
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  PDC: "PDC",
  FULL_ADVANCE: "Full Advance",
  HALF_ADVANCE: "Half Advance",
  MONTHLY_TRANSFER: "Monthly Transfer",
};

export const LeaseColumns = (
  onRowClick: (id: number) => void
): ColumnsType<LeaseItem> => [
  {
    title: "ID",
    dataIndex: "id",
    width: 70,
    fixed: "left",
    sorter: true,
  },
  {
    title: "Unit",
    dataIndex: ["unit", "title"],
    width: 200,
    ellipsis: true,
    render: (_, record) => (
      <span
        className="text-blue-600 cursor-pointer hover:underline"
        onClick={() => onRowClick(record.id)}
      >
        {record.unit?.title ?? "-"}
      </span>
    ),
  },
  {
    title: "Landlord",
    width: 130,
    ellipsis: true,
    render: (_, r) => r.landlord?.name ?? r.landlord?.email ?? "미지정",
  },
  {
    title: "Tenant",
    width: 130,
    ellipsis: true,
    render: (_, r) => r.tenant?.name ?? r.tenant?.email ?? "미지정",
  },
  {
    title: "Start",
    dataIndex: "startDate",
    width: 110,
    render: (v: string) => dayjs(v).format("YY.MM.DD"),
  },
  {
    title: "End",
    dataIndex: "endDate",
    width: 110,
    render: (v: string) => dayjs(v).format("YY.MM.DD"),
  },
  {
    title: "Monthly Rent",
    dataIndex: "monthlyRent",
    width: 140,
    sorter: true,
    render: (v: number) => `₱ ${v.toLocaleString()}`,
  },
  {
    title: "Payment Type",
    dataIndex: "paymentType",
    width: 140,
    render: (v: string) => PAYMENT_TYPE_LABEL[v] ?? v,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 130,
    filters: Object.entries(STATUS_CONFIG).map(([k, v]) => ({ text: v.text, value: k })),
    render: (v: string) => {
      const cfg = STATUS_CONFIG[v] ?? { text: v, color: "default" };
      return <Tag color={cfg.color}>{cfg.text}</Tag>;
    },
  },
];
