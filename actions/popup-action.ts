// actions/popup-actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 팝업 생성 데이터 타입
export interface CreatePopupData {
  title: string;
  content?: string;
  startDate?: Date;
  endDate?: Date;
  createdByUserId: number;
  useOverlay?: boolean;
  isActive?: boolean;
  priority?: number;
  targetAudience?: string;
  targetConditions?: any;
  buttonText?: string;
  buttonAction?: string;
  images?: string;
  popupType?: number;
  triggerType?: number;
  triggerValue?: string;
  showFrequency?: number;
}

// 팝업 조회 파라미터
export interface GetPopupsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  isActive?: boolean;
  popupType?: number;
}

// 팝업 생성
export async function createPopup(data: CreatePopupData) {
  try {
    const popup = await prisma.popup.create({
      data: {
        title: data.title,
        content: data.content || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        createdByUserId: data.createdByUserId,
        useOverlay: data.useOverlay ?? true,
        isActive: data.isActive ?? true,
        priority: data.priority ?? 10,
        targetAudience: data.targetAudience || "all",
        targetConditions: data.targetConditions || null,
        buttonText: data.buttonText || null,
        buttonAction: data.buttonAction || null,
        images: data.images || null,
        popupType: data.popupType ?? 0,
        triggerType: data.triggerType ?? 0,
        triggerValue: data.triggerValue || null,
        showFrequency: data.showFrequency ?? 0,
      },
    });

    revalidatePath('/popup');
    
    return {
      success: true,
      popup,
    };
  } catch (error) {
    console.error('Error creating popup:', error);
    return {
      success: false,
      error: 'Failed to create popup',
    };
  }
}

// 팝업 목록 조회
export async function getPopups({
  page = 1,
  limit = 10,
  sort = 'priority',
  order = 'asc',
  isActive,
  popupType,
}: GetPopupsParams = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (popupType !== undefined) {
      where.popupType = popupType;
    }

    const [popups, total] = await Promise.all([
      prisma.popup.findMany({
        where,
        orderBy: {
          [sort]: order,
        },
        skip,
        take: limit,
      }),
      prisma.popup.count({ where }),
    ]);

    return {
      success: true,
      popups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching popups:', error);
    return {
      success: false,
      popups: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0,
      error: 'Failed to fetch popups',
    };
  }
}

// 팝업 상세 조회
export async function getPopupById(id: number) {
  try {
    const popup = await prisma.popup.findUnique({
      where: { id },
    });

    return {
      success: true,
      popup,
    };
  } catch (error) {
    console.error('Error fetching popup:', error);
    return {
      success: false,
      popup: null,
      error: 'Failed to fetch popup',
    };
  }
}

// 팝업 수정
export async function updatePopup(id: number, data: Partial<CreatePopupData>) {
  try {
    const popup = await prisma.popup.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/popup');
    
    return {
      success: true,
      popup,
    };
  } catch (error) {
    console.error('Error updating popup:', error);
    return {
      success: false,
      error: 'Failed to update popup',
    };
  }
}

// 팝업 삭제
export async function deletePopup(id: number) {
  try {
    await prisma.popup.delete({
      where: { id },
    });

    revalidatePath('/popup');
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting popup:', error);
    return {
      success: false,
      error: 'Failed to delete popup',
    };
  }
}

// 팝업 활성화/비활성화 토글
export async function togglePopupStatus(id: number) {
  try {
    const currentPopup = await prisma.popup.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!currentPopup) {
      return {
        success: false,
        error: 'Popup not found',
      };
    }

    const popup = await prisma.popup.update({
      where: { id },
      data: {
        isActive: !currentPopup.isActive,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/popup');
    
    return {
      success: true,
      popup,
    };
  } catch (error) {
    console.error('Error toggling popup status:', error);
    return {
      success: false,
      error: 'Failed to toggle popup status',
    };
  }
}