"use server";

import prisma from "@/lib/prisma";
import type { SearchParams } from "@/types/table";

// 배너 데이터 직렬화를 위한 인터페이스
interface SerializedBanner {
  id: number;
  matchType: string;
  matchValue: string;
  priority: number;
  title: string | null;
  description: string | null;
  images: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
}

// 검색 조건 생성 함수
function getWhereClause(params: SearchParams): Record<string, any> {
  const { search, matchType, isActive } = params;
  
  // 배너 타입 필터 처리
  const matchTypes = Array.isArray(matchType)
    ? matchType.map(String)
    : matchType
    ? [String(matchType)]
    : [];
  
  // 활성 상태 필터
  const activeFilter = isActive !== undefined ? 
    { isActive: isActive === 'true' } : {};
  
  const where: Record<string, any> = {
    AND: [
      search
        ? {
            OR: [
              { matchValue: { contains: search } },
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {},
      matchTypes.length > 0 ? { matchType: { in: matchTypes } } : {},
      activeFilter,
    ].filter((condition) => Object.keys(condition).length > 0),
  };
  
  return where;
}

export async function getBanners(params: SearchParams) {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "priority",
      order = "asc",
    } = params;
    
    const where = getWhereClause(params);
    
    const [total, banners] = await Promise.all([
      prisma.areaBanner.count({ where }),
      prisma.areaBanner.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
          [sort]: order,
        },
      }),
    ]);
    
    // 직렬화 및 데이터 변환
    const serializedBanners: SerializedBanner[] = banners.map(banner => ({
      ...banner,
      createdAt: banner.createdAt.toISOString(),
      updatedAt: banner.updatedAt.toISOString(),
      images: typeof banner.images === 'string' 
        ? banner.images 
        : JSON.stringify(banner.images),
    }));
    
    return {
      banners: serializedBanners,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      hasMore: Number(page) * Number(limit) < total,
    };
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    throw new Error(
      `Failed to fetch banners: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// 단일 배너 조회 함수
export async function getBanner(id: number): Promise<SerializedBanner> {
  try {
    const banner = await prisma.areaBanner.findUnique({
      where: { id },
    });
    
    if (!banner) {
      throw new Error("Banner not found");
    }
    
    // 직렬화
    const serializedBanner: SerializedBanner = {
      ...banner,
      createdAt: banner.createdAt.toISOString(),
      updatedAt: banner.updatedAt.toISOString(),
      images: typeof banner.images === 'string' 
        ? banner.images 
        : JSON.stringify(banner.images),
    };
    
    return serializedBanner;
  } catch (error) {
    console.error("Failed to fetch banner:", error);
    throw new Error(
      `Failed to fetch banner: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// 배너 생성 함수
export async function createBanner(data: {
  matchType: string;
  matchValue: string;
  priority: number;
  title?: string;
  description?: string;
  images: string;
  isActive?: boolean;
  createdBy?: number;
  latitude?: number;  
  longitude?: number; 
  fullAddress?: string;
}) {
  try {
    const banner = await prisma.areaBanner.create({
      data: {
        matchType: data.matchType,
        matchValue: data.matchValue,
        priority: data.priority,
        title: data.title || null,
        description: data.description || null,
        images: data.images,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || null,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        fullAddress: data.fullAddress || null
      },
    });
    
    // 직렬화
    const serializedBanner: SerializedBanner = {
      ...banner,
      createdAt: banner.createdAt.toISOString(),
      updatedAt: banner.updatedAt.toISOString(),
      images: typeof banner.images === 'string' 
        ? banner.images 
        : JSON.stringify(banner.images),
    };
    
    return {
      success: true,
      message: "Banner created successfully",
      banner: serializedBanner,
    };
  } catch (error) {
    console.error("Failed to create banner:", error);
    throw new Error(
      `Failed to create banner: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// 배너 삭제 함수
export async function deleteBanner(id: number) {
  try {
    await prisma.areaBanner.delete({
      where: { id },
    });
    
    return {
      success: true,
      message: "Banner deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete banner:", error);
    throw new Error(
      `Failed to delete banner: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// 배너 업데이트 함수
export async function updateBanner({
  id,
  ...data
}: {
  id: number;
  matchType?: string;
  matchValue?: string;
  priority?: number;
  title?: string | null;
  description?: string | null;
  images?: string;
  isActive?: boolean;
}) {
  try {
    const updatedBanner = await prisma.areaBanner.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    
    // 직렬화
    const serializedBanner: SerializedBanner = {
      ...updatedBanner,
      createdAt: updatedBanner.createdAt.toISOString(),
      updatedAt: updatedBanner.updatedAt.toISOString(),
      images: typeof updatedBanner.images === 'string' 
        ? updatedBanner.images 
        : JSON.stringify(updatedBanner.images),
    };
    
    return {
      success: true,
      message: "Banner updated successfully",
      banner: serializedBanner,
    };
  } catch (error) {
    console.error("Failed to update banner:", error);
    throw new Error(
      `Failed to update banner: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}