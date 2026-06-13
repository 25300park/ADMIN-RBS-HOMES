"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getLeaseDetail, verifyPayment, updateCareRequest } from "@/actions/pms-action";
import { useSession } from "next-auth/react";
import {
  Table,
  Tag,
  Button,
  Image,
  Select,
  DatePicker,
  Input,
  Space,
  Descriptions,
  Divider,
  message,
  Spin,
  Alert,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useState } from "react";

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  AWAITING_APPROVAL: "orange",
  PAID: "green",
  OVERDUE: "red",
};

const CARE_STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leaseId = Number(id);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [careEdits, setCareEdits] = useState<Record<number, any>>({});

  const { data: lease, isLoading } = useQuery({
    queryKey: ["lease", leaseId],
    queryFn: () => getLeaseDetail(leaseId),
  });

  const verifyMutation = useMutation({
    mutationFn: (paymentId: number) =>
      verifyPayment({ id: paymentId, verifiedById: Number((session?.user as any)?.id) }),
    onSuccess: () => {
      message.success("Payment verified");
      queryClient.invalidateQueries({ queryKey: ["lease", leaseId] });
    },
    onError: () => message.error("Failed to verify payment"),
  });

  const careMutation = useMutation({
    mutationFn: (vars: { id: number } & Record<string, any>) => updateCareRequest(vars),
    onSuccess: (_, vars) => {
      message.success("Care request updated");
      setCareEdits((prev) => { const next = { ...prev }; delete next[vars.id]; return next; });
      queryClient.invalidateQueries({ queryKey: ["lease", leaseId] });
    },
    onError: () => message.error("Failed to update care request"),
  });

  if (isLoading) return <Spin className="flex justify-center mt-10" />;
  if (!lease) return <Alert type="error" message="Lease not found" />;

  // ── 납부 스케줄 컬럼 ──────────────────────────────────────────
  const paymentColumns: ColumnsType<any> = [
    {
      title: "Due Date",
      dataIndex: "dueDate",
      width: 120,
      render: (v: string) => dayjs(v).format("YYYY.MM"),
    },
    {
      title: "Amount",
      dataIndex: "amountDue",
      width: 130,
      render: (v: number) => `₱ ${v.toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 150,
      render: (v: string) => (
        <Tag color={PAYMENT_STATUS_COLOR[v] ?? "default"}>{v.replace("_", " ")}</Tag>
      ),
    },
    {
      title: "Receipt",
      dataIndex: "receiptImageUrl",
      width: 90,
      render: (url: string | null) =>
        url ? (
          <Image src={url} width={60} height={40} style={{ objectFit: "cover" }} />
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
      width: 140,
      render: (_: any, record: any) => {
        if (record.status === "AWAITING_APPROVAL") {
          return (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={verifyMutation.isPending}
              onClick={() => verifyMutation.mutate(record.id)}
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

  // ── 케어 서비스 컬럼 ─────────────────────────────────────────
  const careColumns: ColumnsType<any> = [
    {
      title: "Type",
      dataIndex: "serviceType",
      width: 100,
    },
    {
      title: "Preferred Date",
      dataIndex: "preferredDate",
      width: 120,
      render: (v: string) => dayjs(v).format("YY.MM.DD"),
    },
    {
      title: "Status",
      width: 150,
      render: (_: any, record: any) => (
        <Select
          size="small"
          style={{ width: 130 }}
          value={careEdits[record.id]?.status ?? record.status}
          options={CARE_STATUS_OPTIONS}
          onChange={(val) =>
            setCareEdits((prev) => ({ ...prev, [record.id]: { ...prev[record.id], status: val } }))
          }
        />
      ),
    },
    {
      title: "Scheduled At",
      width: 160,
      render: (_: any, record: any) => (
        <DatePicker
          size="small"
          value={
            careEdits[record.id]?.scheduledAt
              ? dayjs(careEdits[record.id].scheduledAt)
              : record.scheduledAt
              ? dayjs(record.scheduledAt)
              : null
          }
          onChange={(d) =>
            setCareEdits((prev) => ({
              ...prev,
              [record.id]: { ...prev[record.id], scheduledAt: d?.toISOString() },
            }))
          }
        />
      ),
    },
    {
      title: "Assigned To",
      width: 140,
      render: (_: any, record: any) => (
        <Input
          size="small"
          value={careEdits[record.id]?.assignedTo ?? record.assignedTo ?? ""}
          onChange={(e) =>
            setCareEdits((prev) => ({
              ...prev,
              [record.id]: { ...prev[record.id], assignedTo: e.target.value },
            }))
          }
        />
      ),
    },
    {
      title: "Save",
      width: 80,
      render: (_: any, record: any) =>
        careEdits[record.id] ? (
          <Button
            type="primary"
            size="small"
            loading={careMutation.isPending}
            onClick={() =>
              careMutation.mutate({ id: record.id, ...careEdits[record.id] })
            }
          >
            Save
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 계약 기본 정보 */}
      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        title="Contract Info"
      >
        <Descriptions.Item label="Unit">{lease.unit?.title ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="Address">{lease.unit?.fullAdress ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={PAYMENT_STATUS_COLOR[lease.status] ?? "default"}>{lease.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Landlord">
          {lease.landlord?.name ?? lease.landlord?.email ?? "미지정"}
        </Descriptions.Item>
        <Descriptions.Item label="Tenant">
          {lease.tenant?.name ?? lease.tenant?.email ?? "미지정"} · {lease.tenant?.phone ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Monthly Rent">
          ₱ {lease.monthlyRent.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Period">
          {dayjs(lease.startDate).format("YYYY.MM.DD")} ~{" "}
          {dayjs(lease.endDate).format("YYYY.MM.DD")}
        </Descriptions.Item>
        <Descriptions.Item label="Payment Type">{lease.paymentType}</Descriptions.Item>
        <Descriptions.Item label="Condo">{lease.condo?.condoName ?? "-"}</Descriptions.Item>
        {lease.notes && (
          <Descriptions.Item label="Notes" span={3}>
            {lease.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider />

      {/* 납부 스케줄 */}
      <div>
        <h3 className="text-base font-semibold mb-3">
          Payment Schedule ({lease.paymentSchedules?.length ?? 0})
        </h3>
        <Table
          rowKey="id"
          size="small"
          dataSource={lease.paymentSchedules ?? []}
          columns={paymentColumns}
          pagination={false}
          scroll={{ x: 760 }}
          rowClassName={(record) =>
            record.status === "OVERDUE" ? "bg-red-50" : ""
          }
        />
      </div>

      <Divider />

      {/* 케어 서비스 */}
      <div>
        <h3 className="text-base font-semibold mb-3">
          Care Requests ({lease.careRequests?.length ?? 0})
        </h3>
        {(lease.careRequests?.length ?? 0) === 0 ? (
          <p className="text-gray-400 text-sm">No care requests.</p>
        ) : (
          <Table
            rowKey="id"
            size="small"
            dataSource={lease.careRequests ?? []}
            columns={careColumns}
            pagination={false}
            scroll={{ x: 760 }}
          />
        )}
      </div>
    </div>
  );
}
