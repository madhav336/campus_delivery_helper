import { DeliveryRequest } from "@/types/deliveryRequest";

const BASE_URL = "http://192.168.137.1:5000/api";

/* ================= REQUESTS ================= */

export async function getRequests(): Promise<DeliveryRequest[]> {
  const response = await fetch(`${BASE_URL}/requests`);
  if (!response.ok) throw new Error("Failed to fetch requests");
  return response.json();
}

export async function createRequest(data: {
  itemDescription: string;
  outlet: string;
  hostel: string;
  fee: number;
}): Promise<void> {
  const response = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Failed to create request");
}

export async function updateRequest(
  id: string,
  data: {
    itemDescription: string;
    outlet: string;
    hostel: string;
    fee: number;
  }
): Promise<void> {
  const response = await fetch(`${BASE_URL}/requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Failed to update request");
}

export async function deleteRequest(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/requests/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Failed to delete request");
}

/* ================= USERS ================= */

export async function getUsers() {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data: {
  name: string;
  role: "REQUESTER" | "DELIVERER";
  hostel: string;
}) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    role: "REQUESTER" | "DELIVERER";
    hostel: string;
  }
) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
}

export async function deleteUser(id: string) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete user");
}

/* ================= OUTLETS ================= */

export async function getOutlets() {
  const res = await fetch(`${BASE_URL}/outlets`);
  if (!res.ok) throw new Error("Failed to fetch outlets");
  return res.json();
}

export async function createOutlet(data: {
  name: string;
  locationDescription: string;
}) {
  const res = await fetch(`${BASE_URL}/outlets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create outlet");
}

export async function updateOutlet(
  id: string,
  data: {
    name: string;
    locationDescription: string;
  }
) {
  const res = await fetch(`${BASE_URL}/outlets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update outlet");
}

export async function deleteOutlet(id: string) {
  const res = await fetch(`${BASE_URL}/outlets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete outlet");
}