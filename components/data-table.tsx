'use client'

import { Table, Input } from 'antd'
import { memo, useCallback, useMemo, useState } from 'react'
import type { TableProps as AntTableProps, TablePaginationConfig } from 'antd/es/table'
import type { SearchParams } from '@/types/table'
import { DateRangePicker } from '@/components/date-range-picker'
import { Search as SearchIcon } from 'lucide-react'

const { Search } = Input

interface DataTableProps<T extends { id: number | string }> extends Omit<AntTableProps<T>, 'onChange' | 'pagination'> {
  searchPlaceholder?: string;
  params: SearchParams;
  onParamsChange: (newParams: Partial<SearchParams>) => void;
  extraActions?: React.ReactNode;
  total?: number;
}

function DataTable<T extends { id: number | string }>({
  searchPlaceholder,
  params,
  onParamsChange,
  columns,
  dataSource,
  loading,
  extraActions,
  total = 0,
  ...restProps
}: DataTableProps<T>) {
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(
    params.startDate && params.endDate ? [params.startDate, params.endDate] : undefined
  );
  const [searchText, setSearchText] = useState(params.search || '');

  const handleSearch = useCallback((value: string) => {
    onParamsChange({
      search: value,
      startDate: dateRange?.[0],
      endDate: dateRange?.[1],
      page: 1
    });
  }, [onParamsChange, dateRange]);

  const handleTableChange = useCallback((
    pagination: TablePaginationConfig,
    filters: any,
    sorter: any
  ) => {
    onParamsChange({
      page: pagination.current,
      limit: pagination.pageSize,
      sort: sorter.field || 'id',
      order: sorter.order === 'ascend' ? 'asc' : 'desc',
      ...filters
    });
  }, [onParamsChange]);

  const paginationConfig = useMemo(() => ({
    current: params.page,
    pageSize: params.limit,
    total,
    showSizeChanger: true,
    showTotal: (total: number) => `Total ${total} items`,
  }), [params.page, params.limit, total]);

  const SearchComponent = useMemo(() => (
    <div className="flex flex-wrap items-center gap-4">
      <DateRangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates || undefined)}
      />
      <Search
        placeholder={searchPlaceholder || "Search..."}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        onSearch={handleSearch}
        className="w-full max-w-xs"
        allowClear
        enterButton={<SearchIcon size={18} className="text-muted-foreground" />}
      />
    </div>
  ), [searchPlaceholder, handleSearch, dateRange, searchText]);

  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm border border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        {SearchComponent}
        <div className="flex items-center gap-2">
          {extraActions}
        </div>
      </div>

      <Table
        {...restProps}
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={paginationConfig}
        onChange={handleTableChange}
        // Tailwind 폰트 토큰과 매끄럽게 연결되도록 커스텀 클래스 지정
        className="[&_.ant-table-thead>tr>th]:bg-secondary [&_.ant-table-thead>tr>th]:text-muted-foreground [&_.ant-table-thead>tr>th]:font-semibold"
      />
    </div>
  );
}

export default memo(DataTable) as typeof DataTable