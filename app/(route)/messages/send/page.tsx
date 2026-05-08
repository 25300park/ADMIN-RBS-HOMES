"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  message,
  Row,
  Col,
  Divider,
  Spin,
  Segmented,
  Select,
  Checkbox,
} from "antd";
import { SendOutlined, MailOutlined } from "@ant-design/icons";
import { Editor } from "@tinymce/tinymce-react";
import {
  sendDirectMessage,
  sendBroadcastMessage,
  getMessageTemplates,
  searchUsers as searchUsersAction,
} from "@/actions/message-action";

interface Template {
  id: number;
  name: string;
  title: string;
  content: string;
  type: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  image?: string;
}

const SendMessagePage = (): React.ReactNode => {
  const [form] = Form.useForm();
  const editorRef = useRef<any>(null);

  const [messageType, setMessageType] = useState<"direct" | "group">("direct");
  const [deliveryType, setDeliveryType] = useState<0 | 4>(0); // 0: Only Message, 4: With Email
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    number | undefined
  >(undefined);

  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await getMessageTemplates();
      if (result.success) {
        setTemplates(result.templates || []);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleSearchUsers = useCallback(async (keyword: string) => {
    if (!keyword || keyword.trim().length === 0) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await searchUsersAction(keyword, 8);
        if (result.success) {
          setSearchResults(result.users as any);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSelectedTemplateId(templateId);
      form.setFieldsValue({
        title: template.title,
        templateSelect: templateId,
      });
      if (editorRef.current) {
        editorRef.current.setContent(template.content);
      }
      message.success("Template applied");
    }
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setSelectedTemplateId(undefined);
    form.setFieldsValue({
      title: "",
      templateSelect: undefined,
    });
    if (editorRef.current) {
      editorRef.current.setContent("");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const content = editorRef.current?.getContent() || "";

      if (!content.trim()) {
        message.error("Please enter message content");
        return;
      }

      if (messageType === "direct" && !values.recipientId) {
        message.error("Please select a recipient");
        return;
      }

      setLoading(true);

      let result;
      if (messageType === "direct") {
        result = await sendDirectMessage({
          recipientId: values.recipientId,
          title: values.title,
          content: content,
          type: deliveryType, // 0 or 4
          priority: values.priority || 0,
          templateId: selectedTemplateId,
        });
      } else {
        result = await sendBroadcastMessage({
          title: values.title,
          content: content,
          type: deliveryType, // 0 or 4
          priority: values.priority || 0,
          templateId: selectedTemplateId,
        });
      }

      if (result.success) {
        message.success("Message sent successfully");
        form.resetFields();
        editorRef.current?.setContent("");
        setSelectedTemplate(null);
        setSelectedTemplateId(undefined);
        setDeliveryType(0);
      } else {
        message.error(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      message.error("An error occurred while sending the message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card className="shadow-sm rounded-lg">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            messageType: "direct",
            title: "",
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              {/* 메시지 타입 선택 */}
              <Form.Item label="Recipient Type" name="messageType">
                <Segmented
                  block
                  size="large"
                  onChange={(value) =>
                    setMessageType(value as "direct" | "group")
                  }
                  options={[
                    { label: "Direct Message (1:1)", value: "direct" },
                    { label: "Group Message (All Users)", value: "group" },
                  ]}
                />
              </Form.Item>

              {/* 수신자 선택 */}
              {messageType === "direct" && (
                <Form.Item
                  name="recipientId"
                  label="Recipient"
                  rules={[
                    { required: true, message: "Please select a recipient" },
                  ]}
                >
                  <Select
                    size="large"
                    placeholder="Search user by name or email..."
                    showSearch
                    notFoundContent={
                      searchLoading ? <Spin size="small" /> : null
                    }
                    onSearch={handleSearchUsers}
                    loading={searchLoading} 
                    filterOption={false} 
                    options={searchResults.map((user) => ({
                      label: `${user.name || user.email} (${user.email})`,
                      value: user.id,
                    }))}
                  />
                </Form.Item>
              )}

              {/* 제목 */}
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input size="large" placeholder="Message title" />
              </Form.Item>

              {/* 템플릿 선택 */}
              <Form.Item
                name="templateSelect"
                label="Select Template (Optional)"
              >
                <Select
                  size="large"
                  placeholder="Choose a template to use..."
                  allowClear
                  onSelect={handleTemplateSelect}
                  onClear={handleClearTemplate}
                  options={templates.map((template) => ({
                    label: template.name,
                    value: template.id,
                  }))}
                />
              </Form.Item>

              {/* 에디터 */}
              <Form.Item label="Content">
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
                  onInit={(evt: any, editor: any) => {
                    editorRef.current = editor;
                  }}
                  initialValue="<p>Message content...</p>"
                  init={{
                    height: 300,
                    menubar: true,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "print",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "paste",
                      "code",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                  }}
                />
              </Form.Item>

              <Divider />

              {/* 전송 방식 선택 - 버튼 그룹 */}
              <Form.Item label="Delivery Method" className="mb-6">
                <Space
                  size="large"
                  direction="vertical"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
                  >
                    <Button
                      size="large"
                      type={deliveryType === 0 ? "primary" : "default"}
                      onClick={() => setDeliveryType(0)}
                      style={{ flex: 1, minWidth: "150px" }}
                    >
                      <SendOutlined /> Only Message
                    </Button>
                    <Button
                      size="large"
                      type={deliveryType === 4 ? "primary" : "default"}
                      onClick={() => setDeliveryType(4)}
                      style={{ flex: 1, minWidth: "150px" }}
                    >
                      <MailOutlined /> With Email
                    </Button>
                  </div>
                  <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
                    {deliveryType === 0
                      ? "✓ Message will be sent to the system only"
                      : "✓ Message will be sent both to the system and via email"}
                  </p>
                </Space>
              </Form.Item>

              {/* 전송 버튼 */}
              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<SendOutlined />}
                >
                  Send Message
                </Button>
              </Form.Item>
            </Col>

            {/* 사이드바 - 정보 */}
            <Col xs={24} lg={8}>
              <Card type="inner" title="Message Info">
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="small"
                >
                  <div>
                    <strong style={{ fontSize: "12px", color: "#666" }}>
                      TYPE
                    </strong>
                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                      {messageType === "direct"
                        ? "Direct Message"
                        : "Group Message"}
                    </p>
                  </div>
                  <Divider style={{ margin: "12px 0" }} />
                  <div>
                    <strong style={{ fontSize: "12px", color: "#666" }}>
                      DELIVERY
                    </strong>
                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                      {deliveryType === 0 ? "Message Only" : "Message + Email"}
                    </p>
                  </div>
                  <Divider style={{ margin: "12px 0" }} />
                  <div>
                    <strong style={{ fontSize: "12px", color: "#666" }}>
                      TEMPLATE
                    </strong>
                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                      {selectedTemplate?.name || "None"}
                    </p>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default SendMessagePage;
