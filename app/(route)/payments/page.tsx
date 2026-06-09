"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getPayments, verifyPayment } from "@/actions/pms-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { PaymentColumns, type PaymentItem } from "./columns";
import { Image, message, Modal, Select, Space, Typography, Alert } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Awaiting Approval", value: "AWAITING_APPROVAL" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
];

const initialParams = {
  page: 1,
  limit: 15,
  sort: "dueDate",
  order: "desc" as const,
  status: undefined as string | undefined,
  month: undefined as string | undefined,
};

export default function PaymentsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { params, updateParams } = useTableParams(initialParams);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");

  const effectiveParams = {
    ...params,
    status: statusFilter || undefined,
    month: monthFilter || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["payments", effectiveParams],
    queryFn: () => getPayments(effectiveParams),
  });

  const awaitingCount = data?.payments.filter(
    (p: PaymentItem) => p.status === "AWAITING_APPROVAL"
  ).length ?? 0;

  const verifyMutation = useMutation({
    mutationFn: (paymentId: number) =>
      verifyPayment({
        id: paymentId,
        verifiedById: Number((session?.user as any)?.id),
      }),
    onSuccess: () => {
      message.success("Payment verified");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => message.error("Failed to verify payment"),
  });

  // 월 선택 옵션: 최근 12개월
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = dayjs().subtract(i, "month");
    return { label: d.format("YYYY년 MM월"), value: d.format("YYYY-MM") };
  });

  return (
    <div className="space-y-4">
      {awaitingCount > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${awaitingCount}건의 납부 영수증이 확인을 기다리고 있습니다.`}
        />
      )}

      <Space wrap>
        <div>
          <Text className="mr-2 text-sm text-gray-500">Month:</Text>
          <Select
            style={{ width: 160 }}
            placeholder="All months"
            allowClear
            options={monthOptions}
            value={monthFilter || undefined}
            onChange={(v) => setMonthFilter(v ?? "")}
          />
        </div>
        <div>
          <Text className="mr-2 text-sm text-gray-500">Status:</Text>
          <Select
            style={{ width: 180 }}
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
          />
        </div>
      </Space>

      <DataTable<PaymentItem>
        columns={PaymentColumns(
          (id) => verifyMutation.mutate(id),
          verifyMutation.isPending,
          (url) => setPreviewUrl(url)
        )}
        dataSource={data?.payments as PaymentItem[]}
        loading={isLoading || verifyMutation.isPending}
        params={params}
        onParamsChange={updateParams}
        searchPlaceholder=""
        scroll={{ x: 1100 }}
        total={data?.total}
        rowClassName={(record: PaymentItem) =>
          record.status === "AWAITING_APPROVAL" ? "bg-orange-50" : ""
        }
      />

      {/* 영수증 이미지 모달 */}
      <Modal
        open={!!previewUrl}
        footer={null}
        onCancel={() => setPreviewUrl(null)}
        width={600}
        centered
      >
        {previewUrl && (
          <Image
            src={previewUrl}
            alt="receipt"
            style={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }}
            preview={false}
          />
        )}
      </Modal>
    </div>
  );
}
