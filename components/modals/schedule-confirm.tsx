// components/modals/schedule-confirm.tsx
import { Modal, Form, Input, DatePicker } from "antd";
import dayjs from "dayjs";
import type { Schedule } from "@/types/schedule";
import { useEffect } from "react";

interface ScheduleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (values: { date: Date; title: string; desc: string }) => void;
  loading: boolean;
  initialDate: Date;
  schedule: Schedule | null;
}

export const ScheduleConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  initialDate,
  schedule,
}: ScheduleConfirmModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && schedule) {
      form.setFieldsValue({
        date: dayjs(initialDate),
        title:
          schedule.title ||
          `Schedule Confirmation for ${schedule.username || "Guest"}`,
        desc: schedule.message || "", // 기존 메시지를 설명에 기본값으로 설정
      });
    }
  }, [isOpen, schedule, initialDate, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onConfirm({
        ...values,
        date: values.date.toDate(), // dayjs 객체를 Date 객체로 변환
      });
    });
  };

  return (
    <Modal
      title="Confirm Schedule"
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Confirm"
      cancelText="Cancel"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="date"
          label="User Requested Date"
          rules={[
            { required: true, message: "Please select meeting date and time" },
          ]}
        >
          <DatePicker
            showTime={{
              format: "HH:mm",
              defaultValue: dayjs("09:00", "HH:mm"),
            }}
            format="YYYY-MM-DD HH:mm"
            className="w-full"
            placeholder="Select date and time"
          />
        </Form.Item>
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please enter title" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="desc"
          label="Description"
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
