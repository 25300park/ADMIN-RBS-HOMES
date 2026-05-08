import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (
 date: string | Date,
 format: string = 'YYYY-MM-DD HH:mm:ss'
) => {
 if (!date) return '-'
 return dayjs(date).format(format)
}

export const formatToKST = (date: string) => {
  return dayjs(date).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm");
};

export const formatToKST_DATE = (date: string) => {
  return dayjs(date).tz("Asia/Seoul").format("YYYY-MM-DD");
};
