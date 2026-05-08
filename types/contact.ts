// types/contact.ts
export interface ContactItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  adminId: number | null;
  response: string | null;
  responseType: number | null;
  respondedAt: string | null;
  memo: string | null;
  ip: string | null;
  userId: number | null;
  
  // Relations
  admin?: {
    id: number;
    username: string | null;
    email: string | null;
  };
  user?: {
    id: number;
    username: string | null;
    email: string | null;
  };
}

export interface ContactStatusChangeProps {
  id: number;
  status: number;
  response?: string;
  responseType?: number;
  memo?: string;
}

export const CONTACT_STATUS = {
  REQUESTED: 0,
  PROCESSING: 1,
  COMPLETED: 2,
} as const;

export type ContactStatusType = typeof CONTACT_STATUS[keyof typeof CONTACT_STATUS];

export const CONTACT_STATUS_MAP: any = {
  [CONTACT_STATUS.REQUESTED]: { text: 'Requested', color: 'warning' },
  [CONTACT_STATUS.PROCESSING]: { text: 'Processing', color: 'processing' },
  [CONTACT_STATUS.COMPLETED]: { text: 'Completed', color: 'success' },
};

export const RESPONSE_TYPE_MAP: any = {
  0: { text: 'Email', color: 'blue' },
  1: { text: 'Phone', color: 'green' },
  2: { text: 'SMS', color: 'purple' },
  3: { text: 'Other', color: 'orange' },
};