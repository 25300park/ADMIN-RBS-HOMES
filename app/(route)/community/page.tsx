"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  getCondoList,
} from "@/actions/pms-action";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Typography,
  Popconfirm,
  message,
  Spin,
  Alert,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

type CondoOption = { id: number; condoName: string };
type Post = {
  id: number;
  title: string;
  body: string;
  isNotice: boolean;
  createdAt: string;
  author: { id: number; name: string | null };
  condo: { id: number; condoName: string };
};

export default function CommunityPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [condoId, setCondoId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 콘도 목록
  const { data: condos, isLoading: condosLoading } = useQuery<CondoOption[]>({
    queryKey: ["condos"],
    queryFn: getCondoList,
  });

  // 첫 번째 콘도를 기본 선택
  useEffect(() => {
    if (condos && condos.length > 0 && !condoId) {
      setCondoId(condos[0].id);
    }
  }, [condos, condoId]);

  // 게시글 목록
  const { data, isLoading } = useQuery({
    queryKey: ["community", condoId, page],
    queryFn: () => getCommunityPosts({ page, limit: 20, condoId }),
    enabled: !!condoId,
  });

  const createMutation = useMutation({
    mutationFn: createCommunityPost,
    onSuccess: () => {
      message.success("Post created");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["community"] });
    },
    onError: () => message.error("Failed to create post"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCommunityPost,
    onSuccess: () => {
      message.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["community"] });
    },
    onError: () => message.error("Failed to delete post"),
  });

  const handleCreate = (values: any) => {
    createMutation.mutate({
      condoId: condoId!,
      authorId: Number((session?.user as any)?.id),
      title: values.title,
      body: values.body,
      isNotice: values.isNotice ?? false,
    });
  };

  const columns: ColumnsType<Post> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
    },
    {
      title: "Title",
      dataIndex: "title",
      ellipsis: true,
      render: (title: string, record: Post) => (
        <Space>
          {record.isNotice && <Tag color="orange">Notice</Tag>}
          <span>{title}</span>
        </Space>
      ),
    },
    {
      title: "Author",
      width: 120,
      render: (_: any, r: Post) => r.author.name ?? "—",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      width: 110,
      render: (v: string) => dayjs(v).format("YY.MM.DD HH:mm"),
    },
    {
      title: "Delete",
      width: 80,
      render: (_: any, record: Post) => (
        <Popconfirm
          title="Delete this post?"
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={deleteMutation.isPending}
          />
        </Popconfirm>
      ),
    },
  ];

  if (condosLoading) return <Spin className="flex justify-center mt-10" />;

  if (!condos || condos.length === 0) {
    return (
      <Alert
        type="info"
        message="No condos found. Please create a CondoMaster record first."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Space>
          <Text className="text-sm text-gray-500">Condo:</Text>
          <Select
            style={{ width: 220 }}
            options={condos.map((c) => ({ label: c.condoName, value: c.id }))}
            value={condoId}
            onChange={(v) => { setCondoId(v); setPage(1); }}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          disabled={!condoId}
        >
          New Post
        </Button>
      </div>

      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={data?.posts as Post[]}
        loading={isLoading || deleteMutation.isPending}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          onChange: setPage,
          showTotal: (total) => `Total ${total} posts`,
        }}
      />

      {/* 게시글 작성 모달 */}
      <Modal
        title="New Community Post"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Post"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input maxLength={300} />
          </Form.Item>
          <Form.Item
            label="Content"
            name="body"
            rules={[{ required: true, message: "Content is required" }]}
          >
            <TextArea rows={5} />
          </Form.Item>
          <Form.Item label="Post as Notice" name="isNotice" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
