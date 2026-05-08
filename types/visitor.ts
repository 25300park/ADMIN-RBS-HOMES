export interface VisitorResponse {
  totalVisits: number;
  uniqueVisitors: number;
  loggedInUsers: number;
  visitorTrend: {
    date: string;
    visits: number;
  }[];
  visitorLogs: {
    id: number;
    ip: string;
    visitStart: string;
    visitEnd: string | null;
    path: string | null;
    userAgent: string | null;
    isLoggedIn: boolean;
    User: {
      username: string | null;
    } | null;
  }[];
}
