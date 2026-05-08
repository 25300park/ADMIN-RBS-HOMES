// actions/dashboard-action.ts
"use server";

import prisma from "@/lib/prisma";
import type {
  DashboardStats,
  PopularUnit,
  TopAgent,
  UpcomingSchedule,
} from "@/types/dashboard";

import type { DateFilter, VisitorStats } from "@/types/dashboard";

function getDateRange(filter: DateFilter) {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  switch (filter) {
    case "today":
      return {
        gte: startOfDay,
        lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
      };
    case "week": {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return {
        gte: startOfWeek,
        lt: new Date(),
      };
    }
    case "month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        gte: startOfMonth,
        lt: new Date(),
      };
    }
    case "all":
    default:
      return {};
  }
}

// 데이터 호출 병렬 추가
export async function getAllDashboardData(dateFilter: DateFilter) {
  try {
    const [
      dashboardStats,
      unitTypeDistribution,
      popularUnits,
      topAgents,
      upcomingSchedules,
      visitorStats,
    ] = await Promise.all([
      getDashboardStats(dateFilter),
      getUnitTypeDistribution(),
      getPopularUnits(),
      getTopAgents(),
      getUpcomingSchedules(dateFilter),
      getVisitorStats(dateFilter),
    ]);

    return {
      stats: dashboardStats,
      unitTypeDistribution,
      popularUnits,
      topAgents,
      upcomingSchedules,
      visitorStats,
    };
  } catch (error) {
    console.error("Failed to fetch all dashboard data:", error);
    throw new Error(
      "Failed to fetch dashboard data: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

export async function getDashboardStats(dateFilter: DateFilter) {
  try {
    const dateRange = getDateRange(dateFilter);
    const now = new Date();
    const [
      totalUsers,
      newUsers,
      totalUnits,
      newUnits,
      upcomingSchedules,
      confirmedSchedules,
      todaySchedules,
    ] = await prisma.$transaction([
      // 전체 유저 수
      prisma.user.count({
        where: {
          status: -1,
          ...(dateFilter !== "all" ? { regdate: dateRange } : {}),
        },
      }),
      // 오늘 새로운 유저 수
      prisma.user.count({
        where: {
          status: -1,
          regdate: getDateRange("today"),
        },
      }),
      // 전체 유닛 수
      prisma.unit.count({
        where: {
          status: 0,
          ...(dateFilter !== "all" ? { regdate: dateRange } : {}),
        },
      }),
      // 오늘 새로운 유닛 수
      prisma.unit.count({
        where: {
          status: 0,
          regdate: getDateRange("today"),
        },
      }),
      // 예정된 스케줄 수
      prisma.schedule.count({
        where: {
          date: { gte: now },
          status: { in: [1, 2] },
        },
      }),
      // 확정된 스케줄 수
      prisma.schedule.count({
        where: {
          status: 2,
          ...(dateFilter !== "all" ? { date: dateRange } : {}),
        },
      }),
      // 오늘의 스케줄 수
      prisma.schedule.count({
        where: {
          date: getDateRange("today"),
          status: { in: [1, 2] },
        },
      }),
    ]);

    return {
      totalUsers,
      newUsersToday: newUsers,
      totalUnits,
      newUnitsToday: newUnits,
      upcomingSchedules,
      confirmedSchedules,
      todaySchedules,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error("Failed to fetch dashboard stats");
  }
}

export async function getUnitTypeDistribution() {
  try {
    const unitTypeCounts = await prisma.unit.groupBy({
      by: ["type"],
      _count: {
        type: true,
      },
      where: {
        status: 0,
      },
    });

    // 차트에 적합한 배열 형식으로 변환
    const chartData = unitTypeCounts.map(({ type, _count }) => ({
      name: type,
      value: _count.type,
    }));

    return chartData;
  } catch (error) {
    console.error("Failed to fetch unit type distribution:", error);
    throw new Error("Failed to fetch unit type distribution");
  }
}

export async function getPopularUnits() {
  try {
    const popularUnits = await prisma.unit.findMany({
      where: {
        status: 0, // 활성화된 유닛만
      },
      select: {
        id: true,
        title: true,
        fullAdress: true,
        price: true,
        favorites: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        favorites: {
          _count: "desc",
        },
      },
      take: 5, // 상위 5개 가져오기
    });

    // favorites 배열의 길이를 계산해 추가
    const formattedUnits = popularUnits.map((unit) => ({
      id: unit.id,
      title: unit.title,
      fullAdress: unit.fullAdress,
      price: unit.price ? Number(unit.price) : null,
      favoriteCount: unit.favorites.length,
    }));

    return formattedUnits;
  } catch (error) {
    console.error("Failed to fetch popular units:", error);
    throw error;
  }
}

export async function getTopAgents() {
  try {
    const agents = await prisma.user.findMany({
      where: {
        OR: [{ level: 2 }, { level: 3 }, { level: 4 }],
        status: -1,
      },
      select: {
        id: true,
        email: true,
        unit: {
          where: {
            status: 0,
          },
        },
      },
      orderBy: {
        unit: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const agentsWithDetails = await Promise.all(
      agents.map(async (agent) => {
        const confirmedSchedules = await prisma.schedule.count({
          where: {
            regId: agent.id,
            status: 2,
          },
        });

        return {
          id: agent.id,
          name: agent.email,
          unitsCount: agent.unit.length,
          activeUnitsCount: agent.unit.filter((u) => u.status === 0).length,
          confirmedSchedules,
        };
      })
    );

    return agentsWithDetails;
  } catch (error) {
    console.error("Failed to fetch top agents:", error);
    throw error;
  }
}

export async function getUpcomingSchedules(dateFilter: DateFilter) {
  try {
    const dateRange = getDateRange(dateFilter);
    const now = new Date();

    const schedules = await prisma.schedule.findMany({
      where: {
        ...(dateFilter === "all"
          ? {} // all인 경우 날짜 필터 제거
          : { date: dateRange }),
        status: {
          in: [1, 2],
        },
      },
      select: {
        id: true,
        unitId: true,
        title: true,
        date: true,
        startedAt: true,
        endedAt: true,
        username: true,
        email: true,
        mobile: true,
        status: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const schedulesWithUnit = await Promise.all(
      schedules.map(async (schedule) => {
        let unitInfo = null;

        if (schedule.unitId && schedule.unitId !== -1) {
          const unit = await prisma.unit.findUnique({
            where: { id: schedule.unitId },
            select: {
              title: true,
              type: true,
              sellType: true,
              fullAdress: true,
              admin: {
                select: {
                  name: true,
                  phone: true,
                  email: true,
                },
              },
            },
          });

          if (unit) {
            unitInfo = {
              title: unit.title,
              type: unit.type,
              sellType: unit.sellType,
              fullAdress: unit.fullAdress,
              agent: {
                name: unit.admin.name,
                phone: unit.admin.phone,
                email: unit.admin.email,
              },
            };
          }
        }

        return {
          ...schedule,
          date: schedule.date?.toISOString() || null,
          startedAt: schedule.startedAt?.toISOString() || null,
          endedAt: schedule.endedAt?.toISOString() || null,
          unit: unitInfo,
        };
      })
    );

    return schedulesWithUnit;
  } catch (error) {
    console.error("Failed to fetch upcoming schedules:", error);
    throw new Error("Failed to fetch upcoming schedules");
  }
}

// 방문자 카운터 통계 함수
export async function getVisitorStats(dateFilter: DateFilter) {
  try {
    const dateRange = getDateRange(dateFilter);

    // 스키마에 맞게 수정된 쿼리
    const visitors = await prisma.siteVisitorLog.findMany({
      where: {
        visitStart: {
          ...(dateFilter !== "all" ? dateRange : {}),
        },
        // 활성 세션만 카운트 (옵션)
        visitEnd: {
          not: null,
        },
      },
      select: {
        sessionId: true,
        visitStart: true,
        visitEnd: true,
        isLoggedIn: true,
      },
      distinct: ["sessionId"], // 중복 세션 제거
      orderBy: {
        visitStart: "desc",
      },
    });

    return {
      totalVisitors: visitors.length,
      // 추가 통계 (옵션)
      loggedInVisitors: visitors.filter((v) => v.isLoggedIn).length,
      // 디버깅용 상세 정보
      details: visitors,
    };
  } catch (error) {
    console.error("Failed to fetch visitor stats:", error);
    throw new Error(
      "Failed to fetch visitor stats. Details: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

// 유닛 타입별 통계
// export async function getUnitTypeStats() {
//   try {
//     const unitTypes = await prisma.unit.groupBy({
//       by: ["type"],
//       where: {
//         status: 0, // 활성화된 유닛만
//       },
//       _count: true,
//       orderBy: {
//         _count: {
//           type: "desc",
//         },
//       },
//     });
//     return unitTypes;
//   } catch (error) {
//     console.error("Failed to fetch unit type stats:", error);
//     throw new Error("Failed to fetch unit type stats");
//   }
// }

// // 판매 유형별 통계
// export async function getSellTypeStats() {
//   try {
//     const sellTypes = await prisma.unit.groupBy({
//       by: ["sellType"],
//       where: {
//         status: 0,
//       },
//       _count: true,
//       orderBy: {
//         _count: {
//           sellType: "desc",
//         },
//       },
//     });

//     return sellTypes;
//   } catch (error) {
//     console.error("Failed to fetch sell type stats:", error);
//     throw new Error("Failed to fetch sell type stats");
//   }
// }

// export async function getPopularUnits() {
//   try {
//     const units = await prisma.unit.findMany({
//       where: {
//         status: 0,
//       },
//       select: {
//         id: true,
//         title: true,
//         price: true,
//         admin: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//         favorites: {
//           select: {
//             id: true,
//           },
//         },
//       },
//       orderBy: {
//         favorites: {
//           _count: "desc",
//         },
//       },
//       take: 5,
//     });

//     const formattedUnits = units.map((unit) => ({
//       id: unit.id,
//       title: unit.title,
//       price: unit.price ? Number(unit.price) : null,
//       admin: {
//         id: unit.admin.id,
//         name: unit.admin.name,
//       },
//       favoriteCount: unit.favorites.length,
//     }));

//     console.log("Popular Units:", formattedUnits);
//     return formattedUnits;
//   } catch (error) {
//     console.error("Failed to fetch popular units:", error);
//     throw error;
//   }
// }

// export async function getUnits() {
//   try {
//     const units = await prisma.unit.findMany({
//       select: {
//         id: true,
//         title: true,
//         fullAdress: true,
//         price: true,
//       },
//       orderBy: {
//         id: "asc",
//       },
//       take: 10,
//     });

//     console.log("Fetched Units:", units); // 디버깅용
//     return units.map((unit) => ({
//       ...unit,
//       price: unit.price ? Number(unit.price) : null,
//     }));
//   } catch (error) {
//     console.error("Failed to fetch units:", error);
//     return [];
//   }
// }

// export async function getTopAgents(dateFilter: DateFilter) {
//   try {
//     const data: TopAgent[] = await prisma.$queryRaw`
//       SELECT
//         u.id,
//         u.name,
//         COUNT(ut.id) AS totalUnits,
//         COUNT(CASE WHEN ut.status = 4 THEN 1 END) AS closedUnits,
//         COUNT(l.id) AS loginLog
//       FROM User u
//       LEFT JOIN Unit ut ON u.id = ut.adminId
//       LEFT JOIN LoginLog l ON u.id = l.userId
//       WHERE u.level = 3
//       ${
//         dateFilter !== "all"
//           ? `AND u.regdate BETWEEN ${getDateRange(dateFilter).gte} AND ${
//               getDateRange(dateFilter).lt
//             }`
//           : ""
//       }
//       GROUP BY u.id
//       ORDER BY totalUnits DESC
//       LIMIT 5;
//     `;

//     return data;
//   } catch (error) {
//     console.error("Failed to fetch top agents data:", error);
//     throw new Error("Failed to fetch top agents data");
//   }
// }

//비밀번호 찾기 로그
// export async function getPasswordResetLogs(options?: {
//   email?: string;
//   startDate?: Date;
//   endDate?: Date;
//   limit?: number;
// }) {
//   const logs = await prisma.passwordResetLog.findMany({
//     where: {
//       email: options?.email,
//       createdAt: {
//         gte: options?.startDate,
//         lte: options?.endDate,
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//     take: options?.limit,
//   });

//   return logs;
// }
