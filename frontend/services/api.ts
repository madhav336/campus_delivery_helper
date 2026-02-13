import { DeliveryRequest } from "@/types/deliveryRequest";

/**
 * Mock data source for Sprint-1.
 * This will be replaced by real API calls later.
 */

const mockRequests: DeliveryRequest[] = [
  {
    id: "1",
    item: "Veg Burger",
    outlet: "ANC 1",
    hostel: "Vishwakarma",
    fee: 20,
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "2",
    item: "Cold Coffee",
    outlet: "CP",
    hostel: "Valmiki",
    fee: 15,
    createdAt: "2024-01-02T10:00:00Z",
  },
  {
    id: "3",
    item: "Paneer Roll",
    outlet: "ANC 2",
    hostel: "Gautam",
    fee: 25,
    createdAt: "2024-01-03T10:00:00Z",
  },
];


/**
 * Fetch all delivery requests.
 */
export async function getRequests(): Promise<DeliveryRequest[]> {
  return Promise.resolve(mockRequests);
}

/**
 * Create a new delivery request.
 */
export async function createRequest(
  data: Omit<DeliveryRequest, "id" | "createdAt">
): Promise<void> {
  console.log("Creating request:", data);
  return Promise.resolve();
}