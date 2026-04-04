import axios from "axios";
import api from "./client";

const portalApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface PortalClient {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  portal_enabled: boolean;
}

export interface PortalInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: "sent" | "paid" | "overdue";
  pdf_url: string | null;
  paid_at: string | null;
}

export interface PortalInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
}

export interface PortalPayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
}

export interface PortalInvoiceDetail extends PortalInvoice {
  invoice_items: PortalInvoiceItem[];
  payments: PortalPayment[];
}

// Portal API (unauthenticated / portal session)
export const portalApiClient = {
  verify: async (token: string): Promise<{ success: boolean; clientId: string }> => {
    const res = await portalApi.post("/portal/verify", { token });
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; client: PortalClient }> => {
    const res = await portalApi.get("/portal/me");
    return res.data;
  },

  getInvoices: async (): Promise<{ success: boolean; invoices: PortalInvoice[] }> => {
    const res = await portalApi.get("/portal/invoices");
    return res.data;
  },

  getInvoice: async (
    id: string,
  ): Promise<{ success: boolean; invoice: PortalInvoiceDetail }> => {
    const res = await portalApi.get(`/portal/invoices/${id}`);
    return res.data;
  },

  getPdfUrl: async (id: string): Promise<{ success: boolean; url: string }> => {
    const res = await portalApi.get(`/portal/invoices/${id}/pdf-url`);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await portalApi.post("/portal/logout");
  },
};

// Freelancer-side portal management (uses the main authenticated api)
export const clientPortalApi = {
  enablePortal: async (clientId: string): Promise<{ success: boolean; client: unknown }> => {
    const res = await api.post(`/clients/${clientId}/portal/enable`);
    return res.data;
  },

  disablePortal: async (clientId: string): Promise<{ success: boolean; client: unknown }> => {
    const res = await api.post(`/clients/${clientId}/portal/disable`);
    return res.data;
  },

  sendMagicLink: async (
    clientId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/clients/${clientId}/portal/send-link`);
    return res.data;
  },
};
