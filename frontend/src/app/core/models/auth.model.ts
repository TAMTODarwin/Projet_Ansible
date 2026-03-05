export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  companyType?: string;
  phone?: string;
  siret?: string;
  rcs?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  paymentMethod?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  companyType?: string;
  phone?: string;
  siret?: string;
  rcs?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  paymentMethod?: string;
}
