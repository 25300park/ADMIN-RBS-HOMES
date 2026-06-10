export interface ComplainItem {
  id: number;
  unitId: number;
  writerId: number;
  userId: number;
  message: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  adminId: number | null;
  response: string | null;
  responseType: number | null;
  respondedAt: string | null;
  
  unit?: {
    id: number;
    title: string;
    fullAddress: string | null;
  };
  writer?: {
    id: number;
    username: string | null;
    email: string | null;
  };
  user?: {
    id: number;
    username: string | null;
    email: string | null;
  };
  admin?: {
    id: number;
    username: string | null;
    email: string | null;
  };
}

export interface ComplainStatusChangeProps {
  id: number;
  status: number;
  response?: string;
  responseType?: number;
}

export const COMPLAIN_STATUS = {
  REQUESTED: 0,
  PROCESSING: 1,
  COMPLETED: 2,
} as const;

export type ComplainStatusType = typeof COMPLAIN_STATUS[keyof typeof COMPLAIN_STATUS];

export const COMPLAIN_STATUS_MAP:any = {
  [COMPLAIN_STATUS.REQUESTED]: { text: 'Requested', color: 'warning' },
  [COMPLAIN_STATUS.PROCESSING]: { text: 'Processing', color: 'processing' },
  [COMPLAIN_STATUS.COMPLETED]: { text: 'Completed', color: 'success' },
};

export const RESPONSE_TYPE_MAP:any = {
  0: { text: 'Email', color: 'blue' },
  1: { text: 'Phone', color: 'green' },
  2: { text: 'SMS', color: 'purple' },
  3: { text: 'Other', color: 'orange' },
};