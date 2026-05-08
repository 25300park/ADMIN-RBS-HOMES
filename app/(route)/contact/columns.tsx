// app/(route)/contact/columns.tsx
import { Space, Tag, Button, Tooltip, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatToKST_DATE } from "@/utils/format";
import {
  ContactItem,
  CONTACT_STATUS,
  CONTACT_STATUS_MAP,
  RESPONSE_TYPE_MAP,
} from "@/types/contact";

export const ContactColumns = (
  onStatusChange: (id: number, status: number) => void,
  onRespond: (contact: ContactItem) => void
): ColumnsType<ContactItem> => [
  {
    title: "ID",
    dataIndex: "id",
    width: 60,
    fixed: "left",
    sorter: true,
  },
  {
    title: "Name",
    dataIndex: "name",
    width: 120,
    ellipsis: true,
    render: (name: string, record) => (
      <Tooltip title={`${record.name} (${record.email})`}>
        <span>{name}</span>
      </Tooltip>
    ),
  },
  {
    title: "Contact Info",
    key: "contactInfo",
    width: 200,
    render: (_, record) => (
      <Space direction="vertical" size="small">
        <div>
          <a href={`mailto:${record.email}`}>{record.email}</a>
        </div>
        <div>
          <a href={`tel:${record.phone}`}>{record.phone}</a>
        </div>
      </Space>
    ),
  },
  {
    title: "User Account",
    dataIndex: ["user", "username"],
    width: 120,
    ellipsis: true,
    render: (username: string | null, record) => {
      if (!record.user) return "-";
      return (
        <Tooltip title={record.user.email}>
          <Button
            type="link"
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
            {username || record.user.email || "-"}
          </Button>
        </Tooltip>
      );
    },
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
    filters: Object.entries(CONTACT_STATUS_MAP).map(([key, value]) => ({
      // @ts-ignore - 타입 에러 무시
      text: value.text,
      value: key,
    })),
    render: (status: number) => (
      // @ts-ignore - 타입 에러 무시
      <Tag color={CONTACT_STATUS_MAP[status].color}>
        {CONTACT_STATUS_MAP[status].text}
      </Tag>
    ),
  },
  {
    title: "Response Type",
    dataIndex: "responseType",
    width: 120,
    render: (responseType: number | null, record) => {
      if (record.status !== CONTACT_STATUS.COMPLETED) return "-";
      if (responseType === null) return "-";
      
      // @ts-ignore - 타입 에러 무시
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
      if (record.status !== CONTACT_STATUS.COMPLETED) return "-";
      if (!record.admin) return "-";
      return username || record.admin.email || "-";
    },
  },
  {
    title: "Responded At",
    dataIndex: "respondedAt",
    width: 120,
    render: (date: string | null, record) => {
      if (record.status !== CONTACT_STATUS.COMPLETED) return "-";
      return date ? formatToKST_DATE(date) : "-";
    },
  },
  {
    title: "Actions",
    key: "actions",
    fixed: "right",
    width: 200,
    render: (_, record) => (
      <Space>
        <Button
          type="primary"
          size="small"
          onClick={() => onRespond(record)}
        >
          {record.status === CONTACT_STATUS.COMPLETED ? "View Details" : "Respond"}
        </Button>
        
        {record.status !== CONTACT_STATUS.COMPLETED && (
          <Select
            size="small"
            style={{ width: 110 }}
            value={record.status}
            onChange={(value) => onStatusChange(record.id, value)}
            options={[
              {
                label: "Requested",
                value: CONTACT_STATUS.REQUESTED,
                disabled: record.status === CONTACT_STATUS.REQUESTED,
              },
              {
                label: "Processing",
                value: CONTACT_STATUS.PROCESSING,
                disabled: record.status === CONTACT_STATUS.PROCESSING,
              },
            ]}
          />
        )}
      </Space>
    ),
  },
];