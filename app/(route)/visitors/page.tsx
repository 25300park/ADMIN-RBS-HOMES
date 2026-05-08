"use client";

import { useState } from "react";
import { Card, Radio, Table, Row, Col, Statistic } from "antd";
import { useQuery } from "@tanstack/react-query";
import { DateFilter } from "@/types/dashboard";
import { getVisitorStats } from "@/actions/visitors-action"; // Server Action import
import { EyeOutlined, UserOutlined, LoginOutlined } from "@ant-design/icons";

const Visitors = () => {
  // 날짜 필터 상태 관리
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");

  // fetch 대신 Server Action 직접 호출
  const { data, isLoading } = useQuery({
    queryKey: ["visitorStats", dateFilter],
    queryFn: () => getVisitorStats(dateFilter),
  });

  // 테이블 컬럼 정의
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "Visit Time",
      dataIndex: "visitStart",
      key: "visitStart",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "End Time",
      dataIndex: "visitEnd",
      key: "visitEnd",
      render: (date: string) => (date ? new Date(date).toLocaleString() : "-"),
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
    },
    {
      title: "User",
      key: "user",
      render: (record: any) => record.User?.username || "Guest",
    },
    {
      title: "Logged-in",
      dataIndex: "isLoggedIn",
      key: "isLoggedIn",
      render: (isLoggedIn: boolean) => (isLoggedIn ? "Yes" : "No"),
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <Radio.Group
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        buttonStyle="solid"
        className="shadow-sm bg-white p-1 rounded-lg [&_.ant-radio-button-wrapper]:!mr-1 [&_.ant-radio-button-wrapper:last-child]:!mr-0 [&_.ant-radio-button-wrapper::before]:!hidden [&_.ant-radio-button-wrapper]:!border !border-b-0"
      >
        <Radio.Button value="today">Today</Radio.Button>
        <Radio.Button value="week">This Week</Radio.Button>
        <Radio.Button value="month">This Month</Radio.Button>
        <Radio.Button value="all">All Time</Radio.Button>
      </Radio.Group>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card loading={isLoading}>
            <Statistic title="Total Visitors" value={data?.totalVisits || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={isLoading}>
            <Statistic
              title="Unique Visitors"
              value={data?.uniqueVisitors || 0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={isLoading}>
            <Statistic
              title="Logged-in Users"
              value={data?.loggedInUsers || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* 방문자 로그 테이블 */}
      <Card title="Visitor Log">
        <Table
          columns={columns}
          dataSource={data?.visitorLogs || []}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default Visitors;
