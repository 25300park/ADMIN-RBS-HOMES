"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getLeases } from "@/actions/pms-action";
import { useTableParams } from "@/hooks/use-table-params";
import DataTable from "@/components/data-table";
import { LeaseColumns, type LeaseItem } from "./columns";

const initialParams = {
  page: 1,
  limit: 15,
  sort: "id",
  order: "desc" as const,
  status: undefined as string | undefined,
};

export default function LeasesPage() {
  const router = useRouter();
  const { params, updateParams } = useTableParams(initialParams);

  const { data, isLoading } = useQuery({
    queryKey: ["leases", params],
    queryFn: () => getLeases(params),
  });

  const handleRowClick = (id: number) => {
    router.push(`/leases/${id}`);
  };

  return (
    <DataTable<LeaseItem>
      columns={LeaseColumns(handleRowClick)}
      dataSource={data?.leases as LeaseItem[]}
      loading={isLoading}
      params={params}
      onParamsChange={updateParams}
      searchPlaceholder="Search by unit, landlord or tenant name"
      scroll={{ x: 1100 }}
      total={data?.total}
    />
  );
}
