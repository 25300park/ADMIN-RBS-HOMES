export interface FormDataTypes {
  // Sale Type
  saleType: string;

  // 기본 정보 (공통)
  title: string;
  projectTitle: string;
  unitType: string;
  fullAdress: string;
  address1: string;
  address2: string;
  address3: string;
  addressSelf: string;

  // 일반 매물 전용 필드들
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
  videos?: any;
  attachments?: any;

  // 위치 (공통)
  latitude: number;
  longitude: number;

  // 이미지 (공통)
  images: any[];

  // 프리세일 전용
  editorContent: string;

  // 설정 (공통)
  isPublished: boolean;
}

export interface UnifiedAdminFormProps {
  initialData?: any;
  unitId?: string | null;
}