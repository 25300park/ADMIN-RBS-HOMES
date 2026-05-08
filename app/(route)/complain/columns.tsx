// app/(route)/complain/columns.tsx
import { Space, Tag, Button, Tooltip, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatToKST_DATE } from "@/utils/format";
import {
  ComplainItem,
  COMPLAIN_STATUS,
  COMPLAIN_STATUS_MAP,
  RESPONSE_TYPE_MAP,
} from "@/types/complain";

export const ComplainColumns = (
  onStatusChange: (id: number, status: number) => void,
  onRespond: (complain: ComplainItem) => void
): ColumnsType<ComplainItem> => [
  {
    title: "ID",
    dataIndex: "id",
    width: 60,
    fixed: "left",
    sorter: true,
  },
  {
    title: "Unit",
    dataIndex: ["unit", "title"],
    width: 160,
    ellipsis: true,
    render: (text: string, record) => (
      <Tooltip title={text}>
        <div
          className="cursor-pointer text-blue-500 hover:text-blue-400"
          onClick={() => {
            const width = 800;
            const height = 1100;
            const left = 300;
            const top = (window.screen.height - height) / 2;

            window.open(
              `/units/detail/${record.unitId}`,
              `UnitDetail_${record.unitId}`,
              `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
            );
          }}
        >
          {text || `Unit #${record.unitId}`}
        </div>
      </Tooltip>
    ),
  },
  {
    title: "Unit Writer",
    dataIndex: ["writer", "username"],
    width: 120,
    ellipsis: true,
    render: (username: string | null, record) => {
      if (!record.writer) return "-";
      return (
        <Tooltip title={record.writer.email}>
          <div
            className="cursor-pointer text-blue-500 hover:text-blue-400"
            onClick={() => {
              const width = 1000;
              const height = 1200;
              const left = window.screen.availWidth - width;
              const top = 0;

              window.open(
                `/users/detail/${record.writerId}`,
                `UserDetail_${record.writerId}`,
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=no,scrollbars=no,titlebar=no`
              );
            }}
          >
            {username || record.writer.email || "-"}
          </div>
        </Tooltip>
      );
    },
  },
  {
    title: "User",
    dataIndex: ["user", "username"],
    width: 120,
    ellipsis: true,
    render: (username: string | null, record) => (
      <Tooltip title={record.user?.email}>
        <div
          className="cursor-pointer text-blue-500 hover:text-blue-400"
          onClick={() => {
            const width = 1000;
            const height = 1200;
            const left = window.screen.availWidth - width;
            const top = 0;

            window.open(
              `/users/detail/${record.userId}`,
              `UserDetail_${record.userId}`,
              `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=no,scrollbars=no,titlebar=no`
            );
          }}
        >
          {username || record.user?.email || "-"}
        </div>
      </Tooltip>
    ),
  },
  {
    title: "Message",
    dataIndex: "message",
    width: 250,
    ellipsis: true,
    render: (text: string) => (
      <Tooltip title={text}>
        <div className="truncate max-w-[250px]">{text}</div>
      </Tooltip>
    ),
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    width: 120,
    sorter: true,
    render: (date: string) => formatToKST_DATE(date),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 100,
    filters: Object.entries(COMPLAIN_STATUS_MAP).map(([key, value]) => ({
      //@ts-ignore
      text: value.text,
      value: key,
    })),
    render: (status: number) => (
      <Tag color={COMPLAIN_STATUS_MAP[status].color}>
        {COMPLAIN_STATUS_MAP[status].text}
      </Tag>
    ),
  },
  {
    title: "Response Type",
    dataIndex: "responseType",
    width: 120,
    render: (responseType: number | null, record) => {
      if (record.status !== COMPLAIN_STATUS.COMPLETED) return "-";
      if (responseType === null) return "-";
      return (
        <Tag color={RESPONSE_TYPE_MAP[responseType].color}>
          {RESPONSE_TYPE_MAP[responseType].text}
        </Tag>
      );
    },
  },
  {
    title: "Responded By",
    dataIndex: ["admin", "username"],
    width: 120,
    render: (username: string | null, record) => {
      if (record.status !== COMPLAIN_STATUS.COMPLETED) return "-";
      if (!record.admin) return "-";
      return username || record.admin.email || "-";
    },
  },
  {
    title: "Responded At",
    dataIndex: "respondedAt",
    width: 120,
    render: (date: string | null, record) => {
      if (record.status !== COMPLAIN_STATUS.COMPLETED) return "-";
      return date ? formatToKST_DATE(date) : "-";
    },
  },
  {
    title: "Responded memo",
    dataIndex: "response",
    width: 120,
    render: (text: string) => (
      <Tooltip title={text}>
        <div className="truncate max-w-[250px]">{text}</div>
      </Tooltip>
    ),
  },
  {
    title: "Actions",
    key: "actions",
    fixed: "right",
    width: 200,
    render: (_, record) => (
      <Space>
        <Button type="primary" size="small" onClick={() => onRespond(record)}>
          {record.status === COMPLAIN_STATUS.COMPLETED
            ? "View Details"
            : "Respond"}
        </Button>

        {record.status !== COMPLAIN_STATUS.COMPLETED && (
          <Select
            size="small"
            style={{ width: 110 }}
            value={record.status}
            onChange={(value) => onStatusChange(record.id, value)}
            options={[
              {
                label: "Requested",
                value: COMPLAIN_STATUS.REQUESTED,
                disabled: record.status === COMPLAIN_STATUS.REQUESTED,
              },
              {
                label: "Processing",
                value: COMPLAIN_STATUS.PROCESSING,
                disabled: record.status === COMPLAIN_STATUS.PROCESSING,
              },
            ]}
          />
        )}
      </Space>
    ),
  },
];
