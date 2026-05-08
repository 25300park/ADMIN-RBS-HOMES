// components/schedule/columns.tsx
import { Tag, Space, Select, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Schedule } from "@/types/schedule";
import {
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_MAP,
} from "@/utils/constants/schedule";
import { ScheduleStatusType } from "@/types/schedule";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { formatToKST } from "@/utils/format";


dayjs.extend(utc);
dayjs.extend(timezone);


export const ScheduleColumns = (
  onStatusChange: (id: number, status: number) => void,
  onScheduleSelect: (schedule: Schedule) => void
): ColumnsType<Schedule> => [
  {
    title: "ID",
    dataIndex: "id",
    width: 50,
    fixed: "left",
    sorter: true,
  },
  {
    title: "Username",
    dataIndex: "username",
    width: 80,
    ellipsis: true,
    render: (username: string | null) => username || "-",
  },
  {
    title: "Email",
    dataIndex: "email",
    width: 180,
    ellipsis: true,
    render: (email: string | null) => email || "-",
  },
  {
    title: "Mobile",
    dataIndex: "mobile",
    width: 120,
    ellipsis: true,
    render: (mobile: string | null) => mobile || "-",
  },
  {
    title: "Request Date",
    dataIndex: "requestDate",
    width: 140,
    render: (date: string) => (date ? dayjs(date).format("YY.MM.DD") : "-"),
  },
  {
    title: "Meeting Date",
    dataIndex: "date",
    width: 150,
    render: (date: string) => (date ? formatToKST(date) : "-"),
  },
  {
    title: "Time",
    dataIndex: "startedAt",
    width: 120,
    render: (startedAt: string, record) => {
      if (!startedAt) return "All day";
      const start = dayjs(startedAt).tz("Asia/Seoul").format("HH:mm");
      const end = record.endedAt
        ? dayjs(record.endedAt).tz("Asia/Seoul").format("HH:mm")
        : "All Day";
      return `${start} - ${end}`;
    },
  },
  {
    title: "Title",
    dataIndex: "title",
    width: 150,
    ellipsis: true,
  },
  {
    title: "Message",
    dataIndex: "message",
    width: 200,
    ellipsis: true,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 80,
    filters: Object.entries(SCHEDULE_STATUS_MAP).map(([key, value]) => ({
      text: value.text,
      value: key,
    })),
    render: (status: ScheduleStatusType, record) => (
      <Space>
        <Tag color={SCHEDULE_STATUS_MAP[status].color}>
          {SCHEDULE_STATUS_MAP[status].text}
        </Tag>
      </Space>
    ),
  },
  {
    title: "Status Change",
    dataIndex: "status",
    width: 140,
    render: (status: number, record) => (
      <Select
        size="small"
        style={{ width: 140 }}
        value={status}
        onChange={(value) => {
          if (value === SCHEDULE_STATUS.CONFIRMED) {
            onScheduleSelect(record); // 전체 스케줄 데이터 전달
          } else {
            onStatusChange(record.id, value);
          }
        }}
        options={[
          {
            label: "Requested",
            value: SCHEDULE_STATUS.REQUESTED,
            disabled: status === SCHEDULE_STATUS.REQUESTED,
          },
          {
            label: "Pending",
            value: SCHEDULE_STATUS.PENDING,
            disabled: status === SCHEDULE_STATUS.PENDING,
          },
          {
            label: "Confirmed",
            value: SCHEDULE_STATUS.CONFIRMED,
            disabled: status === SCHEDULE_STATUS.CONFIRMED,
          },
          {
            label: "Cancelled",
            value: SCHEDULE_STATUS.CANCELLED,
            disabled: status === SCHEDULE_STATUS.CANCELLED,
          },
        ]}
        disabled={
          status === SCHEDULE_STATUS.CANCELLED ||
          status === SCHEDULE_STATUS.CONFIRMED
        }
      />
    ),
  },
  {
    title: "with Units",
    dataIndex: "unitId",
    width: 100,
    align: "center",
    render: (unitId) => (
      <Space>
        {unitId === -1 ? (
          "-"
        ) : (
          <a
            href={`/units/detail/${unitId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              const width = 800;
              const height = 1100;
              const left = 300;
              const top = (window.screen.height - height) / 2;

              window.open(
                `/units/detail/${unitId}`,
                "UnitDetail",
                `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`
              );
            }}
          >
            <Button size="small">{unitId}</Button>
          </a>
        )}
      </Space>
    ),
  },
];
