import { Tag, Select, DatePicker, Input, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

export type CareItem = {
  id: number;
  serviceType: string;
  status: string;
  preferredDate: string;
  scheduledAt: string | null;
  completedAt: string | null;
  assignedTo: string | null;
  price: number | null;
  description: string | null;
  contract: {
    id: number;
    unit: { title: string; fullAddress: string | null };
    tenant: { id: number; name: string | null; phone: string | null };
  };
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  PENDING_OWNER_APPROVAL: "orange",
  SCHEDULED: "blue",
  IN_PROGRESS: "purple",
  AWAITING_TENANT_CONFIRMATION: "cyan",
  COMPLETED: "green",
  CANCELLED: "red",
};

const CARE_STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Pending Owner Approval", value: "PENDING_OWNER_APPROVAL" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Awaiting Tenant Confirmation", value: "AWAITING_TENANT_CONFIRMATION" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const CareColumns = (
  edits: Record<number, any>,
  onEdit: (id: number, field: string, value: any) => void,
  onSave: (id: number) => void,
  saving: boolean
): ColumnsType<CareItem> => [
  {
    title: "ID",
    dataIndex: "id",
    width: 70,
    fixed: "left",
    sorter: true,
  },
  {
    title: "Unit",
    width: 180,
    ellipsis: true,
    render: (_, r) => r.contract.unit.title,
  },
  {
    title: "Tenant",
    width: 120,
    ellipsis: true,
    render: (_, r) => r.contract.tenant.name ?? "—",
  },
  {
    title: "Type",
    dataIndex: "serviceType",
    width: 100,
    filters: ["AIRCON", "CLEANING", "REPAIR", "HANDYMAN"].map((v) => ({
      text: v,
      value: v,
    })),
    render: (v: string) => <Tag>{v}</Tag>,
  },
  {
    title: "Preferred",
    dataIndex: "preferredDate",
    width: 110,
    render: (v: string) => dayjs(v).format("YY.MM.DD"),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 150,
    filters: CARE_STATUS_OPTIONS.map(({ label, value }) => ({ text: label, value })),
    render: (v: string, record: CareItem) => (
      <Select
        size="small"
        style={{ width: 130 }}
        value={edits[record.id]?.status ?? v}
        options={CARE_STATUS_OPTIONS}
        onChange={(val) => onEdit(record.id, "status", val)}
      />
    ),
  },
  {
    title: "Scheduled At",
    width: 160,
    render: (_: any, record: CareItem) => (
      <DatePicker
        size="small"
        value={
          edits[record.id]?.scheduledAt
            ? dayjs(edits[record.id].scheduledAt)
            : record.scheduledAt
            ? dayjs(record.scheduledAt)
            : null
        }
        onChange={(d) => onEdit(record.id, "scheduledAt", d?.toISOString() ?? null)}
      />
    ),
  },
  {
    title: "Assigned To",
    width: 140,
    render: (_: any, record: CareItem) => (
      <Input
        size="small"
        placeholder="Technician name"
        value={edits[record.id]?.assignedTo ?? record.assignedTo ?? ""}
        onChange={(e) => onEdit(record.id, "assignedTo", e.target.value)}
      />
    ),
  },
  {
    title: "Save",
    width: 80,
    fixed: "right",
    render: (_: any, record: CareItem) =>
      edits[record.id] ? (
        <Button
          type="primary"
          size="small"
          loading={saving}
          onClick={() => onSave(record.id)}
        >
          Save
        </Button>
      ) : (
        <Tag color={STATUS_COLOR[record.status] ?? "default"}>
          {record.status}
        </Tag>
      ),
  },
];
