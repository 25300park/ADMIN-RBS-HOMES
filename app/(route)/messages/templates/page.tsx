"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Empty,
  Tag,
  Divider,
  Row,
  Col,
  Tooltip,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  EyeOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { Editor } from "@tinymce/tinymce-react";
import { getMessageTemplates, deleteMessageTemplate, createMessageTemplate, updateMessageTemplate } from "@/actions/message-action";

export interface MessageTemplatesPageProps {}

interface Template {
  id: number;
  name: string;
  title: string;
  description?: string;
  content: string;
  type: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  createdByUser: {
    id: number;
    name: string;
    email: string;
  };
}

const MessageTemplatesPage = ({}: MessageTemplatesPageProps): React.ReactNode => {
  const [form] = Form.useForm();
  const editorRef = useRef<any>(null);
  
  // 상태 관리
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [templateType, setTemplateType] = useState(0);

  // 템플릿 목록 로드
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await getMessageTemplates();
      if (result.success) {
        setTemplates(result.templates as any);
      } else {
        message.error(result.error || "Failed to load templates");
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      message.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadTemplates();
  }, []);

  // 에디터 이미지 업로드 핸들러
  const handleEditorImageUpload = (blobInfo: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", blobInfo.blob(), blobInfo.filename());

      fetch("/api/upload/editor", {
        method: "POST",
        body: uploadFormData,
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.url) {
            resolve(result.url);
          } else {
            reject("Upload failed");
          }
        })
        .catch(() => reject("Upload failed"));
    });
  };

  const editorConfig = {
    apiKey: process.env.NEXT_PUBLIC_TINYMCE_KEY,
    height: 350,
    menubar: "file edit view insert format tools table help",
    plugins: [
      "advlist", "autolink", "lists", "link", "image", "charmap", "anchor",
      "searchreplace", "visualblocks", "code", "insertdatetime", "media",
      "table", "paste", "code", "help", "wordcount",
    ],
    toolbar:
      "undo redo | blocks fontsize | bold italic underline | " +
      "alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | link image media table | code",
    images_upload_handler: handleEditorImageUpload,
    automatic_uploads: true,
    file_picker_types: "image media",
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        color: #333;
      }
    `,
  };

  // 새 템플릿 생성 모달 열기
  const handleAddNew = () => {
    setEditingTemplate(null);
    form.resetFields();
    editorRef.current?.setContent("");
    setTemplateType(0);
    setIsFormVisible(true);
  };

  // 템플릿 편집
  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      name: template.name,
      title: template.title,
      description: template.description,
      type: template.type,
    });
    setTemplateType(template.type);
    if (editorRef.current) {
      editorRef.current.setContent(template.content);
    }
    setIsFormVisible(true);
  };

  // 템플릿 미리보기
  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setPreviewVisible(true);
  };

  // 템플릿 삭제
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Delete Template",
      content: "Are you sure you want to delete this template? This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await deleteMessageTemplate(id);
          if (result.success) {
            message.success("Template deleted successfully");
            loadTemplates();
          } else {
            message.error(result.error || "Failed to delete template");
          }
        } catch (error) {
          console.error("Error deleting template:", error);
          message.error("An error occurred while deleting the template");
        }
      },
    });
  };

  // 폼 제출
  const handleSubmit = async (values: any) => {
    try {
      const editorContent = editorRef.current?.getContent() || "";

      if (!editorContent.trim()) {
        message.error("Please enter template content");
        return;
      }

      setFormLoading(true);

      let result;
      if (editingTemplate) {
        result = await updateMessageTemplate(editingTemplate.id, {
          name: values.name,
          title: values.title,
          description: values.description,
          content: editorContent,
          type: values.type,
        });
      } else {
        result = await createMessageTemplate({
          name: values.name,
          title: values.title,
          description: values.description,
          content: editorContent,
          type: values.type,
        });
      }

      if (result.success) {
        message.success(
          editingTemplate
            ? "Template updated successfully"
            : "Template created successfully"
        );
        setIsFormVisible(false);
        loadTemplates();
      } else {
        message.error(result.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      message.error("An error occurred while saving the template");
    } finally {
      setFormLoading(false);
    }
  };

  // 테이블 컬럼
  const columns = [
    {
      title: "Template Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="font-semibold text-gray-700">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: number) => {
        const typeMap: { [key: number]: { text: string; color: string } } = {
          0: { text: "General", color: "blue" },
          1: { text: "Notification", color: "green" },
          2: { text: "Alert", color: "orange" },
          3: { text: "Urgent", color: "red" },
        };
        const typeInfo = typeMap[type] || { text: "Unknown", color: "default" };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: "Created By",
      dataIndex: ["createdByUser", "name"],
      key: "createdBy",
      width: 120,
      ellipsis: true,
      render: (name: string) => <span>{name || "-"}</span>,
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
        render: (date: string) => date ? new Date(date).toLocaleString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      fixed: "right" as const,
      render: (_: any, record: Template) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddNew}
        >
          Create Template
        </Button>
      </div>

      {/* 템플릿 목록 */}
      <Card className="shadow-sm rounded-lg">

          <Table
            columns={columns}
            dataSource={templates.map((t) => ({ ...t, key: t.id }))}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} templates`,
            }}
            className="overflow-hidden"
            onRow={(record) => ({
              className: "hover:bg-gray-50 transition-colors duration-200",
            })}
          />
      </Card>

      {/* 생성/편집 모달 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FormOutlined />
            <span>{editingTemplate ? "Edit Template" : "Create New Template"}</span>
          </div>
        }
        open={isFormVisible}
        onCancel={() => setIsFormVisible(false)}
        footer={null}
        width={900}
        destroyOnClose={true}
        bodyStyle={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        <Divider style={{ margin: "16px 0" }} />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 0 }}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[
              { required: true, message: "Please enter template name" },
              { min: 2, message: "Template name must be at least 2 characters" },
            ]}
          >
            <Input
              placeholder="e.g., Welcome Email, Password Reset"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Message Title"
            rules={[
              { required: true, message: "Please enter message title" },
            ]}
          >
            <Input
              placeholder="e.g., Welcome to our platform"
              size="large"
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={2}
              placeholder="Enter template description (optional)"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Template Type"
            rules={[{ required: true, message: "Please select template type" }]}
          >
            <Select
              size="large"
              options={[
                { label: "General", value: 0 },
                { label: "Notification", value: 1 },
                { label: "Alert", value: 2 },
                { label: "Urgent", value: 3 },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Message Content"
            required
            rules={[{ required: true, message: "Please enter message content" }]}
          >
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <Editor
                     apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
                key={editingTemplate?.id || 'new'}
                onInit={(evt: any, editor: any) => {
                  editorRef.current = editor;
                }}
                value={editingTemplate?.content}
                onEditorChange={(content: any) => {
                  // Optional: handle real-time changes
                }}
                init={editorConfig}
              />
            </div>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button
                onClick={() => setIsFormVisible(false)}
                icon={<CloseOutlined />}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={formLoading}
                icon={<SaveOutlined />}
              >
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 미리보기 모달 */}
      <Modal
        title="Template Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {previewTemplate && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Template Name
                  </label>
                  <p className="text-gray-900 mt-1">{previewTemplate.name}</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <p className="text-gray-900 mt-1">
                    <Tag color={
                      previewTemplate.type === 0 ? "blue" :
                      previewTemplate.type === 1 ? "green" :
                      previewTemplate.type === 2 ? "orange" : "red"
                    }>
                      {["General", "Notification", "Alert", "Urgent"][previewTemplate.type]}
                    </Tag>
                  </p>
                </div>
              </Col>
            </Row>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message Title
              </label>
              <p className="text-gray-900 mt-1 font-semibold">{previewTemplate.title}</p>
            </div>

            {previewTemplate.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <p className="text-gray-700 mt-1">{previewTemplate.description}</p>
              </div>
            )}

            <Divider />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content
              </label>
              <div
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: previewTemplate.content,
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MessageTemplatesPage;