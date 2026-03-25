export interface DeliveryRequest {
  _id: string;
  itemDescription: string;
  outlet: string;
  hostel: string;
  fee: number;
  status: 'OPEN'|'IN_PROGRESS'|'COMPLETED';
  acceptedBy?: string;
  createdAt: string;
  updatedAt?: string;
}