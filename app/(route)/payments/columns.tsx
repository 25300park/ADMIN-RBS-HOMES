import { Tag, Button, Image } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export type PaymentItem = {
  id: number;
  status: string;
  dueDate: string;
  amountDue: number;
  pdcNumber: string | null;
  receiptImageUrl: string | null;
  receiptNotes: string | null;
  verifiedAt: string | null;
  contract: {
    id: number;
    monthlyRent: number;
    unit: { title: string; fullAddress: string | null };
    tenant: { id: number; name: string | null; email: string | null };
  };
  verifiedBy: { id: number; name: string | null } | null;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  AWAITING_APPROVAL: "orange",
  PAID: "green",
  OVERDUE: "red",
};

export const PaymentColumns = (
  onVerify: (id: number) => void,
  verifying: boolean,
  onPreview: (url: string) => void
): ColumnsType<PaymentItem> => [
  {
    title: "ID",
    dataIndex: "id",
    width: 70,
    fixed: "left",
    sorter: true,
  },
  {
    title: "Unit",
    width: 200,
    ellipsis: true,
    render: (_, r) => r.contract.unit.title,
  },
  {
    title: "Tenant",
    width: 130,
    ellipsis: true,
    render: (_, r) => r.contract.tenant.name ?? r.contract.tenant.email ?? "—",
  },
  {
    title: "Due Date",
    dataIndex: "dueDate",
    width: 110,
    sorter: true,
    render: (v: string) => dayjs(v).format("YYYY.MM"),
  },
  {
    title: "Amount",
    dataIndex: "amountDue",
    width: 130,
    sorter: true,
    render: (v: number) => `₱ ${v.toLocaleString()}`,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 150,
    filters: Object.entries(STATUS_COLOR).map(([k]) => ({
      text: k.replace("_", " "),
      value: k,
    })),
    render: (v: string) => (
      <Tag color={STATUS_COLOR[v] ?? "default"}>{v.replace("_", " ")}</Tag>
    ),
  },
  {
    title: "Receipt",
    dataIndex: "receiptImageUrl",
    width: 90,
    render: (url: string | null) =>
      url ? (
        <Image
          src={url}
          width={60}
          height={40}
          style={{ objectFit: "cover", cursor: "pointer" }}
          preview={false}
          onClick={() => onPreview(url)}
        />
      ) : (
        <span className="text-gray-400 text-xs">—</span>
      ),
  },
  {
    title: "Verified",
    dataIndex: "verifiedAt",
    width: 110,
    render: (v: string | null) => (v ? dayjs(v).format("YY.MM.DD") : "—"),
  },
  {
    title: "Action",
    width: 130,
    fixed: "right",
    render: (_: any, record: PaymentItem) => {
      if (record.status === "AWAITING_APPROVAL") {
        return (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={verifying}
            onClick={() => onVerify(record.id)}
          >
            Verify
          </Button>
        );
      }
      if (record.status === "PAID") {
        return <Tag color="green">Confirmed</Tag>;
      }
      return null;
    },
  },
];
