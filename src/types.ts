// Shared TypeScript types for Hisaab किताब.
// These interfaces describe the data structures used across the app.

// Product describes a shop item shown in the onboarding checklist.
export interface Product {
  id: string;
  name: string;
  hindiName: string;
}

// Order is a single entry in the shopkeeper's daily ledger.
export interface Order {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  price: number | null;
  timestamp: string;
  status: "paid" | "unpaid";
}

// Language can be Hindi or English — the shopkeeper toggles freely.
export type Language = "hi" | "en";

// All available product options (hardcoded for now, will become dynamic later).
export const PRODUCTS: Product[] = [
  { id: "chai", name: "Chai", hindiName: "चाय" },
  { id: "coffee", name: "Coffee", hindiName: "कॉफी" },
  { id: "ukala", name: "Ukala", hindiName: "उकाला" },
  { id: "samosa", name: "Samosa", hindiName: "समोसा" },
  { id: "chips", name: "Chips", hindiName: "चिप्स" },
  { id: "biscuit", name: "Biscuit", hindiName: "बिस्कुट" },
];
