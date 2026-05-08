import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs'; 
const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  onChange: (dates: [string, string] | null) => void;
  value?: [string, string];
}

export const DateRangePicker = ({ onChange, value }: DateRangePickerProps) => {
  const handleChange = (
    dates: null | [Dayjs | null, Dayjs | null], 
    dateStrings: [string, string] | null
  ) => {
    if (!dates || !dates[0] || !dates[1]) {
      onChange(null);
      return;
    }

    const [start, end] = dates;
    onChange([
      start.startOf('day').toISOString(),
      end.endOf('day').toISOString(),
    ]);
  };

  return (
    <RangePicker
      onChange={handleChange}
      value={value ? [dayjs(value[0]), dayjs(value[1])] : undefined}
      placeholder={['Start Date', 'End Date']}
    />
  );
};