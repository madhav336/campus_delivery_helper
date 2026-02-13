export type Outlet = "ANC 1" | "ANC 2" | "CP" | "Other";

export interface DeliveryRequest {
  id: string;
  item: string;
  outlet: Outlet;
  hostel: string;
  fee: number;
  createdAt: string;
}
