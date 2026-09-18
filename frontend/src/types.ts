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
