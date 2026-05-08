// app/(admin)/schedules/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSchedules, updateScheduleStatus } from "@/actions/schedule-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { ScheduleColumns } from "./columns";
import { ScheduleConfirmModal } from "@/components/modals/schedule-confirm";
import { message } from "antd";
import { useState } from "react";
import { SCHEDULE_STATUS } from "@/utils/constants/schedule";
import type { Schedule, StatusChangeProps } from "@/types/schedule";

const initialParams = {
  page: 1,
  limit: 15,
  sort: "id",
  order: "desc" as const,
};

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const { params, updateParams } = useTableParams(initialParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const { data, isLoading } = useQuery({
    queryKey: ["schedules", params],
    queryFn: () => getSchedules(params),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, confirmData }: StatusChangeProps) => {
      return updateScheduleStatus({ id, status, ...confirmData });
    },
    onSuccess: () => {
      message.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (error: Error) => {
      message.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleStatusChange = (id: number, status: number) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleScheduleSelect = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setSelectedId(schedule.id);
    setModalOpen(true);
  };

  const handleConfirm = (values: {
    date: Date;
    title: string;
    desc: string;
  }) => {
    if (selectedId) {
      setConfirmLoading(true);
      updateStatusMutation.mutate(
        {
          id: selectedId,
          status: SCHEDULE_STATUS.CONFIRMED,
          confirmData: values,
        },
        {
          onSettled: () => {
            setConfirmLoading(false);
            setModalOpen(false);
            setSelectedId(null);
            setSelectedSchedule(null);
          },
        }
      );
    }
  };

  return (
    <>
      <DataTable<Schedule>
        columns={ScheduleColumns(handleStatusChange, handleScheduleSelect)}
        dataSource={data?.schedules}
        loading={isLoading || updateStatusMutation.isPending}
        params={params}
        onParamsChange={updateParams}
        searchPlaceholder="Search by name, email or phone"
        scroll={{ x: 1400 }}
        total={data?.total}
      />
      <ScheduleConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedId(null);
          setSelectedSchedule(null);
        }}
        onConfirm={handleConfirm}
        loading={confirmLoading}
        initialDate={
          selectedSchedule?.requestDate
            ? new Date(selectedSchedule.requestDate)
            : new Date()
        }
        schedule={selectedSchedule} // 전체 스케줄 데이터 전달
      />
    </>
  );
}
