export interface User {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  deleted: boolean;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  unitPrice: number;
  taxRate?: number;
  quantity: number;
  hsnOrSacCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  hsnOrSacCode?: string;
  amount: number;
  inventoryItem?: InventoryItem;
}

export interface SalesOrder {
  id: string;
  orderNumber: number;
  tenantId: string;
  customerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  terms?: string;
  placeOfSupply?: string;
  subTotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  items: SalesOrderItem[];
  customer?: Customer;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  inventoryItem?: InventoryItem;
}

export interface Invoice {
  id: string;
  invoiceNumber: number;
  tenantId: string;
  customerId: string;
  salesOrderId?: string;
  issueDate: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  customer?: Customer;
  salesOrder?: SalesOrder;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description?: string;
  features?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
}