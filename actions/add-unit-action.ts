"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

interface RegisterUnitData {
  // ID for edit mode
  id?: number;

  // Sale Type
  saleType: string;

  title: string;
  unitType: string;
  fullAddress: string;
  address1: string;
  address2: string;
  address3: string;
  addressSelf: string;

  ownerName: string;
  area: string;
  floor: string;
  bed: string;
  bath: string;
  parking: string;
  furniture: string;
  interiored: string;
  petPolicy: string;
  amenity: string[];
  yearCompletion: string;
  outstandingPayment: string;
  price: string;
  note: string;

  // 위치 (공통)
  latitude: number;
  longitude: number;

  // 이미지 (공통)
  images: any[];

  // 프리세일 전용 - 여러 에디터 콘텐츠
  videos: any[];
  attachments: any[];
  editorContent: string;
  videoDescriptionContent: any; // 새로 추가
  carouselImagesContent: string; // 새로 추가

  // 설정 (공통)
  isPublished: boolean;
}

// 스테이터스 상수 정의
const UNIT_STATUS = {
  ONGOING: 0, // 진행중 (활성화된 매물/프로젝트)
  COMPLETED: 1, // 완료됨 (거래 완료)
  CONTRACTED: 2, // 계약됨
  UNDER_NEGOTIATION: 3, // 협상중
  SUSPENDED: 4, // 중단됨 (비활성화된 매물/프로젝트)
} as const;

export async function registerUnit(data: RegisterUnitData) {
  try {
    const session: any = await getServerSession(authOptions as any);

    // 유저가 로그인되어 있지 않은 경우
    if (!session || !session.user) {
      return {
        success: false,
        message: "Authentication required. Please login to continue.",
      };
    }

    // 프리세일 권한 체크
    if (data.saleType === "presale") {
      const userLevel = session.user.level as number;
      const hasPreSalePermission = [0, 20, 30, 40].includes(userLevel);

      if (!hasPreSalePermission) {
        return {
          success: false,
          message:
            "You don't have permission to register a pre-sale property. Please contact the administrator.",
          permissionDenied: true,
        };
      }
    }

    const isEditMode = Boolean(data.id);

    if (isEditMode) {
      const existingUnit = await prisma.unit.findUnique({
        where: { id: data.id },
        select: { id: true },
      });

      if (!existingUnit) {
        return {
          success: false,
          message: "Property not found.",
        };
      }
    }

    const status = data.isPublished
      ? UNIT_STATUS.ONGOING
      : UNIT_STATUS.SUSPENDED;

    // 기본 데이터 구조
    let transformedData: any = {
      sellType: data.saleType,
      fullAdress: data.fullAddress,
      address1: data.address1 ? parseInt(data.address1) : null,
      address2: data.address2 || null,
      address3: data.address3 || null,
      address4: null,
      addressSelf: data.addressSelf || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      images: data.images ? JSON.stringify(data.images) : null,
      mapinfo: null,
      status: status,
      lastUpdate: new Date(),
      ownerMobile: null,
      ownerEmail: null,
      requested: null,
      viewCount: isEditMode ? undefined : 0,
    };

    if (!isEditMode) {
      transformedData.adminId = Number(session.user.id);
      transformedData.regdate = new Date();
    }

    if (data.saleType === "presale") {
      transformedData = {
        ...transformedData,
        title: data.title,
        type: "project",

        // 프리세일 전용 필드들 - 3개 에디터 모두 포함
        editorContent: data.editorContent || null,
        videoDescriptionContent: data.videoDescriptionContent || null,
        carouselImagesContent: data.carouselImagesContent || null,
        videos:
          data.videos && data.videos.length > 0
            ? JSON.stringify(data.videos)
            : null,
        attachments:
          data.attachments && data.attachments.length > 0
            ? JSON.stringify(data.attachments)
            : null,

        ownerName: "Developer", // 기본값
        area: data.area ? parseInt(data.area) : 0, 
        floor: data.floor ? parseInt(data.floor) : null,
        bed: data.bed ? parseInt(data.bed) : null,
        bath: data.bath ? parseInt(data.bath) : null,
        parking: data.parking ? parseInt(data.parking) : null,
        furniture: data.furniture || null,
        interiored: data.interiored || null,
        petPolicy: data.petPolicy || null,
        amenity:
          data.amenity && data.amenity.length > 0
            ? JSON.stringify(data.amenity)
            : null,
        yearCompletion: data.yearCompletion || null,
        outstandingPayment: 0,
        price: data.price ? parseFloat(data.price.replace(/,/g, "")) : 0,
        note: null, // 프리세일은 editorContent 사용
      };
    } else {
      // 일반 매물인 경우
      transformedData = {
        ...transformedData,
        // 일반 매물 필드들
        title: data.title,
        type: data.unitType,
        ownerName: data.ownerName || "Owner",
        area: data.area ? parseInt(data.area) : 0,
        floor: data.floor ? parseInt(data.floor) : null,
        bed: data.bed ? parseInt(data.bed) : null,
        bath: data.bath ? parseInt(data.bath) : null,
        parking: data.parking ? parseInt(data.parking) : null,
        furniture: data.furniture || null,
        interiored: data.interiored || null,
        petPolicy: data.petPolicy || null,
        amenity:
          data.amenity && data.amenity.length > 0
            ? JSON.stringify(data.amenity)
            : null,
        yearCompletion: data.yearCompletion || null,
        outstandingPayment: data.outstandingPayment
          ? parseFloat(data.outstandingPayment.replace(/,/g, ""))
          : 0,
        price: data.price ? parseFloat(data.price.replace(/,/g, "")) : 0,
        note: data.note || null,

        // 프리세일 필드들은 null로 설정
        editorContent: null,
        videoDescriptionContent: null, // 새로 추가
        carouselImagesContent: null, // 새로 추가
        videos: null,
        attachments: null,
      };
    }

    let result;

    if (isEditMode) {
      // 수정 모드
      result = await prisma.unit.update({
        where: { id: data.id },
        data: transformedData,
      });
    } else {
      // 생성 모드
      result = await prisma.unit.create({
        data: transformedData,
      });
    }

    // 캐시 무효화
    revalidatePath("/units");
    revalidatePath("/admin/units");

    const actionText = isEditMode ? "update" : "registration";
    const successMessage =
      data.saleType === "presale"
        ? `Pre-sale project ${actionText} successful!`
        : `Property ${actionText} successful!`;

    return {
      success: true,
      message: successMessage,
      unitId: result.id,
    };
  } catch (error) {
    console.error("Error processing unit:", error);

    // 에러 타입에 따른 구체적인 메시지
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          message:
            "A property with similar details already exists. Please check your data.",
        };
      }
      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          message: "Invalid user reference. Please try logging in again.",
        };
      }
    }

    const actionText = data.id ? "update" : "registration";
    return {
      success: false,
      message: `${
        actionText.charAt(0).toUpperCase() + actionText.slice(1)
      } failed. Please try again or contact support.`,
      error: process.env.NODE_ENV === "development" ? error : undefined,
    };
  }
}

// 유닛 상세 정보 가져오기 (수정용)
export async function getUnitForEdit(unitId: number) {
  try {
    const session: any = await getServerSession(authOptions as any);

    if (!session || !session.user) {
      return null;
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        title: true,
        sellType: true,
        type: true,
        fullAdress: true,
        address1: true,
        address2: true,
        address3: true,
        addressSelf: true,
        latitude: true,
        longitude: true,
        images: true,
        videos: true,
        attachments: true,
        editorContent: true,
        videoDescriptionContent: true,
        carouselImagesContent: true,
        ownerName: true,
        area: true,
        floor: true,
        bed: true,
        bath: true,
        parking: true,
        furniture: true,
        interiored: true,
        petPolicy: true,
        amenity: true,
        yearCompletion: true,
        outstandingPayment: true,
        price: true,
        note: true,
        status: true,
      },
    });

    if (!unit) {
      return null;
    }

    return unit;
  } catch (error) {
    console.error("Failed to fetch unit for edit:", error);
    return null;
  }
}

// 기존 updateUnit 함수는 제거하고 registerUnit으로 통합
// (위에서 id 기반으로 생성/수정을 구분하므로)

// 유틸리티: 스테이터스 변경 액션
export async function updateUnitStatus(unitId: number, status: number) {
  try {
    const session: any = await getServerSession(authOptions as any);

    if (!session || !session.user) {
      return {
        success: false,
        message: "Authentication required.",
      };
    }

    // 관리자 권한 체크
    const userLevel = session.user.level as number;
    const isAdmin = [0, 20].includes(userLevel);

    if (!isAdmin) {
      return {
        success: false,
        message: "You don't have permission to change property status.",
      };
    }

    await prisma.unit.update({
      where: { id: unitId },
      data: {
        status: status,
        lastUpdate: new Date(),
      },
    });

    revalidatePath("/admin/units");

    return {
      success: true,
      message: "Status updated successfully!",
    };
  } catch (error) {
    console.error("Error updating unit status:", error);
    return {
      success: false,
      message: "Status update failed.",
    };
  }
}
