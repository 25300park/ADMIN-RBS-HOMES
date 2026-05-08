'use client'
import { Table, Input, Space } from 'antd'
import { memo, useCallback, useMemo, useState } from 'react'
import type { TableProps as AntTableProps, TablePaginationConfig } from 'antd/es/table'
import type { SearchParams } from '@/types/table'
import { DateRangePicker } from '@/components/date-range-picker'

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
  // 날짜 상태를 임시로 저장
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(
    params.startDate && params.endDate ? [params.startDate, params.endDate] : undefined
  );

  // 검색어 상태를 임시로 저장
  const [searchText, setSearchText] = useState(params.search || '');

  // 통합 검색 핸들러
  const handleSearch = useCallback((value: string) => {
    onParamsChange({
      search: value,
      startDate: dateRange?.[0],
      endDate: dateRange?.[1],
      page: 1
    });
  }, [onParamsChange, dateRange]);

  // 테이블 변경 핸들러
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

  // 페이지네이션 설정
  const paginationConfig = useMemo(() => ({
    current: params.page,
    pageSize: params.limit,
    total,
    showSizeChanger: true,
    showTotal: (total: number) => `Total ${total} items`,
  }), [params.page, params.limit, total]);

  // 검색 영역 컴포넌트
  const SearchComponent = useMemo(() => (
    <Space size="middle">
      <DateRangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates || undefined)}
      />
      <Search
        placeholder={searchPlaceholder}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        onSearch={handleSearch}
        style={{ width: 300 }}
        allowClear
      />
    </Space>
  ), [searchPlaceholder, handleSearch, dateRange, searchText]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {SearchComponent}
        {extraActions}
      </div>

      <Table
        {...restProps}
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={paginationConfig}
        onChange={handleTableChange}
      />
    </div>
  );
}

export default memo(DataTable) as typeof DataTable