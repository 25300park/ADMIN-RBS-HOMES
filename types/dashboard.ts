export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalUnits: number;
  newUnitsToday: number;
  upcomingSchedules: number;
  confirmedSchedules: number;
  todaySchedules: number;
}
export interface PopularUnit {
  id: number;
  title: string;
  price: number | null;
  admin: {
    name: string | null;
  };
  favoriteCount: number;
}

export interface VisitorStats {
  uniqueVisitors: number;
  totalPageViews: number;
  newVisitors: number;
  returningVisitors: number;
}

export type DateFilter = "today" | "week" | "month" | "all";

export interface UpcomingSchedule {
  id: number;
  unitId: number;
  title: string | null;
  date: string | null;
  startedAt: string | null;
  endedAt: string | null;
  username: string | null;
  email: string | null;
  mobile: string | null;
  status: number;
  unit: {
    title: string;
    type: string;
    sellType: string;
    fullAdress: string | null;
    agent: {
      name: string | null;
      phone: string | null;
      email: string | null;
    };
  } | null;
}

export type UnitTypeChart = {
  type: string;
  _count: {
    id: number;
  };
}[];

export type TopAgent = {
  id: number;
  name: string;
  totalUnits: {
    _count: number;
  };
  closedUnits: {
    _count: number;
  };
  loginLog: {
    _count: number;
  };
};
