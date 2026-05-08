"use server";

import prisma from "@/lib/prisma";
import type { SearchParams } from "@/types/table";

function getWhereClause(params: SearchParams): Record<string, any> {
  const { search, level, status, signupType, startDate, endDate } = params;

  // 배열 파라미터 처리
  const levels = Array.isArray(level)
    ? level.map(Number)
    : level
    ? [Number(level)]
    : [];
  const statuses = Array.isArray(status)
    ? status.map(Number)
    : status
    ? [Number(status)]
    : [];
  const signupTypes = Array.isArray(signupType)
    ? signupType
    : signupType
    ? [signupType]
    : [];

  // 날짜 필터 추가
  const dateFilter =
    startDate && endDate
      ? {
          regdate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }
      : {};

  const where: Record<string, any> = {
    AND: [
      search
        ? {
            OR: [
              { username: { contains: search } },
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {},
      levels.length > 0 ? { level: { in: levels } } : {},
      statuses.length > 0 ? { status: { in: statuses } } : {},
      signupTypes.length > 0
        ? {
            OR: [
              ...(signupTypes.includes("direct")
                ? [{ account: { none: {} } }]
                : []),
              signupTypes.some((type) => type !== "direct")
                ? {
                    account: {
                      some: {
                        provider: {
                          in: signupTypes.filter((type) => type !== "direct"),
                        },
                      },
                    },
                  }
                : {},
            ],
          }
        : {},
      dateFilter, // 날짜 필터 추가
    ],
  };

  return where;
}
export async function getUsers(params: SearchParams) {
  try {
    const { page = 1, limit = 10, sort = "id", order = "desc" } = params;
    const where = getWhereClause(params);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          level: true,
          phone: true,
          status: true,
          regdate: true,
          lastUpdate: true,
          account: {
            select: {
              provider: true,
              type: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sort]: order,
        },
      }),
    ]);
    // console.log(users) // 02/25 주석처리
    return {
      users: users.map((user) => ({
        ...user,
        regdate: user.regdate.toISOString(),
        lastUpdate: user.lastUpdate?.toISOString() || null,
        signupType:
          user.account.length > 0
            ? `${user.account[0].provider}`.toUpperCase()
            : "DIRECT",
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error(
      `Failed to fetch users: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getUserDetail(id: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            id: true,
            title: true,
            type: true,
            sellType: true,
            price: true,
            outstandingPayment: true,
            status: true,
            lastUpdate: true,
          },
          orderBy: {
            lastUpdate: "desc",
          },
        },
        favorites: {
          include: {
            unit: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      ...user,
      unit: user.unit.map((unit) => ({
        ...unit,
        price: unit.price ? Number(unit.price) : null,
        outstandingPayment: unit.outstandingPayment
          ? Number(unit.outstandingPayment)
          : null,
      })),
      regdate: user.regdate.toISOString(),
      lastUpdate: user.lastUpdate?.toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch user detail:", error);
    throw new Error(
      `Failed to fetch user detail: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
export interface LoginLogParams {
  userId: number;
  page: number;
  pageSize: number;
}

export async function getUserLoginLogs({
  userId,
  page,
  pageSize,
}: LoginLogParams) {
  try {
    const [total, logs] = await Promise.all([
      prisma.loginLog.count({
        where: { userId },
      }),
      prisma.loginLog.findMany({
        where: { userId },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
    };
  } catch (error) {
    console.error("Failed to fetch login logs:", error);
    throw new Error(
      `Failed to fetch login logs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

interface UpdateUserParams {
  id: number;
  status?: number;
  memo?: string;
  level?: number;
}

export async function updateUser({
  id,
  status,
  memo,
  level,
}: UpdateUserParams) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(memo !== undefined && { memo }),
        ...(level !== undefined && { level }),
        lastUpdate: new Date(),
      },
    });

    return {
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Failed to update user:", error);
    throw new Error(
      `Failed to update user: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
