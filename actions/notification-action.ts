'use server';

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

interface AlertCounts {
  scheduleAlert: number;
  complainUnitAlert: number;
  contactAlert: number;
}

/**
 * 알림 카운트 조회 (30초마다 호출)
 * - schedule 테이블에서 status = 0 (신청) 개수
 * - complainunit 테이블에서 status = 0 (문의접수) 개수
 * - contact 테이블에서 status = 0 (미처리) 개수
 */
export async function getAlertCounts(): Promise<{
  success: boolean;
  data?: AlertCounts;
  error?: string;
}> {
  try {
    const session: any = await getServerSession(authOptions as any);

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [scheduleCount, complainUnitCount, contactCount] = await Promise.all([
      prisma.schedule.count({
        where: { status: 0 }, // 0: 신청
      }),
      prisma.complainUnit.count({
        where: { status: 0 }, // 0: 문의접수
      }),
      prisma.contact.count({
        where: { status: 0 }, // 0: 미처리
      }),
    ]);

    const alertCounts: AlertCounts = {
      scheduleAlert: scheduleCount,
      complainUnitAlert: complainUnitCount,
      contactAlert: contactCount,
    };


    return { success: true, data: alertCounts };
  } catch (error) {
    console.error("Error fetching alert counts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}


export async function getAlertDetails(limit: number = 5): Promise<{
  success: boolean;
  data?: {
    schedules: any[];
    complainUnits: any[];
    contacts: any[];
  };
  error?: string;
}> {
  try {
    const session: any = await getServerSession(authOptions as any);

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [schedules, complainUnits, contacts] = await Promise.all([
      prisma.schedule.findMany({
        where: { status: 0 },
        select: {
          id: true,
          title: true,
          email: true,
          mobile: true,
          regdate: true,
        },
        orderBy: { regdate: "desc" },
        take: limit,
      }),
      prisma.complainUnit.findMany({
        where: { status: 0 },
        select: {
          id: true,
          message: true,
          unitId: true,
          userId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.contact.findMany({
        where: { status: 0 },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    return {
      success: true,
      data: {
        schedules,
        complainUnits,
        contacts,
      },
    };
  } catch (error) {
    console.error("Error fetching alert details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}