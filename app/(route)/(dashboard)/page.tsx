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
import { Table, Skeleton } from "antd";
import {
  Users,
  Home,
  CalendarCheck,
  Eye,
  PieChart as PieChartIcon,
  Calendar,
  ArrowRight,
  TrendingUp
} from "lucide-react";
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

// KPI 전용 모던 위젯 컴포넌트
const KpiWidget = ({ title, value, subValue, icon: Icon, colorClass, bgClass, onClick }: any) => (
  <div 
    onClick={onClick}
    className="group flex flex-col p-6 space-y-4 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
  >
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <div className={`p-2 rounded-lg ${bgClass}`}>
        <Icon size={20} className={colorClass} />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-bold text-foreground">{value}</span>
      <span className={`text-xs mt-2 font-medium flex items-center gap-1 ${colorClass}`}>
        <TrendingUp size={12} /> {subValue}
      </span>
    </div>
  </div>
);

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

  const chartData = unitTypeDistribution.map((item) => ({ name: item.name, value: item.value }));
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#f97316", "#06b6d4"];

  // 테이블 컬럼 정의 (기존 내용에서 className 폰트 토큰 적용)
  const popularUnitsColumns = [
    { title: "Unit Title", dataIndex: "title", key: "title", render: (text: string) => <span className="font-semibold text-foreground">{text}</span> },
    { title: "Address", dataIndex: "fullAdress", key: "fullAdress", render: (text: string) => <span className="text-muted-foreground text-sm">{text}</span> },
    { title: "Price", dataIndex: "price", key: "price", render: (price: number) => <span className="font-semibold text-success">{price ? `₱ ${price.toLocaleString()}` : "N/A"}</span> },
    { title: "Favorites", dataIndex: "favoriteCount", key: "favoriteCount", render: (value: number) => <span className="font-semibold text-warning">{value}</span> },
  ];

  return (
    <div className="space-y-6"> {/* 엄격한 24px 리듬 적용 */}
      
      {/* 1. 페이지 헤더 및 기간 필터 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Track your property metrics and agent performance.</p>
        </div>
        
        {/* 모던한 필터 세그먼트 컨트롤 */}
        <div className="flex p-1 space-x-1 bg-secondary rounded-lg border border-border">
          {["today", "week", "month", "all"].map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter as DateFilter)}
              className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${
                dateFilter === filter 
                  ? "bg-white shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter === "all" ? "All Time" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* 2. KPI 위젯 그리드 (간격 24px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiWidget title="Total Users" value={stats.totalUsers || 0} subValue={`${stats.totalUsers || 0} New Users`} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50" onClick={() => router.push("/users")} />
        <KpiWidget title="Total Units" value={stats.totalUnits || 0} subValue={`${stats.totalUnits || 0} Units`} icon={Home} colorClass="text-green-600" bgClass="bg-green-50" onClick={() => router.push("/units")} />
        <KpiWidget title="Total Visitors" value={visitorStats.totalVisitors || 0} subValue={`${visitorStats.totalVisitors || 0} New Visitors`} icon={Eye} colorClass="text-purple-600" bgClass="bg-purple-50" onClick={() => router.push("/visitors")} />
        <KpiWidget title="Confirmed Schedules" value={stats.confirmedSchedules || 0} subValue="Confirmed this period" icon={CalendarCheck} colorClass="text-orange-600" bgClass="bg-orange-50" onClick={() => router.push("/schedules")} />
      </div>

      {/* 3. 차트 및 인기 매물 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-border rounded-xl shadow-sm p-6 flex flex-col h-[450px]">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Unit Type Distribution</h2>
          </div>
          {isLoading ? <Skeleton active /> : (
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2}>
                    {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="col-span-2 bg-white border border-border rounded-xl shadow-sm p-6 flex flex-col h-[450px]">
          <div className="flex items-center gap-2 mb-6">
            <Home size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Popular Units</h2>
          </div>
          <div className="overflow-auto custom-scrollbar">
            <Table dataSource={popularUnits} columns={popularUnitsColumns} pagination={false} rowKey="id" />
          </div>
        </div>
      </div>
    </div>
  );
}