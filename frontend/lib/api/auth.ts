import { apiJson } from "./client";
import { setConsumerToken, setVendorToken, setAdminToken } from "./token";

export type UserRole = "customer" | "vendor" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  fitPhoto: string | null;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "customer" | "vendor";
  businessName?: string;
  businessCallNumber?: string;
  businessWhatsapp?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUser;
  vendorId?: string;
  token: string;
}

export interface MeResult {
  user: AuthUser;
  vendor: {
    id: string;
    userId: string;
    businessName: string;
    description: string | null;
    logo: string | null;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

/** Store the JWT in the correct role-specific localStorage key. */
function storeToken(role: UserRole, token: string): void {
  if (role === "vendor") {
    setVendorToken(token);
  } else if (role === "admin") {
    setAdminToken(token);
  } else {
    setConsumerToken(token);
  }
}

export const authApi = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const data = await apiJson<AuthResult>("/api/backend/auth/register", {
      method: "POST",
      body: input,
    });
    storeToken(data.user.role, data.token);
    return data;
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const data = await apiJson<AuthResult>("/api/backend/auth/login", {
      method: "POST",
      body: input,
    });
    storeToken(data.user.role, data.token);
    return data;
  },

  async me(): Promise<MeResult> {
    return apiJson<MeResult>("/api/backend/auth/me");
  },

  async uploadProfilePhoto(file: File): Promise<{ fitPhoto: string }> {
    const formData = new FormData();
    formData.append("photo", file);
    return apiJson<{ fitPhoto: string }>("/api/backend/auth/profile-photo", {
      method: "PATCH",
      body: formData,
    });
  },
};