export interface Client {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  siret?: string;
  tvaNumber?: string;
  notes?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  invoiceCount?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
