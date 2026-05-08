"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserDetail,
  getUserLoginLogs,
  updateUser,
} from "@/actions/user-action";
import {
  Card,
  Descriptions,
  Tabs,
  Space,
  Tag,
  Table,
  Button,
  Modal,
  Select,
  Input,
  message,
} from "antd";
import { useParams } from "next/navigation";
import type { TabsProps } from "antd";
import {
  USER_LEVEL_MAP,
  USER_STATUS_MAP,
  UserLevelType,
  UserStatusType,
} from "@/utils/constants/user";
import { formatDate } from "@/utils/format";
import { SELL_TYPE_OPTIONS, UNIT_TYPE_OPTIONS } from "@/utils/constants/unit";

const { TextArea } = Input;

export default function UserDetailPage() {
  const params = useParams();
  const userId = Number(params.id);
  const [loginLogPage, setLoginLogPage] = useState(1);
  const pageSize = 10;
  const [activeTab, setActiveTab] = useState("units");
  const queryClient = useQueryClient();

  // 모달 관련 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<number>(-1);
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editMemo, setEditMemo] = useState<string>("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserDetail(userId),
  });

  const { data: loginLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["userLoginLogs", userId, loginLogPage],
    queryFn: () => getUserLoginLogs({ userId, page: loginLogPage, pageSize }),
    enabled: activeTab === "loginHistory",
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      message.success("User updated successfully");
      setIsEditModalOpen(false);
      window.location.reload();
    },
    onError: (error: Error) => {
      message.error(`Failed to update user: ${error.message}`);
    },
  });

  const handleEditClick = () => {
    if (user) {
      setEditStatus(user.status);
      setEditLevel(user.level);
      setEditMemo(user.memo || "");
      setIsEditModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card loading={true} />
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const tabItems: TabsProps["items"] = [
    {
      key: "units",
      label: "Units",
      children: (
        <Table
          dataSource={user.unit}
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              width: 80,
            },
            {
              title: "Title",
              dataIndex: "title",
              ellipsis: true,
            },
            {
              title: "sell type",
              dataIndex: "sellType",
              width: 100,
              render: (sellType: string) => {
                const option = SELL_TYPE_OPTIONS.find(
                  (option) => option.value === sellType
                );
                return (
                  <Tag color={option?.color}>{option?.label || sellType}</Tag>
                );
              },
            },
            {
              title: "Type",
              dataIndex: "type",
              width: 100,
              render: (type: string) => {
                const option = UNIT_TYPE_OPTIONS.find(
                  (option) => option.value === type
                );
                return <Tag color={option?.color}>{option?.label || type}</Tag>;
              },
            },
            {
              title: "Price",
              dataIndex: "price",
              width: 120,
              render: (price) =>
                price
                  ? `₱${new Intl.NumberFormat("en").format(Number(price))}`
                  : "-",
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 100,
              render: (status) => (
                <Tag color={status === 0 ? "success" : "default"}>
                  {status === 0 ? "Active" : "Inactive"}
                </Tag>
              ),
            },
            {
              title: "Actions",
              key: "action",
              fixed: "right",
              width: 100,
              render: (_, record) => (
                <Space>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      const width = 800;
                      const height = 1100;
                      const left = 300;
                      const top = (window.screen.height - height) / 2;

                      window.open(
                        `/units/detail/${record.id}`,
                        "UnitDetail",
                        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=no,scrollbars=no`
                      );
                    }}
                  >
                    View
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{
            pageSize: 10,
            size: "small",
          }}
          scroll={{ x: "100%", y: "calc(100vh - 500px)" }}
        />
      ),
    },
    {
      key: "favorites",
      label: "Favorites",
      children: (
        <Table
          dataSource={user.favorites}
          columns={[
            {
              title: "Unit ID",
              dataIndex: ["unit", "id"],
              width: 80,
            },
            {
              title: "Title",
              dataIndex: ["unit", "title"],
              ellipsis: true,
            },
            {
              title: "Added Date",
              dataIndex: "createdAt",
              width: 250,
              render: (date) => formatDate(date),
            },
          ]}
          pagination={{
            pageSize: 10,
            size: "small",
          }}
          scroll={{ x: "100%", y: "calc(100vh - 500px)" }}
        />
      ),
    },
    {
      key: "loginHistory",
      label: "Login History",
      children: (
        <Table
          dataSource={loginLogs?.logs}
          loading={isLoadingLogs}
          columns={[
            {
              title: "Date",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => formatDate(date),
            },
            {
              title: "IP",
              dataIndex: "ip",
              width: 120,
            },
            {
              title: "Status",
              dataIndex: "attemptStatus",
              width: 100,
              render: (status) => (
                <Tag color={status === "success" ? "success" : "error"}>
                  {status}
                </Tag>
              ),
            },
          ]}
          pagination={{
            current: loginLogPage,
            pageSize: pageSize,
            total: loginLogs?.total || 0,
            onChange: setLoginLogPage,
          }}
          scroll={{ x: "100%", y: "calc(100vh - 500px)" }}
        />
      ),
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-white border-b">
        <Descriptions
          title="Basic Information"
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="small"
          extra={
            <Button type="primary" onClick={handleEditClick}>
              Edit User
            </Button>
          }
        >
          <Descriptions.Item label="Username">
            {user.username || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {user.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Name">{user.name || "-"}</Descriptions.Item>
          <Descriptions.Item label="Phone">
            {user.phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Level">
            <Tag color={USER_LEVEL_MAP[user.level as UserLevelType].color}>
              {USER_LEVEL_MAP[user.level as UserLevelType].text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={USER_STATUS_MAP[user.status as UserStatusType].color}>
              {USER_STATUS_MAP[user.status as UserStatusType].text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Company">
            {user.company || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="License">
            {user.license || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Facebook">
            {user.facebook || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Register Date">
            {formatDate(user.regdate)}
          </Descriptions.Item>
          <Descriptions.Item label="Last Update">
            {user.lastUpdate ? formatDate(user.lastUpdate) : "-"}
          </Descriptions.Item>
        </Descriptions>
      </div>
      <div className="bg-white p-4 border rounded text-black">
        <div className="font-medium mb-2">Memo</div>
        <div className="whitespace-pre-wrap min-h-[100px]">
          {user.memo || "-"}
        </div>
      </div>
      <div className="flex-1 bg-white pt-6 px-3">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          className="h-full"
          tabBarStyle={{ padding: "0 16px", marginBottom: 0 }}
        />
      </div>

      <Modal
        title="Edit User"
        open={isEditModalOpen}
        onOk={() => {
          updateMutation.mutate({
            id: userId,
            status: editStatus,
            level: editLevel,
            memo: editMemo,
          });
        }}
        onCancel={() => setIsEditModalOpen(false)}
        confirmLoading={updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2">Status</div>
            <Select
              value={editStatus}
              onChange={setEditStatus}
              style={{ width: "100%" }}
              options={[
                { label: "Normal", value: -1 },
                { label: "Suspended", value: 0 },
                { label: "Withdrawn", value: 1 },
              ]}
            />
          </div>
          <div>
            <div className="mb-2">Level</div>
            <Select
              value={editLevel}
              onChange={setEditLevel}
              style={{ width: "100%" }}
              options={[
                { label: "Admin", value: 0 },
                { label: "User", value: 1 },
                { label: "Agent", value: 2 },
                { label: "Broker", value: 3 },
                { label: "Owner", value: 4 },
                { label: "Agent + Presale", value: 20 },
                { label: "Broker + Presale", value: 30 },
                { label: "Owner + Presale", value: 40 },
              ]}
            />
          </div>
          <div>
            <div className="mb-2">Memo</div>
            <TextArea
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
              rows={4}
              placeholder="Enter memo..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
