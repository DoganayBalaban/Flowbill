import api from "./client";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  avatar_url: string | null;
  timezone: string;
  currency: string;
  hourly_rate: number | null;
  plan: string;
  plan_expires_at: string | null;
  email_verified: boolean;
  is_onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateMeData {
  first_name?: string;
  last_name?: string;
  timezone?: string;
  currency?: string;
  hourly_rate?: number;
  avatar_url?: string;
  role?: string;
  is_onboarding_completed?: boolean;
}

export interface AuthResponse {
  status: string;
  message: string;
  user?: {
    id: string;
    email: string;
  };
}

// Auth API functions
export const authApi = {
  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  // Login
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<AuthResponse> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Get current user
  getMe: async (): Promise<{ status: string; user: User }> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Update current user
  updateMe: async (data: UpdateMeData): Promise<{ status: string; user: User }> => {
    const response = await api.patch("/auth/me", data);
    return response.data;
  },

  // Refresh token
  refresh: async (): Promise<AuthResponse> => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  },

  // Delete account
  deleteAccount: async (password: string): Promise<AuthResponse> => {
    const response = await api.delete("/auth/me", { data: { password } });
    return response.data;
  },
};

export default authApi;
