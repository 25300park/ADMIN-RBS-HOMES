"use server";

import { requireAdminSession } from "@/lib/server-auth";

import prisma from "@/lib/prisma";
import type { SearchParams } from "@/types/table";

/**
 * [02-26] 직렬화 문제 해결을 위한 수정
 * 1. SerializedUnit 인터페이스 추가
 * 2. Decimal, Date, JSON 타입의 직렬화 처리
 * 3. 모든 Unit 관련 함수의 반환값 직렬화
 */

// [신규 추가] Unit 데이터 직렬화를 위한 인터페이스
interface SerializedUnit {
  id: number;
  adminId: number;
  title: string;
  type: string;
  sellType: string;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  addressSelf: string | null;
  ownerName: string;
  ownerMobile: string | null;
  ownerEmail: string | null;
  area: number;
  floor: number | null;
  bed: number | null;
  bath: number | null;
  parking: number | null;
  furniture: string | null;
  interiored: string | null;
  petPolicy: string | null;
  amenity: any;
  yearCompletion: string | null;
  outstandingPayment: number | null;
  price: number | null;
  note: string | null;
  requested: string | null;
  images: string | null;
  mapinfo: string | null;
  status: number;
  lastUpdate: string;
  regdate: string;
  latitude: number | null;
  longitude: number | null;
  fullAdress: string | null;
  viewCount: number;
  agentId: number | null;
  agent: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
  admin: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

function getWhereClause(params: SearchParams): Record<string, any> {
  const { search, type, sellType, status, startDate, endDate, agentId } = params;

  const statuses = Array.isArray(status)
    ? status.map(Number)
    : status
    ? [Number(status)]
    : [];
  const sellTypes = Array.isArray(sellType)
    ? sellType.map(String)
    : sellType
    ? [String(sellType)]
    : [];

  // 날짜 필터 수정
  const dateFilter =
    startDate && endDate
      ? {
          lastUpdate: {
            gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          },
        }
      : {};

  // 02/25 주석처리
  // console.log("Date Filter:", {
  //   startDate,
  //   endDate,
  //   filter: dateFilter,
  //   actualStartDate: dateFilter.lastUpdate?.gte,
  //   actualEndDate: dateFilter.lastUpdate?.lte,
  // });

  const where: Record<string, any> = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search } },
              { fullAdress: { contains: search } },
              { ownerName: { contains: search } },
            ],
          }
        : {},
      type ? { type: type } : {},
      sellTypes.length > 0 ? { sellType: { in: sellTypes } } : {},
      statuses.length > 0 ? { status: { in: statuses } } : {},
      dateFilter,
      agentId === "unassigned"
        ? { agentId: null }
        : agentId !== undefined && agentId !== ""
        ? { agentId: Number(agentId) }
        : {},
    ].filter((condition) => Object.keys(condition).length > 0),
  };

  return where;
}

export async function getUnits(params: SearchParams) {
  await requireAdminSession()
  try {
    const {
      page = 1,
      limit = 10,
      sort = "id",
      order = "desc",
      startDate,
      endDate,
    } = params;
    const where = getWhereClause(params);
    const [total, units] = await Promise.all([
      prisma.unit.count({ where }),
      prisma.unit.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          sellType: true,
          fullAdress: true,
          area: true,
          bed: true,
          bath: true,
          price: true,
          status: true,
          regdate: true,
          lastUpdate: true,
          agentId: true,
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          admin: {
            select: {
              name: true,
              email: true,
              phone: true,
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
    // console.log(units) 02/25 주석처리
    return {
      units: units.map((unit) => ({
        ...unit,
        regdate: new Date(unit.regdate).toISOString(),
        lastUpdate: new Date(unit.lastUpdate).toISOString(),
        price: unit.price ? Number(unit.price) : null,
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Failed to fetch units:", error);
    throw new Error(
      `Failed to fetch units: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function updateUnitStatus({
  id,
  status,
}: {
  id: number;
  status: number;
}) {
  await requireAdminSession()
  try {
    await prisma.unit.update({
      where: { id },
      data: {
        status,
        lastUpdate: new Date(),
      },
    });

    return { success: true, message: "Unit status updated successfully" };
  } catch (error) {
    console.error("Failed to update unit status:", error);
    throw new Error(
      `Failed to update unit status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getUnitDetail(id: number): Promise<SerializedUnit> {
  await requireAdminSession()
  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    const serializedUnit: SerializedUnit = {
      ...unit,
      address1: unit.address1 !== null ? String(unit.address1) : null,
      price: unit.price ? Number(unit.price.toString()) : null,
      outstandingPayment: unit.outstandingPayment
        ? Number(unit.outstandingPayment.toString())
        : null,
      lastUpdate: unit.lastUpdate.toISOString(),
      regdate: unit.regdate.toISOString(),
      images:
        typeof unit.images === "string"
          ? unit.images
          : JSON.stringify(unit.images),
      amenity:
        unit.amenity === null || typeof unit.amenity === "string"
          ? unit.amenity
          : JSON.stringify(unit.amenity),
      agentId: unit.agentId,
      agent: unit.agent
        ? { id: unit.agent.id, name: unit.agent.name, email: unit.agent.email }
        : null,
      admin: {
        name: unit.admin.name,
        email: unit.admin.email,
        phone: unit.admin.phone,
      },
    };

    return serializedUnit;
  } catch (error) {
    console.error("Failed to fetch unit detail:", error);
    throw new Error(
      `Failed to fetch unit detail: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// [02-25 추가] 매물 정보 업데이트를 위한 인터페이스

interface UpdateUnitParams {
  id: number;
  status?: number;
  title?: string;
  type?: string;
  sellType?: string;
  price?: number;
  ownerName?: string;
  area?: number;
  floor?: number;
  bed?: number;
  bath?: number;
  parking?: number;
  amenity?: string;
}

export async function getAgentOptions() {
  await requireAdminSession()
  const agents = await prisma.user.findMany({
    where: { level: { in: [2, 3] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return agents;
}

// [02-25 추가] 매물 정보 업데이트 함수
export async function updateUnit({ id, ...data }: UpdateUnitParams) {
  await requireAdminSession()
  try {
    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        ...data,
        lastUpdate: new Date(),
      },
    });

    // 데이터 직렬화 추가 02-26 
    const serializedUnit = {
      ...updatedUnit,
      price: updatedUnit.price ? Number(updatedUnit.price.toString()) : null,
      outstandingPayment: updatedUnit.outstandingPayment
        ? Number(updatedUnit.outstandingPayment.toString())
        : null,
      lastUpdate: updatedUnit.lastUpdate.toISOString(),
      regdate: updatedUnit.regdate.toISOString(),
      images:
        typeof updatedUnit.images === "string"
          ? updatedUnit.images
          : JSON.stringify(updatedUnit.images),
    };

    return {
      success: true,
      message: "Unit updated successfully",
      unit: serializedUnit,
    };
  } catch (error) {
    console.error("Failed to update unit:", error);
    throw new Error(
      `Failed to update unit: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
