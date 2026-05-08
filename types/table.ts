import type { ColumnsType } from 'antd/es/table'

export interface TableProps<T> {
  columns: ColumnsType<T>
  data?: T[]
  total?: number
  currentPage: number
  pageSize: number
  loading?: boolean
  searchPlaceholder?: string
  showSearch?: boolean
  scroll?: { x?: number | string; y?: number | string }
  onSearch?: (value: string) => void
  onPageChange: (page: number, pageSize: number) => void
  extraActions?: React.ReactNode // 추가 액션 버튼들
  rowSelection?: boolean
  onSelectionChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
}

export interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  sellType?: any;
  sort?: string;
  order?: 'asc' | 'desc';
  startDate?: string; 
  endDate?: string;  
  [key: string]: any; 
}
