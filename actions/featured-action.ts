"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 모든 유닛 목록 조회 (featured 상태 포함)
export async function getAllUnits(
  page = 1,
  search = "",
  limit = 10,
  featuredOnly = false
) {
  const skip = (page - 1) * limit;

  // featuredOnly가 true일 때는 FeaturedUnit 테이블에서 unitId 목록을 먼저 가져옴
  let unitIds: number[] = [];
  if (featuredOnly) {
    const featuredUnits = await prisma.featuredUnit.findMany({
      select: { unitId: true },
    });
    unitIds = featuredUnits.map((fu) => fu.unitId);
  }

  const where = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search } },
              { address2: { contains: search } },
              { address3: { contains: search } },
            ],
          }
        : {},
      featuredOnly
        ? {
            id: { in: unitIds }, // featuredUnit 대신 id로 필터링
          }
        : {},
    ],
  };

  const result = await prisma.$transaction(async (tx) => {
    const [units, total] = await Promise.all([
      tx.unit.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          images: true,
          area: true,
          address1: true,
          address2: true,
          address3: true,
        },
        skip,
        take: limit,
        orderBy: [{ id: "desc" }],
      }),
      tx.unit.count({ where }),
    ]);

    // FeaturedUnit 데이터를 별도로 조회
    const featuredUnits = await tx.featuredUnit.findMany({
      where: {
        unitId: {
          in: units.map((u) => u.id),
        },
      },
    });

    // 데이터 조합 및 price를 Number로 변환
    const unitsWithFeatured = units.map((unit) => ({
      ...unit,
      price: unit.price ? Number(unit.price) : null, // Decimal을 Number로 변환 << 직렬화 문제
      featuredUnit: featuredUnits.find((f) => f.unitId === unit.id) || null,
    }));

    return { units: unitsWithFeatured, total };
  });

  return result;
}

// featured 설정
export async function setFeatured(unitId: number, label: string) {
  const lastUnit = await prisma.featuredUnit.findFirst({
    orderBy: { order: "desc" },
  });

  await prisma.featuredUnit.create({
    data: {
      unitId,
      label,
      order: (lastUnit?.order ?? 0) + 1,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/featured");
}

// featured 해제
export async function removeFeatured(unitId: number) {
  const featuredUnit = await prisma.featuredUnit.findFirst({
    where: {
      unitId: unitId,
    },
  });

  if (!featuredUnit) {
    return;
  }

  await prisma.featuredUnit.delete({
    where: {
      unitId: unitId,
    },
  });

  revalidatePath("/featured");
}
