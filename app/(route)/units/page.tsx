// app/(admin)/units/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnits, updateUnitStatus } from "@/actions/unit-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { UnitColumns } from "./columns";
import { Button, message, Space } from "antd";
import type { UnitListItem } from "@/types/unit";
import { DateRangePicker } from "@/components/date-range-picker";

// 📌 02/25 owen 추가 - 엑셀 다운로드 기능 추가
import { DownloadOutlined } from "@ant-design/icons"; // 아이콘
import { exportToExcel } from "@/utils/excel"; // ✅ 엑셀 다운로드 유틸 불러오기

const initialParams = {
  page: 1,
  limit: 15,
  sort: "id",
  order: "desc" as const,
  startDate: undefined,
  endDate: undefined,
};

export default function UnitPage() {
  const queryClient = useQueryClient();
  const { params, updateParams } = useTableParams(initialParams);
  const { data, isLoading } = useQuery({
    queryKey: ["units", params],
    queryFn: () => getUnits(params),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateUnitStatus,
    onSuccess: () => {
      message.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (error: Error) => {
      message.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleStatusChange = (id: number, status: number) => {
    updateStatusMutation.mutate({ id, status });
  };

  // ✅ 엑셀 다운로드 함수 추가 기간별 다운
  const handleDownloadExcel = async () => {
    try {
      const downloadParams = {
        page: 1,
        limit: 1000,
        startDate: params.startDate,
        endDate: params.endDate,
      };
      const response = await getUnits(downloadParams);
      exportToExcel(response.units, "units_list", "Units");
    } catch (error) {
      console.error("Excel download failed", error);
      message.error("엑셀 다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <Space className="flex justify-between">
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownloadExcel}
        >
          Download Excel
        </Button>
      </Space>

      <DataTable<UnitListItem>
        columns={UnitColumns(handleStatusChange)}
        dataSource={data?.units}
        loading={isLoading || updateStatusMutation.isPending}
        params={params}
        onParamsChange={updateParams}
        searchPlaceholder="Search by title, address or owner name"
        scroll={{ x: 1500 }}
        total={data?.total}
      />
    </div>
  );
}
