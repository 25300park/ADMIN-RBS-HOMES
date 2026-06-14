// components/unit/columns.tsx

import { Space, Tag, Button, Typography, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UnitListItem } from "@/types/unit";
import {
  UNIT_STATUS_MAP,
  UNIT_TYPE_OPTIONS,
  SELL_TYPE_OPTIONS,
  UNIT_STATUS,
  UNIT_STATUS_OPTIONS,
  UnitStatusType,
} from "@/utils/constants/unit";
import { formatToKST_DATE } from "@/utils/format";

const { Text } = Typography;

export const UnitColumns = (
  onStatusChange: (id: number, status: number) => void
): ColumnsType<UnitListItem> => [
  {
    title: "ID",
    dataIndex: "id",
    width: 80,
    fixed: "left",
    sorter: true,
  },
  {
    title: "Title",
    dataIndex: "title",
    width: 200,
    ellipsis: true,
    render: (title: string) => <Text strong>{title}</Text>,
  },
  {
    title: "Type",
    dataIndex: "type",
    width: 120,
    filters: UNIT_TYPE_OPTIONS.map((option) => ({
      text: option.label,
      value: option.value,
    })),
    render: (type: string) => {
      const option = UNIT_TYPE_OPTIONS.find((option) => option.value === type);
      return <Tag color={option?.color}>{option?.label || type}</Tag>;
    },
  },
  {
    title: "Sale Type",
    dataIndex: "sellType",
    width: 120,
    filters: SELL_TYPE_OPTIONS.map((option) => ({
      text: option.label,
      value: option.value,
    })),
    render: (sellType: string) => {
      const option = SELL_TYPE_OPTIONS.find(
        (option) => option.value === sellType
      );
      return <Tag color={option?.color}>{option?.label || sellType}</Tag>;
    },
  },
  {
    title: "Address",
    dataIndex: "fullAdress",
    width: 200,
    ellipsis: true,
  },
  {
    title: "Area",
    dataIndex: "area",
    width: 100,
    sorter: true,
    render: (area: number) => `${area}m²`,
  },
  {
    title: "Bed/Bath",
    dataIndex: "bed",
    width: 100,
    render: (bed: number | null, record) => `${bed || 0}/${record.bath || 0}`,
  },
  {
    title: "Price",
    dataIndex: "price",
    width: 120,
    sorter: true,
    render: (price: number | null) =>
      price
        ? `₱ ${new Intl.NumberFormat("en-PH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true,
          }).format(price)}`
        : "-",
  },
  {
    title: "Agent",
    dataIndex: ["admin", "name"],
    width: 150,
    ellipsis: true,
    render: (name: string | null, record) => (
      <span>{name || record.admin?.email || "-"}</span>
    ),
  },
  {
    title: "last updated",
    dataIndex: "lastUpdate",
    width: 140,
    render: (date: string) => formatToKST_DATE(date),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 200,
    filters: Object.entries(UNIT_STATUS_MAP).map(([key, value]) => ({
      text: value.text,
      value: key,
    })),
    render: (status: number, record) => {
      // 상태값에 따른 태그 색상과 텍스트 가져오기
      const statusInfo = UNIT_STATUS_MAP[status as UnitStatusType] || {
        text: "Unknown",
        color: "default",
      };
      
      // 삭제된 매물일 경우 Select 비활성화
      const isDeleted = status === UNIT_STATUS.DELETED;
      
      return (
        <Space>
          <Select
            size="small"
            style={{ width: 150 }}
            value={status}
            onChange={(value) => onStatusChange(record.id, value)}
            options={UNIT_STATUS_OPTIONS.map(option => ({
              ...option,
              disabled: status === option.value || 
                // 삭제된 매물은 다른 상태로 변경 불가
                (isDeleted && option.value !== UNIT_STATUS.DELETED)
            }))}
            disabled={isDeleted} // 삭제된 매물은 상태 변경 불가
          />
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        </Space>
      );
    },
  },
  {
    title: "Actions",
    key: "action",
    fixed: "right",
    width: 120,
    render: (_, record) => (
      <Space>
        <Button
          type="link"
          size="small"
          onClick={() => {
            const width = 800;
            const height = 1100;
            const left = 300;
            const top = (window.screen.height - height) / 2;

            // 02/25 코드변경
            // 변경 전: window.open 직접 호출, 창 이름 없이 사용
            // 변경 후: popup 변수에 할당하고, 각 유닛별 고유한 창 이름 사용

            const popup = window.open(
              `/units/detail/${record.id}`,
              `UnitDetail_${record.id}`, // 코드수정: 각 유닛별 고유 창 이름 추가
              `width=${width},
              height=${height},
              top=${top},
              left=${left},
              menubar=no,
              toolbar=no,
              location=no,
              status=no,
              resizable=yes,
              scrollbars=yes`
            );

            // 코드추가: 팝업 창 생성 확인 및 포커스
            if (popup) {
              popup.focus();
            }
          }}
        >
          View
        </Button>
      </Space>
    ),
  },
];
