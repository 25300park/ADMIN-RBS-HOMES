"use server";

import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import type { SearchParams } from "@/types/table";
import { authOptions } from "@/lib/auth-options";
import { ComplainStatusChangeProps } from "@/types/complain";

function getWhereClause(params: SearchParams): Record<string, any> {
  const { search, status, startDate, endDate } = params;

  const statuses = Array.isArray(status)
    ? status.map(Number)
    : status
    ? [Number(status)]
    : [];

  // 날짜 필터링
  const dateFilter =
    startDate && endDate
      ? {
          createdAt: {
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
              { message: { contains: search } },
              { user: { username: { contains: search } } },
              { user: { email: { contains: search } } },
            ],
          }
        : {},
      statuses.length > 0 ? { status: { in: statuses } } : {},
      dateFilter,
    ].filter((condition) => Object.keys(condition).length > 0),
  };

  return where;
}

export async function getComplains(params: SearchParams) {
  try {
    const { page = 1, limit = 10, sort = "id", order = "desc" } = params;
    const where = getWhereClause(params);

    const [total, complains] = await Promise.all([
      prisma.complainUnit.count({ where }),
      prisma.complainUnit.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              username: true,
              email: true,
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

    const enrichedComplains = await Promise.all(
      complains.map(async (complain) => {
        const writer = await prisma.user.findUnique({
          where: { id: complain.writerId },
          select: {
            id: true,
            username: true,
            email: true,
          },
        });

        const unit = await prisma.unit.findUnique({
          where: { id: complain.unitId },
          select: {
            id: true,
            title: true,
            fullAddress: true,
          },
        });

        return {
          ...complain,
          createdAt: complain.createdAt.toISOString(),
          updatedAt: complain.updatedAt.toISOString(),
          respondedAt: complain.respondedAt?.toISOString() || null,
          writer,
          unit,
        };
      })
    );

    return {
      complains: enrichedComplains,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Failed to fetch complains:", error);
    throw new Error(
      `Failed to fetch complains: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getComplainDetail(id: number) {
  try {
    const complain = await prisma.complainUnit.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!complain) {
      throw new Error("Complain not found");
    }

    // Get writer information separately
    const writer = await prisma.user.findUnique({
      where: { id: complain.writerId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
      },
    });

    // Get unit information separately
    const unit = await prisma.unit.findUnique({
      where: { id: complain.unitId },
      select: {
        id: true,
        title: true,
        fullAddress: true,
        type: true,
        sellType: true,
      },
    });

    if (!complain) {
      throw new Error("Complain not found");
    }

    return {
      ...complain,
      createdAt: complain.createdAt.toISOString(),
      updatedAt: complain.updatedAt.toISOString(),
      respondedAt: complain.respondedAt?.toISOString() || null,
      writer,
      unit,
    };
  } catch (error) {
    console.error("Failed to fetch complain detail:", error);
    throw new Error(
      `Failed to fetch complain detail: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function updateComplainStatus({
  id,
  status,
  response,
  responseType,
}: ComplainStatusChangeProps) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.complainUnit.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === 2 && {
          adminId: Number(session.user.id),
          response,
          responseType,
          respondedAt: new Date(),
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update complain status:", error);
    throw new Error(
      `Failed to update complain status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}