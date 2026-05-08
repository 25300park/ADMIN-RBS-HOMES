
import { SCHEDULE_STATUS } from "@/utils/constants/schedule";

export type ScheduleStatusType = typeof SCHEDULE_STATUS[keyof typeof SCHEDULE_STATUS]

export interface Schedule {
  id: number;
  unitId: number;
  userId: number | null;
  username: string | null;
  email: string | null;
  mobile: string | null;
  requestDate: string | null;
  date: string | null;
  startedAt: string | null;
  endedAt: string | null;
  title: string | null;
  message: string | null;
  desc: string | null;
  location: string | null;
  regdate: string;
  status: number;
  lastUpdate: string;
  regId: number | null;
}

export interface StatusChangeProps {
  id: number;
  status: number;
  confirmData?: { 
    date: Date; 
    title: string; 
    desc: string; 
  };
}

export interface ScheduleUpdateParams {
  id: number;
  status: number;
}