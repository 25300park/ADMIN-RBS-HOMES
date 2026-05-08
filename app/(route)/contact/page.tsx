"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContacts, updateContactStatus } from "@/actions/contact-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { ContactColumns } from "./columns";
import { ContactResponseModal } from "@/components/modals/contact-response";
import { message } from "antd";
import type { ContactItem, ContactStatusChangeProps } from "@/types/contact";
import { CONTACT_STATUS } from "@/types/contact";

const initialParams = {
  page: 1,
  limit: 15,
  sort: "id",
  order: "desc" as const,
  startDate: undefined,
  endDate: undefined,
};

export default function ContactPage() {
  const queryClient = useQueryClient();
  const { params, updateParams } = useTableParams(initialParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", params],
    queryFn: () => getContacts(params),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: ContactStatusChangeProps) => {
      return updateContactStatus({ id, status });
    },
    onSuccess: () => {
      message.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: Error) => {
      message.error(`Failed to update status: ${error.message}`);
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (data: ContactStatusChangeProps) => {
      return updateContactStatus(data);
    },
    onSuccess: () => {
      message.success("Response submitted successfully");
      setModalOpen(false);
      setSelectedContact(null);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
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

  const handleContactSelect = (contact: ContactItem) => {
    setSelectedContact(contact);
    setModalOpen(true);
  };

  const handleResponse = (values: { response: string; responseType: number; memo?: string }) => {
    if (selectedContact) {
      setConfirmLoading(true);
      respondMutation.mutate({
        id: selectedContact.id,
        status: CONTACT_STATUS.COMPLETED,
        ...values,
      });
    }
  };

  return (
    <>
      <DataTable
        columns={ContactColumns(handleStatusChange, handleContactSelect)}
        dataSource={data?.contacts as any}
        loading={isLoading || updateStatusMutation.isPending || respondMutation.isPending}
        params={params}
        onParamsChange={updateParams}
        searchPlaceholder="Search by name, email, phone or message"
        scroll={{ x: 1600 }}
        total={data?.total}
      />
      
      <ContactResponseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedContact(null);
        }}
        onSubmit={handleResponse}
        loading={confirmLoading}
        contact={selectedContact}
      />
    </>
  );
}