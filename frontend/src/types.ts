export interface Product {
  id: string;
  name: string;
  hindiName: string;
}

export interface Customer {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  price: number | null;
  timestamp: string;
  status: "pending" | "paid" | "unpaid";
}

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  ownerPhone: string;
  role: "user" | "admin";
}

export interface AuthSession {
  token: string;
  account: AuthAccount;
}

export interface ApiProduct {
  _id: string;
  name: string;
  active: boolean;
}

export interface ApiCustomer {
  _id: string;
  name: string;
  balance: number;
}

export interface ApiOrder {
  _id: string;
  customer: string | Pick<ApiCustomer, "_id" | "name" | "balance">;
  product: string | Pick<ApiProduct, "_id" | "name">;
  quantity: number;
  price: number | null;
  status: string;
  orderedAt: string;
}
