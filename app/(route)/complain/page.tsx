"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComplains, updateComplainStatus } from "@/actions/complain-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { ComplainResponseModal } from "@/components/modals/complain-response";
import { ComplainColumns } from "./columns";
import { message } from "antd";
import type { ComplainItem, ComplainStatusChangeProps } from "@/types/complain";
import { COMPLAIN_STATUS } from "@/types/complain";

const initialParams = {
  page: 1,
  limit: 15,
  sort: "id",
  order: "desc" as const,
  startDate: undefined,
  endDate: undefined,
};

export default function ComplainPage() {
  const queryClient = useQueryClient();
  const { params, updateParams } = useTableParams(initialParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplain, setSelectedComplain] = useState<ComplainItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["complains", params],
    queryFn: () => getComplains(params),
  });
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: ComplainStatusChangeProps) => {
      return updateComplainStatus({ id, status });
    },
    onSuccess: () => {
      message.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["complains"] });
    },
    onError: (error: Error) => {
      message.error(`Failed to update status: ${error.message}`);
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (data: ComplainStatusChangeProps) => {
      return updateComplainStatus(data);
    },
    onSuccess: () => {
      message.success("Response submitted successfully");
      setModalOpen(false);
      setSelectedComplain(null);
      queryClient.invalidateQueries({ queryKey: ["complains"] });
    },
    onError: (error: Error) => {
      message.error(`Failed to submit response: ${error.message}`);
    },
    onSettled: () => {
      setConfirmLoading(false);
    },
  });

  const handleStatusChange = (id: number, status: number) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleComplainSelect = (complain: ComplainItem) => {
    setSelectedComplain(complain);
    setModalOpen(true);
  };

  const handleResponse = (values: { response: string; responseType: number }) => {
    if (selectedComplain) {
      setConfirmLoading(true);
      respondMutation.mutate({
        id: selectedComplain.id,
        status: COMPLAIN_STATUS.COMPLETED,
        ...values,
      });
    }
  };

  return (
    <>
      <DataTable
        columns={ComplainColumns(handleStatusChange, handleComplainSelect)}
        dataSource={data?.complains as any}
        loading={isLoading || updateStatusMutation.isPending || respondMutation.isPending}
        params={params}
        onParamsChange={updateParams}
        searchPlaceholder="Search by message, Unit Writer or unit title"
        scroll={{ x: 1400 }}
        total={data?.total}
      />
      
      <ComplainResponseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedComplain(null);
        }}
        onSubmit={handleResponse}
        loading={confirmLoading}
        complain={selectedComplain}
        viewOnly={selectedComplain?.status === COMPLAIN_STATUS.COMPLETED}
      />
    </>
  );
}