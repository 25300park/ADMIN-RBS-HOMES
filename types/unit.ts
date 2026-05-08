export interface Unit {
  id: number;
  adminId: number;
  title: string;
  type: string;
  sellType: string;
  fullAdress: string | null;
  address1: number | null;
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
  amenity: string | null;
  yearCompletion: string | null;
  outstandingPayment: number | null;
  price: number | null;
  note: string | null;
  requested: string | null;
  images: any | null;
  mapinfo: string | null;
  status: number;
  lastUpdate: string;
  regdate: string;
  latitude: number | null;
  longitude: number | null;
}

export interface UnitListItem
  extends Pick<
    Unit,
    | "id"
    | "title"
    | "type"
    | "sellType"
    | "fullAdress"
    | "area"
    | "bed"
    | "bath"
    | "price"
    | "status"
    | "regdate"
    | "lastUpdate"
  > {
  admin?: {
    name: string | null;
    email: string | null;
  };
}
