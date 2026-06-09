"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCareRequests, updateCareRequest } from "@/actions/pms-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { CareColumns, type CareItem } from "./columns";
import { message, Select, Space, Typography } from "antd";

const { Text } = Typography;

const SERVICE_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Air-con", value: "AIRCON" },
  { label: "Cleaning", value: "CLEANING" },
  { label: "Repair", value: "REPAIR" },
  { label: "Handyman", value: "HANDYMAN" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const initialParams = {
  page: 1,
  limit: 15,
  sort: "id",
  order: "desc" as const,
};

export default function CarePage() {
  const queryClient = useQueryClient();
  const { params, updateParams } = useTableParams(initialParams);
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [edits, setEdits] = useState<Record<number, any>>({});

  const effectiveParams = {
    ...params,
    serviceType: serviceTypeFilter || undefined,
    status: statusFilter || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["care", effectiveParams],
    queryFn: () => getCareRequests(effectiveParams),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number } & Record<string, any>) => updateCareRequest(vars),
    onSuccess: (_, vars) => {
      message.success("Updated successfully");
      setEdits((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["care"] });
    },
    onError: () => message.error("Failed to update"),
  });

  const handleEdit = (id: number, field: string, value: any) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = (id: number) => {
    if (!edits[id]) return;
    updateMutation.mutate({ id, ...edits[id] });
  };

  return (
    <div className="space-y-4">
      <Space wrap>
        <div>
          <Text className="mr-2 text-sm text-gray-500">Service Type:</Text>
          <Select
            style={{ width: 140 }}
            options={SERVICE_TYPE_OPTIONS}
            value={serviceTypeFilter}
            onChange={(v) => setServiceTypeFilter(v)}
          />
        </div>
        <div>
          <Text className="mr-2 text-sm text-gray-500">Status:</Text>
          <Select
            style={{ width: 140 }}
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
          />
        </div>
      </Space>

      <DataTable<CareItem>
        columns={CareColumns(edits, handleEdit, handleSave, updateMutation.isPending)}
        dataSource={data?.careRequests as CareItem[]}
        loading={isLoading || updateMutation.isPending}
        params={params}
        onParamsChange={updateParams}
        searchPlaceholder="Search care requests"
        scroll={{ x: 1100 }}
        total={data?.total}
      />
    </div>
  );
}
