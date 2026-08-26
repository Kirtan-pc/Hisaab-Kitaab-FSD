// ShopContext — the central place where all shop data lives.
//
// WHY useContext?
// In Experiment 1, we used a single `state` object and passed values around manually.
// React's useContext lets any component in the tree read shared data
// WITHOUT passing props through every parent (this is called "prop drilling").
//
// In Hisaab किताब, the shop name, products, orders, and language preference
// are needed by many components (CoverPage, Dashboard, Onboarding steps).
// Context gives them all access to the same data without prop chains.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { PRODUCTS, type Order, type Language, type Product } from "../types";

// The shape of data our context provides to every component.
interface ShopContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  shopName: string;
  setShopName: (name: string) => void;
  selectedProducts: Product[];
  toggleProduct: (productId: string) => void;
  phoneNumber: string;
  setPhoneNumber: (num: string) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  currentPage: string;
  navigateTo: (page: string) => void;
  goBack: () => void;
  // Simple i18n helper — returns Hindi or English text based on current language.
  copy: (hindi: string, english: string) => string;
}

// Create context with undefined default — we'll provide a real value in the Provider.
const ShopContext = createContext<ShopContextValue | undefined>(undefined);

// Sample orders for the dashboard (same as Experiment 1).
const SAMPLE_ORDERS: Order[] = [
  { id: "1", customerName: "मनोज", productName: "चाय", quantity: 1, price: 10, timestamp: "10:02 AM", status: "paid" },
  { id: "2", customerName: "रमेश", productName: "कॉफी", quantity: 2, price: 40, timestamp: "9:48 AM", status: "unpaid" },
  { id: "3", customerName: "पियुष", productName: "उकाला", quantity: 1, price: 15, timestamp: "9:32 AM", status: "paid" },
  { id: "4", customerName: "अनिल", productName: "चाय", quantity: 3, price: 30, timestamp: "9:15 AM", status: "unpaid" },
];

// Provider wraps the entire app and makes shop data available to all children.
export function ShopProvider({ children }: { children: ReactNode }) {
  // useState — each piece of state replaces one field from Experiment 1's `state` object.
  // The difference: React re-renders the UI automatically when state changes.
  const [language, setLanguage] = useState<Language>("hi");
  const [shopName, setShopName] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(["chai", "coffee", "ukala"]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orders] = useState<Order[]>(SAMPLE_ORDERS);

  // Navigation state — replaces the manual history array from Experiment 1.
  const [currentPage, setCurrentPage] = useState("cover");
  const [, setHistory] = useState<string[]>([]);

  // useCallback memoizes functions so they don't get recreated on every render.
  // This is a performance optimization — React components re-render when their
  // functions change identity, so wrapping with useCallback prevents unnecessary re-renders.
  const navigateTo = useCallback((page: string) => {
    setHistory((prev) => [...prev, currentPage]);
    setCurrentPage(page);
  }, [currentPage]);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      const newHistory = [...prev];
      const previous = newHistory.pop();
      if (previous) setCurrentPage(previous);
      return newHistory;
    });
  }, []);

  // toggleProduct adds or removes a product from the shop's product list.
  const toggleProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  // Derive the actual Product objects from selected IDs.
  const selectedProducts = PRODUCTS.filter((p) => selectedProductIds.includes(p.id));

  // copy — the same Hindi/English toggle from Experiment 1, now as a context method.
  const copy = useCallback((hindi: string, english: string): string => {
    return language === "hi" ? hindi : english;
  }, [language]);

  // useEffect — runs after the component renders.
  // Here, it updates the browser tab title whenever shopName or language changes.
  // Without useEffect, the title would stay as the default HTML title.
  useEffect(() => {
    const title = shopName
      ? `${shopName} — Hisaab किताब`
      : "Hisaab किताब — आपकी दुकान का हिसाब";
    document.title = title;
  }, [shopName, language]);

  // The value object is what useContext consumers will receive.
  // Every component that calls useShop() gets this exact object.
  const value: ShopContextValue = {
    language,
    setLanguage,
    shopName,
    setShopName,
    selectedProducts,
    toggleProduct,
    phoneNumber,
    setPhoneNumber,
    orders,
    addOrder: () => {}, // placeholder — will implement in Experiment 3+
    currentPage,
    navigateTo,
    goBack,
    copy,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

// Custom hook — a clean way for any component to access the shop context.
// If used outside the Provider, it throws a clear error instead of silent undefined.
export function useShop(): ShopContextValue {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
