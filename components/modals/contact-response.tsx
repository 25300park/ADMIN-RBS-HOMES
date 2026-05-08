import { Modal, Form, Input, Select, Descriptions, Tag, Space, Button, Typography } from "antd";
import { useEffect } from "react";
import { ContactItem, RESPONSE_TYPE_MAP, CONTACT_STATUS } from "@/types/contact";
import { formatToKST_DATE } from "@/utils/format";

const { TextArea } = Input;
const { Text } = Typography;

interface ContactResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { response: string; responseType: number; memo?: string }) => void;
  loading: boolean;
  contact: ContactItem | null;
}

export const ContactResponseModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  contact,
}: ContactResponseModalProps) => {
  const [form] = Form.useForm();
  const isCompleted = contact?.status === CONTACT_STATUS.COMPLETED;

  useEffect(() => {
    if (isOpen && contact) {
      form.setFieldsValue({
        response: contact.response || "",
        responseType: contact.responseType || 0,
        memo: contact.memo || "",
      });
    }
  }, [isOpen, contact, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  if (!contact) return null;

  return (
    <Modal
      title={`Contact #${contact.id} ${isCompleted ? "(Completed)" : ""}`}
      open={isOpen}
      onCancel={onClose}
      footer={
        isCompleted
          ? [
              <Button key="close" onClick={onClose}>
                Close
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={loading}
                onClick={handleSubmit}
              >
                Submit Response
              </Button>,
            ]
      }
      width={700}
    >
      <div className="space-y-6">
        <Descriptions
          bordered
          size="small"
          column={1}
          labelStyle={{ width: 120 }}
        >
          <Descriptions.Item label="Status">
            <Tag color={
              contact.status === CONTACT_STATUS.REQUESTED
                ? "warning"
                : contact.status === CONTACT_STATUS.PROCESSING
                ? "processing"
                : "success"
            }>
              {contact.status === CONTACT_STATUS.REQUESTED
                ? "Requested"
                : contact.status === CONTACT_STATUS.PROCESSING
                ? "Processing"
                : "Completed"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Name">
            {contact.name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            <a href={`tel:${contact.phone}`}>{contact.phone}</a>
          </Descriptions.Item>
          {contact.user && (
            <Descriptions.Item label="User Account">
              <Button
                type="link"
                onClick={() => {
                  const width = 1000;
                  const height = 1200;
                  const left = window.screen.availWidth - width;
                  const top = 0;

                  window.open(
                    `/users/detail/${contact.userId}`,
                    `UserDetail_${contact.userId}`,
                    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=no,scrollbars=no,titlebar=no`
                  );
                }}
              >
                {contact.user.username || contact.user.email}
              </Button>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Date">
            {formatToKST_DATE(contact.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="IP Address">
            {contact.ip || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Message">
            <div className="whitespace-pre-wrap">{contact.message}</div>
          </Descriptions.Item>
        </Descriptions>

        {/* 응답 정보 섹션 */}
        {isCompleted ? (
          <div className="mt-6">
            <Text strong className="mb-2 block text-lg">Response Information</Text>
            <Descriptions bordered size="small" column={1} labelStyle={{ width: 120 }}>
              <Descriptions.Item label="Response Type">
                {/* @ts-ignore - 타입 에러 무시 */}
                <Tag color={RESPONSE_TYPE_MAP[contact.responseType || 0].color}>
                  {RESPONSE_TYPE_MAP[contact.responseType || 0].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Response">
                <div className="whitespace-pre-wrap">{contact.response}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Memo">
                <div className="whitespace-pre-wrap">{contact.memo || "-"}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Responded At">
                {contact.respondedAt ? formatToKST_DATE(contact.respondedAt) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Responded By">
                {contact.admin ? (
                  <span>{contact.admin.username || contact.admin.email || "-"}</span>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <div className="mt-6">
            <Text strong className="mb-2 block text-lg">Submit Response</Text>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                responseType: 0,
                response: "",
                memo: "",
              }}
            >
              <Form.Item
                name="responseType"
                label="Response Method"
                rules={[{ required: true, message: "Please select response method" }]}
              >
                <Select
                  options={[
                    { label: "Email", value: 0 },
                    { label: "Phone", value: 1 },
                    { label: "SMS", value: 2 },
                    { label: "Other", value: 3 },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="response"
                label="Response"
                rules={[{ required: true, message: "Please enter your response" }]}
              >
                <TextArea
                  rows={6}
                  placeholder="Enter your response to the contact inquiry..."
                />
              </Form.Item>
              <Form.Item
                name="memo"
                label="Internal Memo (Optional)"
              >
                <TextArea
                  rows={3}
                  placeholder="Add notes for internal reference (not sent to customer)..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </div>
    </Modal>
  );
};