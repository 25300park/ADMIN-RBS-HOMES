"use server";

import prisma from "@/lib/prisma";
import { DateFilter } from "@/types/dashboard";

function getDateRange(dateFilter: DateFilter) {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  switch (dateFilter) {
    case "today":
      return {
        gte: startOfDay,
        lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
      };
    case "week": {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      return {
        gte: startOfWeek,
        lt: new Date(),
      };
    }
    case "month": {
      const startOfMonth = new Date(now);
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      return {
        gte: startOfMonth,
        lt: new Date(),
      };
    }
    default:
      return {};
  }
}

export async function getVisitorStats(dateFilter: DateFilter) {
  try {
    const dateRange = getDateRange(dateFilter);

    const visitors = await prisma.siteVisitorLog.findMany({
      where: {
        visitStart: {
          ...(dateFilter !== "all" ? dateRange : {}),
        },
        visitEnd: {
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        sessionId: true,
        visitStart: true,
        visitEnd: true,
        isLoggedIn: true,
        ip: true,
        userAgent: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      distinct: ["sessionId"],
      orderBy: {
        visitStart: "desc",
      },
    });

    return {
      totalVisits: visitors.length,
      uniqueVisitors: new Set(visitors.map((v) => v.ip)).size,
      loggedInUsers: visitors.filter((v) => v.isLoggedIn).length,
      visitorTrend: visitors.reduce((acc, v) => {
        const date = new Date(v.visitStart).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      visitorLogs: visitors,
    };
  } catch (error) {
    console.error("Failed to fetch visitor stats:", error);
    throw new Error(
      "Failed to fetch visitor stats. Details: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
