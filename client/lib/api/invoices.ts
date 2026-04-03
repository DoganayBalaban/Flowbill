import api from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceClient {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  paid_at: string;
  notes: string | null;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  pdf_status: "not_generated" | "processing" | "generated" | "failed";
  pdf_url: string | null;
  pdf_generated_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  notes: string | null;
  terms: string | null;
  lemon_checkout_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  client?: InvoiceClient;
  invoice_items?: InvoiceItem[];
  time_entries?: Array<{
    id: string;
    description: string | null;
    duration_minutes: number | null;
    hourly_rate: number | null;
    started_at: string;
    ended_at: string | null;
  }>;
  payments?: InvoicePayment[];
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total: number;
  currency: string;
  status: Invoice["status"];
  pdf_status: Invoice["pdf_status"];
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string;
  };
}

export interface InvoicesResponse {
  success: boolean;
  data: InvoiceListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoiceStats {
  total_invoiced: number;
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  total_draft: number;
}

export interface InvoicesQueryParams {
  page?: number;
  limit?: number;
  status?: Invoice["status"];
  clientId?: string;
  start?: string;
  end?: string;
  sortBy?: "issue_date" | "due_date" | "total" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface CreateInvoiceData {
  clientId: string;
  issueDate: string;
  dueDate: string;
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
  timeEntryIds?: string[];
  tax?: number;
  discount?: number;
  currency?: string;
  notes?: string;
  terms?: string;
}

export interface UpdateInvoiceData {
  issue_date?: string;
  due_date?: string;
  notes?: string;
  terms?: string;
  status?: Invoice["status"];
  invoice_items?: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
}

export interface MarkAsPaidData {
  paidAt?: string;
  amount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

export const invoicesApi = {
  getInvoices: async (
    params?: InvoicesQueryParams,
  ): Promise<InvoicesResponse> => {
    const response = await api.get("/invoices", { params });
    return response.data;
  },

  getInvoice: async (
    id: string,
  ): Promise<{ success: boolean; data: Invoice }> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  getInvoiceStats: async (
    start?: string,
    end?: string,
  ): Promise<{ success: boolean; data: InvoiceStats }> => {
    const response = await api.get("/invoices/stats", {
      params: { start, end },
    });
    return response.data;
  },

  createInvoice: async (
    data: CreateInvoiceData,
  ): Promise<{ success: boolean; data: Invoice }> => {
    const response = await api.post("/invoices", data);
    return response.data;
  },

  updateInvoice: async (
    id: string,
    data: UpdateInvoiceData,
  ): Promise<{ success: boolean; data: Invoice }> => {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  },

  deleteInvoice: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  generatePdf: async (
    id: string,
    force = false,
  ): Promise<{ success: boolean; message: string; jobId: string }> => {
    const response = await api.post(`/invoices/${id}/pdf`, {}, {
      params: { force },
    });
    return response.data;
  },

  downloadPdf: async (
    id: string,
  ): Promise<{ success: boolean; download_url: string }> => {
    const response = await api.get(`/invoices/${id}/download`);
    return response.data;
  },

  sendEmail: async (
    id: string,
  ): Promise<{ success: boolean; message: string; jobId: string }> => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },

  markAsPaid: async (
    id: string,
    data: MarkAsPaidData,
  ): Promise<{ success: boolean; data: unknown }> => {
    const response = await api.post(`/invoices/${id}/mark-paid`, data);
    return response.data;
  },

};

export default invoicesApi;
