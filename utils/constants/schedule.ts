export const SCHEDULE_STATUS = {
  REQUESTED: 0,
  PENDING: 1,
  CONFIRMED: 2,
  CANCELLED: 3,
} as const;

export type ScheduleStatusType = typeof SCHEDULE_STATUS[keyof typeof SCHEDULE_STATUS];

type ScheduleStatusMapType = {
  [K in ScheduleStatusType]: {
    text: string;
    color: string;
  }
};

export const SCHEDULE_STATUS_MAP: ScheduleStatusMapType = {
  [SCHEDULE_STATUS.REQUESTED]: { text: 'Requested', color: 'processing' },
  [SCHEDULE_STATUS.PENDING]: { text: 'Pending', color: 'warning' },
  [SCHEDULE_STATUS.CONFIRMED]: { text: 'Confirmed', color: 'success' },
  [SCHEDULE_STATUS.CANCELLED]: { text: 'Cancelled', color: 'error' },
};