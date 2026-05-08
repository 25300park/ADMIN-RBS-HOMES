// utils/constants/unit.ts


export const UNIT_STATUS = {
  ACTIVE: 0,       // 정상 (활성)
  COMPLETED: 1,    // 거래 완료
  HIDDEN: 2,       // 숨김
  NEGOTIATION: 3,  // 거래 중 (협상 중)
  SUSPENDED: 4,  // 점검 중 
  DELETED: 5,      // 삭제됨
} as const;

export type UnitStatusType = (typeof UNIT_STATUS)[keyof typeof UNIT_STATUS];

type UnitStatusMapType = {
  [K in UnitStatusType]: {
    text: string;
    color: string;
  };
};

// 유닛 상태 정보 매핑
export const UNIT_STATUS_MAP: UnitStatusMapType = {
  [UNIT_STATUS.ACTIVE]: { text: "Active", color: "success" },
  [UNIT_STATUS.COMPLETED]: { text: "Completed", color: "blue" },
  [UNIT_STATUS.HIDDEN]: { text: "Hidden", color: "default" },
  [UNIT_STATUS.NEGOTIATION]: { text: "Under Negotiation", color: "processing" },
  [UNIT_STATUS.SUSPENDED]: { text: "SUSPENDED", color: "orange" },
  [UNIT_STATUS.DELETED]: { text: "Deleted", color: "error" },
};

// 유닛 상태 선택 옵션 (Select 컴포넌트용)
export const UNIT_STATUS_OPTIONS = [
  { label: "Active", value: UNIT_STATUS.ACTIVE },
  { label: "Under Negotiation", value: UNIT_STATUS.NEGOTIATION },
  { label: "Completed", value: UNIT_STATUS.COMPLETED },
  { label: "Hidden", value: UNIT_STATUS.HIDDEN },
  { label: "Suspended", value: UNIT_STATUS.SUSPENDED },
  { label: "Deleted", value: UNIT_STATUS.DELETED },
];

// 필터링용 상태 그룹 - 사용자 UI에서 활용
export const UNIT_STATUS_GROUPS = {
  AVAILABLE: [UNIT_STATUS.ACTIVE, UNIT_STATUS.NEGOTIATION], // 사용자에게 보여줄 활성 상태 (정상 + 거래 중)
  INCLUDE_COMPLETED: [UNIT_STATUS.ACTIVE, UNIT_STATUS.NEGOTIATION, UNIT_STATUS.COMPLETED], // 완료된 매물 포함
  COMPLETED_ONLY: [UNIT_STATUS.COMPLETED], // 완료된 매물만
  ALL_EXCEPT_DELETED: [UNIT_STATUS.ACTIVE, UNIT_STATUS.NEGOTIATION, UNIT_STATUS.COMPLETED, UNIT_STATUS.HIDDEN], // 삭제된 것 제외 모두
  ALL: [UNIT_STATUS.ACTIVE, UNIT_STATUS.NEGOTIATION, UNIT_STATUS.COMPLETED, UNIT_STATUS.HIDDEN, UNIT_STATUS.DELETED], // 모든 상태 (관리자 전용)
};
export const UNIT_TYPE_OPTIONS = [
  { label: "Any", value: "", color: "default" },
  { label: "Apartment", value: "apartment", color: "geekblue" },
  { label: "Village", value: "village", color: "lime" },
  { label: "Condo", value: "condo", color: "magenta" },
  { label: "Land", value: "land", color: "volcano" },
  { label: "etc.,", value: "etc", color: "grey" },
] as const;

export const SELL_TYPE_OPTIONS = [
  { label: "Sale", value: "sale", color: "red" },
  { label: "Rent", value: "rent", color: "green" },
] as const;

// [02-25] Amenity 옵션 추가
// 기존 DB에 저장된 amenity 값들을 기반으로 옵션 생성
export const AMENITY_OPTIONS = [
  { label: "Gym", value: "Gym" },
  { label: "Pool", value: "Pool" },
  { label: "Pet", value: "Pet" },
  { label: "24/7 Security", value: "24/7 Security" },
  { label: "Garden", value: "Garden" },
  { label: "High Ceiling", value: "High Ceiling" },
  { label: "Playroom", value: "Playroom" },
  { label: "Jogging", value: "Jogging" },
  { label: "Ocean View", value: "Ocean View" },
  { label: "Mountain View", value: "Mountain View" },
  { label: "Large Windows", value: "Large Windows" },
  { label: "Soundproof", value: "Soundproof" },
  { label: "Sauna", value: "Sauna" },
  { label: "Concierge", value: "Concierge" },
  { label: "Library", value: "Library" },
  { label: "Retail", value: "Retail" },
];
