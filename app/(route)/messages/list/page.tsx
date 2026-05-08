"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Space,
  message,
  Empty,
  Tag,
  Tooltip,
  Divider,
  Checkbox,
} from "antd";
import { EyeOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  getAllMessages,
  deleteMessage,
  deleteMultipleMessages,
} from "@/actions/message-action";

interface Message {
  id: number;
  title: string;
  content: string;
  type: number;
  priority: number;
  sentAt: string;
  isRead?: boolean;
  status?: number;
  readAt?: string;
  senderId: number;
  recipientId?: number;
  groupId?: number;
  templateId?: number;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  recipient?: {
    id: number;
    name: string;
    email: string;
  };
  template?: {
    id: number;
    name: string;
  };
}

const MessageListPage = (): React.ReactNode => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<Message | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    loadMessages();
  }, [pagination.current]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const result = await getAllMessages(
        pagination.current,
        pagination.pageSize
      );
      if (result.success) {
        setMessages(result.messages as any);
        setSelectedRowKeys([]); // 새로 불러올 때 선택 초기화
      } else {
        message.error(result.error || "Failed to load messages");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      message.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (msg: Message) => {
    setPreviewMessage(msg);
    setPreviewVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Delete Message",
      content: "Are you sure you want to delete this message?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await deleteMessage(id);
          if (result.success) {
            message.success("Message deleted successfully");
            loadMessages();
          } else {
            message.error(result.error || "Failed to delete message");
          }
        } catch (error) {
          message.error("Failed to delete message");
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one message");
      return;
    }

    Modal.confirm({
      title: "Delete Selected Messages",
      content: `Are you sure you want to delete ${selectedRowKeys.length} selected message(s)?`,
      okText: "Yes, Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await deleteMultipleMessages(selectedRowKeys);
          if (result.success) {
            message.success(
              `${
                result.deletedCount || selectedRowKeys.length
              } message(s) deleted successfully`
            );
            setSelectedRowKeys([]);
            loadMessages();
          } else {
            message.error(result.error || "Failed to delete messages");
          }
        } catch (error) {
          console.error("Error deleting messages:", error);
          message.error("Failed to delete messages");
        }
      },
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(messages.map((msg) => msg.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const getTypeColor = (type: number) => {
    const typeMap: { [key: number]: string } = {
      0: "blue",
      1: "green",
      2: "orange",
      3: "red",
    };
    return typeMap[type] || "default";
  };

  const getTypeLabel = (type: number) => {
    const typeMap: { [key: number]: string } = {
      0: "General",
      1: "Notification",
      2: "Alert",
      3: "Urgent",
      4: "General",
    };
    return typeMap[type] || "Unknown";
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={
            selectedRowKeys.length === messages.length && messages.length > 0
          }
          indeterminate={
            selectedRowKeys.length > 0 &&
            selectedRowKeys.length < messages.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      dataIndex: "checkbox",
      key: "checkbox",
      width: 50,
      render: (_: any, record: Message) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, record.id]);
            } else {
              setSelectedRowKeys(
                selectedRowKeys.filter((key) => key !== record.id)
              );
            }
          }}
        />
      ),
    },
    {
      title: "From (Sender)",
      key: "sender",
      width: 140,
      ellipsis: true,
      render: (_: any, record: Message) => (
        <Tooltip title={record.sender?.email}>
          <span
            className="cursor-pointer hover:text-blue-600"
            onClick={() => {
              const width = 1000;
              const height = 1200;
              const left = window.screen.availWidth - width;
              const top = 0;
              const popup = window.open(
                `/users/detail/${record.sender?.id}`,
                `UserDetail_${record.sender?.id}`,
                `width=${width},
              height=${height},
              left=${left},
              top=${top},
              menubar=no,
              toolbar=no,
              location=no,
              status=no,
              resizable=no,
              scrollbars=no,
              titlebar=no`
              );

              if (popup) {
                popup.document.body.style.margin = "0";
                popup.document.body.style.padding = "0";
              }
            }}
          >
            {record.sender?.name || record.sender?.email}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "To (Recipient)",
      key: "recipient",
      width: 140,
      ellipsis: true,
      render: (_: any, record: Message) => {
        if (record.groupId) {
          return <span className="text-gray-500">All Users</span>;
        }
        return (
          <Tooltip title={record.recipient?.email || "N/A"}>
            <span
              className="cursor-pointer hover:text-blue-600"
              onClick={() => {
                const width = 1000;
                const height = 1200;
                const left = window.screen.availWidth - width;
                const top = 0;
                const popup = window.open(
                  `/users/detail/${record.recipient?.id}`,
                  `UserDetail_${record.recipient?.id}`,
                  `width=${width},
              height=${height},
              left=${left},
              top=${top},
              menubar=no,
              toolbar=no,
              location=no,
              status=no,
              resizable=no,
              scrollbars=no,
              titlebar=no`
                );

                if (popup) {
                  popup.document.body.style.margin = "0";
                  popup.document.body.style.padding = "0";
                }
              }}
            >
              {record.recipient?.name || record.recipient?.email || "N/A"}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Group Message",
      key: "isGroup",
      width: 120,
      render: (_: any, record: Message) => (
        <Tag color={record.groupId ? "blue" : "default"}>
          {record.groupId ? "Yes (Broadcast)" : "No (Direct)"}
        </Tag>
      ),
    },
    {
      title: "Subject",
      dataIndex: "title",
      key: "title",
      width: 180,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="font-medium">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Template",
      key: "template",
      width: 140,
      ellipsis: true,
      render: (_: any, record: Message) => (
        <span className="text-sm text-gray-600">
          {record.template ? (
            <Tooltip title={record.template.name}>
              {record.template.name}
            </Tooltip>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (type: number) => (
        <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
      ),
    },
    {
      title: "With Email",
      dataIndex: "type",
      key: "email",
      width: 110,
      render: (_:any, record: Message) => (
        <Tag color={record.type === 4 ? "blue" : "red"}>
          {record.type === 4 ? "True" : "False"}
        </Tag>
      ),
    },
    {
      title: "Read Status",
      key: "readStatus",
      width: 120,
      render: (_: any, record: Message) => (
        <Tag color={record.isRead ? "green" : "default"}>
          {record.status === 2 ? "-" : record.isRead ? "Read" : "Unread"}
        </Tag>
      ),
    },
    {
      title: "Message Status",
      key: "status",
      width: 120,
      render: (_: any, record: Message) => (
        <Tag color={record.status === 2 ? "red" : "green"}>
          {record.status === 2 ? "Delete" : "Normal"}
        </Tag>
      ),
    },
    {
      title: "Sent At",
      dataIndex: "sentAt",
      key: "sentAt",
      width: 150,
      render: (date: string) => new Date(date).toLocaleString("ko-KR"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: Message) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
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
      <div className="flex justify-between items-center">
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadMessages()}
            loading={loading}
            size="large"
          >
            Refresh
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleBatchDelete}
              size="large"
            >
              Delete Selected ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
      </div>

      <Card className="shadow-sm rounded-lg">
        <Table
          columns={columns}
          dataSource={messages.map((m) => ({ ...m, key: m.id }))}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: messages.length,
            onChange: (page) => setPagination({ ...pagination, current: page }),
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} messages`,
          }}
          onRow={(record) => ({
            className: "hover:bg-gray-50 transition-colors duration-200",
          })}
        />
      </Card>

      <Modal
        title="Message Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setPreviewVisible(false)}
          >
            Close
          </Button>,
        ]}
        width={900}
        bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        {previewMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From (Sender)
                </label>
                <p className="text-gray-900 mt-1">
                  {previewMessage.sender?.name || previewMessage.sender?.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  To (Recipient)
                </label>
                <p className="text-gray-900 mt-1">
                  {previewMessage.groupId
                    ? "All Users (Broadcast)"
                    : previewMessage.recipient?.name ||
                      previewMessage.recipient?.email ||
                      "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <p className="text-gray-900 mt-1">
                  <Tag color={getTypeColor(previewMessage.type)}>
                    {getTypeLabel(previewMessage.type)}
                  </Tag>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message Type
                </label>
                <p className="text-gray-900 mt-1">
                  <Tag color={previewMessage.groupId ? "blue" : "default"}>
                    {previewMessage.groupId ? "Broadcast" : "Direct"}
                  </Tag>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Template
                </label>
                <p className="text-gray-900 mt-1">
                  {previewMessage.template ? (
                    <Tag>{previewMessage.template.name}</Tag>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sent At
                </label>
                <p className="text-gray-900 mt-1">
                  {new Date(previewMessage.sentAt).toLocaleString("ko-KR")}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <p className="text-gray-900 mt-1 font-semibold">
                {previewMessage.title}
              </p>
            </div>

            <Divider />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <div
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: previewMessage.content,
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MessageListPage;
