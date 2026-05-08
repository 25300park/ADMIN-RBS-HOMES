// actions/schedule-action.ts

"use server";

import prisma from "@/lib/prisma";
import type { SearchParams } from "@/types/table";
import { SCHEDULE_STATUS } from "@/utils/constants/schedule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
function getWhereClause(params: SearchParams): Record<string, any> {
  const { search, status } = params;

  const statuses = Array.isArray(status) ? status.map(Number) : status ? [Number(status)] : [];

  const where: Record<string, any> = {
    AND: [
      search
        ? {
            OR: [
              { username: { contains: search } },
              { email: { contains: search } },
              { mobile: { contains: search } },
              { title: { contains: search } },
            ],
          }
        : {},
      statuses.length > 0 ? { status: { in: statuses } } : {},
    ],
  };

  return where;
}

export async function getSchedules(params: SearchParams) {
  try {
    const { page = 1, limit = 10, sort = "id", order = "desc" } = params;
    const where = getWhereClause(params);

    const [total, schedules] = await Promise.all([
      prisma.schedule.count({ where }),
      prisma.schedule.findMany({
        where,
        orderBy: {
          [sort]: order,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      schedules: schedules.map((schedule) => ({
        ...schedule,
        regdate: schedule.regdate.toISOString(),
        lastUpdate: schedule.lastUpdate.toISOString(),
        requestDate: schedule.requestDate?.toISOString() || null,
        date: schedule.date?.toISOString() || null,
        startedAt: schedule.startedAt?.toISOString() || null,
        endedAt: schedule.endedAt?.toISOString() || null,
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    throw new Error(
      `Failed to fetch schedules: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}



export async function updateScheduleStatus({ 
  id, 
  status, 
  date,
  title,
  desc
}: { 
  id: number; 
  status: number;
  date?: Date;
  title?: string;
  desc?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // date에서 날짜와 시간 분리
    let meetingDate: Date | undefined;
    let startTime: Date | undefined;

    if (date) {
      const adjustedDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      
      // 날짜만 추출 (시간은 00:00:00으로 설정)
      meetingDate = new Date(
        adjustedDate.getFullYear(),
        adjustedDate.getMonth(),
        adjustedDate.getDate()
      );

      // 시간만 저장
      startTime = adjustedDate;
    }

    await prisma.schedule.update({
      where: { id },
      data: {
        status,
        lastUpdate: new Date(),
        ...(status === SCHEDULE_STATUS.CONFIRMED && {
          date: meetingDate,
          startedAt: startTime,
          title,
          desc,
          regId: Number(session.user.id),
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update schedule status:", error);
    throw new Error(
      `Failed to update schedule status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}