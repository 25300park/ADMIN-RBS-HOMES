export interface User {
  id: number
  username: string | null
  email: string | null
  name: string | null
  level: number
  phone: string | null
  status: number
  regdate: string
  lastUpdate: string | null
 }

 export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  status?: number;
  sort?: string;
  order?: 'asc' | 'desc';
 }
 