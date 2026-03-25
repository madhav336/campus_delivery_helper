export interface DeliveryRequest {
  _id: string;
  itemDescription: string;
  outlet: string;
  hostel: string;
  fee: number;

  status: "OPEN" | "ACCEPTED" | "COMPLETED"; // 🔥 ADD THIS

  createdAt: string;
  updatedAt?: string;
}