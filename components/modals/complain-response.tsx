import { Modal, Form, Input, Select, Descriptions, Tag, Space, Button } from "antd";
import { useEffect } from "react";
import { ComplainItem, RESPONSE_TYPE_MAP } from "@/types/complain";
import { formatToKST_DATE } from "@/utils/format";
const { TextArea } = Input;

interface ComplainResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { response: string; responseType: number }) => void;
  loading: boolean;
  complain: ComplainItem | null;
  viewOnly?: boolean;
}

export const ComplainResponseModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  complain,
  viewOnly = false,
}: ComplainResponseModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && complain) {
      form.setFieldsValue({
        response: complain.response || "",
        responseType: complain.responseType || 0,
      });
    }
  }, [isOpen, complain, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  if (!complain) return null;

  return (
    <Modal
      title={viewOnly ? "Complaint Details" : "Respond to Complaint"}
      open={isOpen}
      onCancel={onClose}
      onOk={viewOnly ? onClose : handleSubmit}
      okText={viewOnly ? "Close" : "Submit Response"}
      confirmLoading={loading}
      width={700}
      okButtonProps={{ style: viewOnly ? { display: "none" } : {} }}
      cancelText={viewOnly ? "Close" : "Cancel"}
    >
      <div className="space-y-6">
        <Descriptions
          bordered
          size="small"
          column={1}
          labelStyle={{ width: 120 }}
        >
          <Descriptions.Item label="Unit">
            {complain.unit ? (
              <Button
                type="link"
                onClick={() => {
                  const width = 800;
                  const height = 1100;
                  const left = 300;
                  const top = (window.screen.height - height) / 2;

                  window.open(
                    `/units/detail/${complain.unitId}`,
                    `UnitDetail_${complain.unitId}`,
                    `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
                  );
                }}
              >
                {complain.unit.title}
              </Button>
            ) : (
              `Unit #${complain.unitId}`
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Unit Writer">
            <Space direction="vertical" size="small">
              <div>
                {complain.writer ? (
                  <Button
                    type="link"
                    onClick={() => {
                      const width = 1000;
                      const height = 1200;
                      const left = window.screen.availWidth - width;
                      const top = 0;

                      window.open(
                        `/users/detail/${complain.writerId}`,
                        `UserDetail_${complain.writerId}`,
                        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=no,scrollbars=no,titlebar=no`
                      );
                    }}
                  >
                    {complain.writer.username || complain.writer.email}
                  </Button>
                ) : (
                  `User #${complain.writerId}`
                )}
              </div>
              <div>{complain.writer?.email || "-"}</div>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="User">
            <Space direction="vertical" size="small">
              <div>{complain.user?.username || "-"}</div>
              <div>{complain.user?.email || "-"}</div>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Date">
            {formatToKST_DATE(complain.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Message">
            <div className="whitespace-pre-wrap">{complain.message}</div>
          </Descriptions.Item>
          
          {viewOnly && complain.response && (
            <>
              <Descriptions.Item label="Response Type">
                <Tag color={RESPONSE_TYPE_MAP[complain.responseType || 0].color}>
                  {RESPONSE_TYPE_MAP[complain.responseType || 0].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Response">
                <div className="whitespace-pre-wrap">{complain.response}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Responded At">
                {complain.respondedAt ? formatToKST_DATE(complain.respondedAt) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Responded By">
                {complain.admin?.username || complain.admin?.email || "-"}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        {!viewOnly && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              responseType: 0,
              response: "",
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
                placeholder="Enter your response to the complaint..."
              />
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
};