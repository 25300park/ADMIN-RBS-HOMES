"use client";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/actions/user-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { UserColumns } from "./columns";
import { Button, Space, message } from "antd";
import { useCallback } from "react";

// 📌 02/25 owen 추가 - 엑셀 다운로드 기능을 utils/excel.ts에서 가져옴
import { DownloadOutlined } from "@ant-design/icons"; // 아이콘
import { exportToExcel } from "@/utils/excel";

const initialParams = {
  page: 1,
  limit: 15,
  sort: "id",
  order: "desc" as const,
  startDate: undefined,
  endDate: undefined, // 날짜 필터링 파라미터 추가
};

export default function UsersPage() {
  const { params, updateParams } = useTableParams(initialParams);
  const { data, isLoading } = useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers(params),
    refetchOnWindowFocus: false,
  });

  const handleParamsChange = useCallback(
    (newParams: Partial<typeof params>) => {
      updateParams(newParams);
    },
    [updateParams]
  );

  // ✅ 액셀 다운로드 코드 추가 (기간별 다운)
  const handleDownloadExcel = async () => {
    try {
      const downloadParams = {
        page: 1,
        limit: 1000,
        startDate: params.startDate,
        endDate: params.endDate,
      };
      const response = await getUsers(downloadParams);
      exportToExcel(response.users, "users_list", "Users");
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

      <DataTable
        columns={UserColumns}
        dataSource={data?.users}
        loading={isLoading}
        params={params}
        onParamsChange={handleParamsChange}
        searchPlaceholder="Search by name, email or phone"
        scroll={{ x: 1500 }}
        total={data?.total}
        rowKey="id"
      />
    </div>
  );
}
