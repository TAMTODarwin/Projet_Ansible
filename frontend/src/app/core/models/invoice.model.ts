export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  id?: number;
  description: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber?: string;
  clientId: number;
  clientName?: string;
  clientEmail?: string;
  clientCompany?: string;
  clientAddress?: string;
  status?: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
  termsAndConditions?: string;
  items: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalClients: number;
  totalInvoices: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
  cancelledCount: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRevenue: MonthlyRevenue[];
  statusBreakdown: Record<string, number>;
  recentInvoices: RecentInvoice[];
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: string;
  issueDate: string;
}
