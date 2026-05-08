import { Tag, Space, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { User } from "@/types/user";
import {
  USER_LEVEL_MAP,
  USER_STATUS_MAP,
  UserLevelType,
  UserStatusType,
  SIGNUP_TYPE_MAP,
  SignupType,
} from "@/utils/constants/user";
import { formatDate } from "@/utils/format";

export const UserColumns: ColumnsType<User> = [
  {
    title: "ID",
    dataIndex: "id",
    width: 80,
    fixed: "left",
    sorter: true,
  },
  // {
  //   title: "Username",
  //   dataIndex: "username",
  //   width: 120,
  //   ellipsis: true,
  // },
  {
    title: "Email",
    dataIndex: "email",
    width: 200,
    ellipsis: true,
    render: (email: string | null) => email || "-",
  },
  {
    title: "Name",
    dataIndex: "name",
    width: 120,
    ellipsis: true,
    render: (name: string | null) => name || "-",
  },
  {
    title: "Signup Type",
    dataIndex: "signupType",
    width: 120,
    filters: Object.entries(SIGNUP_TYPE_MAP).map(([key, value]) => ({
      text: value.text,
      value: value.value,
    })),
    render: (status: SignupType) => {
      return (
        <Tag color={SIGNUP_TYPE_MAP[status].color}>
          {SIGNUP_TYPE_MAP[status].text}
        </Tag>
      );
    },
  },
  {
    title: "Level",
    dataIndex: "level",
    width: 120,
    filters: Object.entries(USER_LEVEL_MAP).map(([key, value]) => ({
      text: value.text,
      value: Number(key), // key를 명시적으로 숫자로 변환
    })),
    render: (level: UserLevelType) => (
      <Tag color={USER_LEVEL_MAP[level]?.color}>
        {USER_LEVEL_MAP[level]?.text}
      </Tag>
    ),
  },
  {
    title: "Phone",
    dataIndex: "phone",
    width: 150,
    ellipsis: true,
    render: (phone: string | null) => phone || "-",
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 100,
    filters: Object.entries(USER_STATUS_MAP).map(([key, value]) => ({
      text: value.text,
      value: key,
    })),
    render: (status: UserStatusType) => (
      <Tag color={USER_STATUS_MAP[status].color}>
        {USER_STATUS_MAP[status].text}
      </Tag>
    ),
  },
  {
    title: "Register Date",
    dataIndex: "regdate",
    width: 180,
    sorter: true,
    render: (date: string) => formatDate(date, "YYYY-MM-DD HH:mm"),
  },
  {
    title: "Last Update",
    dataIndex: "lastUpdate",
    width: 180,
    sorter: true,
    render: (date: string | null) =>
      date ? formatDate(date, "YYYY-MM-DD HH:mm") : "-",
  },

  {
    title: "Actions",
    key: "action",
    fixed: "right",
    width: 150,
    render: (_, record) => (
      <Space>
        <Button
          type="link"
          size="small"
          onClick={() => {
            const width = 1000;
            const height = 1200;
            const left = window.screen.availWidth - width;
            const top = 0;

            // 02/25 코드변경
            // 변경 전: window.open의 두 번째 파라미터가 'UserDetail'로 고정되어 있었음
            // 변경 후: `UserDetail_${record.id}`로 각 유저별 고유한 창 이름 사용

            const popup = window.open(
              `/users/detail/${record.id}`,
              `UserDetail_${record.id}`, // 코드수정
              `width=${width},
              height=${height},
              left=${left},
              top=${top},
              menubar=no,
              toolbar=no,
              location=no,
              status=no,
              resizable=no,
              scrollbars=no,
              titlebar=no`
            );

            if (popup) {
              popup.document.body.style.margin = "0";
              popup.document.body.style.padding = "0";
            }
          }}
        >
          View
        </Button>
        {/* <Button
          type="link"
          size="small"
          onClick={() => console.log("Edit:", record.id)}
        >
          Edit
        </Button>
        <Button
          type="link"
          size="small"
          danger
          onClick={() => console.log("Delete:", record.id)}
        >
          Delete
        </Button> */}
      </Space>
    ),
  },
];
