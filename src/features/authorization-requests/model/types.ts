export type RegistrationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RegistrationRequest {
  id: number;
  email: string;
  fullName: string;
  position: string;
  organizationId: number;
  locationId: number;
  status: RegistrationRequestStatus;
  createdAt: string;
}

