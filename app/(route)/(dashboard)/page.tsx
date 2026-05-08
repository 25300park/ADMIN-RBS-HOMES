"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getUnitTypeDistribution,
  getTopAgents,
  getPopularUnits,
  getUpcomingSchedules,
  getVisitorStats,
  getAllDashboardData,
} from "@/actions/dashboard-action";
import {
  Card,
  Row,
  Col,
  Statistic,
  Radio,
  Table,
  Skeleton,
  Button,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  PieChartOutlined,
  CalendarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as ChartTooltip,
} from "recharts";
import { DateFilter, DashboardStats } from "@/types/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboardData", dateFilter],
    queryFn: () => getAllDashboardData(dateFilter),
  });

  const {
    stats = {} as DashboardStats,
    unitTypeDistribution = [],
    popularUnits = [],
    topAgents = [],
    upcomingSchedules = [],
    visitorStats = { totalVisitors: 0 },
  } = data || {};

  const chartData = unitTypeDistribution.map((item) => ({
    name: item.name,
    value: item.value,
  }));

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

  const topAgentsColumns = [
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span className="font-medium text-gray-700">{text}</span>
      ),
    },
    {
      title: "Total Units",
      dataIndex: "unitsCount",
      key: "unitsCount",
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value}</span>
      ),
    },
    {
      title: "Active Units",
      dataIndex: "activeUnitsCount",
      key: "activeUnitsCount",
      render: (value: number) => (
        <span className="font-semibold text-green-600">{value}</span>
      ),
    },
    {
      title: "Confirmed Schedules",
      dataIndex: "confirmedSchedules",
      key: "confirmedSchedules",
      render: (value: number) => (
        <span className="font-semibold text-purple-600">{value}</span>
      ),
    },
  ];

  const popularUnitsColumns = [
    {
      title: "Unit Title",
      dataIndex: "title",
      key: "title",
      render: (text: string) => (
        <span className="font-medium text-gray-700">{text}</span>
      ),
    },
    {
      title: "Address",
      dataIndex: "fullAdress",
      key: "fullAdress",
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <span className="font-semibold text-green-600">
          {price ? `₱ ${price.toLocaleString()}` : "N/A"}
        </span>
      ),
    },
    {
      title: "Favorites",
      dataIndex: "favoriteCount",
      key: "favoriteCount",
      render: (value: number) => (
        <span className="font-semibold text-orange-500">{value}</span>
      ),
    },
  ];

  const upcomingSchedulesColumns = [
    {
      title: "Schedule",
      dataIndex: "title",
      key: "title",
      render: (text: string) => (
        <span className="font-medium text-gray-700">{text}</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => (
        <span>{new Date(date).toLocaleDateString()}</span>
      ),
    },
    {
      title: "Time",
      key: "time",
      render: (text: string, record: any) => (
        <span>
          {new Date(record.startedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true, // AM/PM 표기
          })}{" "}
          -
          {new Date(record.endedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </span>
      ),
    },

    {
      title: "Customer",
      key: "customer",
      render: (text: string, record: any) => (
        <div>
          <div>{record.username}</div>
          <div className="text-xs text-gray-500">{record.mobile}</div>
        </div>
      ),
    },
    {
      title: "Property",
      dataIndex: ["unit", "title"],
      key: "unit",
      render: (text: string, record: any) => (
        <div>
          <div>{record.unit?.title || "No property information"}</div>
          <div className="text-xs text-gray-500">{record.unit?.fullAdress}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: number) => (
        <span
          className={`px-2 py-1 rounded-full text-sm ${
            status === 2
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {status === 2 ? "Confirmed" : "Pending"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 기간 필터 */}
      <div className="flex justify-between items-center mb-6">
        {/* 기간 필터 - Radio.Group 스타일 오버라이드 02/25 추가 */}
        <Radio.Group
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          buttonStyle="solid"
          className="shadow-sm bg-white p-1 rounded-lg [&_.ant-radio-button-wrapper]:!mr-1 [&_.ant-radio-button-wrapper:last-child]:!mr-0 [&_.ant-radio-button-wrapper::before]:!hidden [&_.ant-radio-button-wrapper]:!border !border-b-0"
        >
          <Radio.Button
            value="today"
            className="rounded-md hover:bg-blue-50 transition-colors"
          >
            Today
          </Radio.Button>
          <Radio.Button
            value="week"
            className="rounded-md hover:bg-blue-50 transition-colors"
          >
            This Week
          </Radio.Button>
          <Radio.Button
            value="month"
            className="rounded-md hover:bg-blue-50 transition-colors"
          >
            This Month
          </Radio.Button>
          <Radio.Button
            value="all"
            className="rounded-md hover:bg-blue-50 transition-colors"
          >
            All Time
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* 상단 KPI 카드 */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <Row gutter={[16, 16]}>
          {/* Total Users Card */}
          <Col span={6}>
            <Card
              bordered={false}
              className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl cursor-pointer"
              onClick={() => router.push("/users")}
              loading={isLoading}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Statistic
                    title={
                      <span className="text-gray-600 font-medium">
                        Total Users
                      </span>
                    }
                    value={stats.totalUsers || 0}
                    prefix={<UserOutlined className="text-blue-500 text-xl" />}
                    valueStyle={{
                      color: "#1890ff",
                      fontSize: "24px",
                      fontWeight: "600",
                    }}
                  />
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <span className="text-sm text-blue-600">
                    +{stats.totalUsers || 0} New Users
                  </span>
                </div>
              </div>
            </Card>
          </Col>

          {/* Total Units Card */}
          <Col span={6}>
            <Card
              bordered={false}
              className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl cursor-pointer"
              onClick={() => router.push("/units")}
              loading={isLoading}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Statistic
                    title={
                      <span className="text-gray-600 font-medium">
                        Total Units
                      </span>
                    }
                    value={stats.totalUnits || 0}
                    prefix={<HomeOutlined className="text-green-500 text-xl" />}
                    valueStyle={{
                      color: "#52c41a",
                      fontSize: "24px",
                      fontWeight: "600",
                    }}
                  />
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <span className="text-sm text-green-600">
                    +{stats.totalUnits || 0} Units
                  </span>
                </div>
              </div>
            </Card>
          </Col>

          {/* Total Visitors Card */}
          <Col span={6}>
            <Card
              bordered={false}
              className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl cursor-pointer"
              onClick={() => router.push("/visitors")}
              loading={isLoading}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Statistic
                    title={
                      <span className="text-gray-600 font-medium">
                        Total Visitors
                      </span>
                    }
                    value={visitorStats.totalVisitors || 0} // 총 방문자 수 표시
                    prefix={<EyeOutlined className="text-purple-500 text-xl" />}
                    valueStyle={{
                      color: "#722ed1",
                      fontSize: "24px",
                      fontWeight: "600",
                    }}
                  />
                </div>
                <div className="bg-purple-50 p-2 rounded-lg">
                  <span className="text-sm text-purple-600">
                    +{visitorStats.totalVisitors || 0} New Visitors
                  </span>
                </div>
              </div>
            </Card>
          </Col>

          {/* Confirmed Schedules Card */}
          <Col span={6}>
            <Card
              bordered={false}
              className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl cursor-pointer"
              onClick={() => router.push("/schedules")}
              loading={isLoading}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Statistic
                    title={
                      <span className="text-gray-600 font-medium">
                        Confirmed Schedules
                      </span>
                    }
                    value={stats.confirmedSchedules || 0}
                    prefix={
                      <CheckCircleOutlined className="text-orange-500 text-xl" />
                    }
                    valueStyle={{
                      color: "#faad14",
                      fontSize: "24px",
                      fontWeight: "600",
                    }}
                  />
                </div>
                <div className="bg-orange-50 p-2 rounded-lg">
                  <span className="text-sm text-orange-600">
                    Confirmed this period
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 중단 섹션 */}
      <Row gutter={[16, 16]} className="mt-6">
        {/* 좌측: 유닛 타입 분포 */}
        <Col xs={24} sm={8}>
          <Card
            title={
              <div className="flex items-center space-x-2">
                <PieChartOutlined className="text-blue-500" />
                <span className="font-semibold text-gray-700">
                  Unit Type Distribution
                </span>
              </div>
            }
            className="rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
            style={{ height: 500 }}
          >
            {isLoading ? (
              <div className="p-4">
                <Skeleton active />
              </div>
            ) : (
              <div style={{ width: "100%", height: "400px" }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* 우측: 인기 유닛 */}
        <Col xs={24} sm={16}>
          <Card
            title={
              <div className="flex items-center space-x-2">
                <HomeOutlined className="text-blue-500" />
                <span className="font-semibold text-gray-700">
                  Popular Units
                </span>
              </div>
            }
            className="rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
            style={{ height: 500 }}
          >
            <Table
              dataSource={popularUnits}
              columns={popularUnitsColumns}
              pagination={false}
              rowKey="id"
              scroll={{ y: 350 }}
              className="overflow-hidden"
              onRow={(record) => ({
                className: "hover:bg-gray-50 transition-colors duration-200",
              })}
            />
          </Card>
        </Col>
      </Row>

      {/* 다가오는 일정 섹션 */}
      <Card
        title={
          <div className="flex items-center space-x-2">
            <CalendarOutlined className="text-blue-500" />
            <span className="font-semibold text-gray-700">
              Upcoming Schedules
            </span>
          </div>
        }
        className="mt-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
        extra={
          <Button type="link" onClick={() => router.push("/schedules")}>
            View All
          </Button>
        }
      >
        <Table
          dataSource={upcomingSchedules}
          columns={upcomingSchedulesColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          loading={isLoading}
          className="overflow-hidden"
          onRow={(record) => ({
            className: "hover:bg-gray-50 transition-colors duration-200",
            onClick: () => router.push(`/schedules/`),
          })}
        />
      </Card>

      {/* 하단 에이전트 테이블 */}
      <Card
        title={
          <div className="flex items-center space-x-2">
            <UserOutlined className="text-blue-500" />
            <span className="font-semibold text-gray-700">Top Agents</span>
          </div>
        }
        className="mt-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
      >
        <Table
          dataSource={topAgents}
          columns={topAgentsColumns}
          rowKey="id"
          pagination={false}
          className="overflow-hidden"
          onRow={(record) => ({
            className: "hover:bg-gray-50 transition-colors duration-200",
          })}
        />
      </Card>
    </div>
  );
}
