import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Customer, Order, Product } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { translations, type TranslationKey } from "../translations";

export type Language = "hi" | "en";

interface AppContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  copy: (hindi: string, english: string) => string;
  products: Product[];
  addProduct: (name: string) => boolean;
  removeProduct: (productId: string) => void;
  customers: Customer[];
  orders: Order[];
  addOrder: (
    customerName: string,
    productId: string,
    quantity: number,
    price: number | null,
  ) => void;
  removeOrder: (orderId: string) => void;
}

const initialProducts: Product[] = [
  { id: "chai", name: "Chai", hindiName: "चाय" },
  { id: "coffee", name: "Coffee", hindiName: "कॉफी" },
  { id: "ukala", name: "Ukala", hindiName: "उकाला" },
];

const initialOrders: Order[] = [
  {
    id: "1",
    customerName: "मनोज",
    productName: "चाय",
    quantity: 1,
    price: 10,
    timestamp: "10:02 AM",
    status: "paid",
  },
  {
    id: "2",
    customerName: "रमेश",
    productName: "कॉफी",
    quantity: 2,
    price: 20,
    timestamp: "9:48 AM",
    status: "unpaid",
  },
];

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>(
    "hisaab-language",
    "hi",
  );
  const [products, setProducts] = useLocalStorage<Product[]>(
    "hisaab-products",
    initialProducts,
  );
  const [customers, setCustomers] = useState<Customer[]>(
    initialOrders.map((order, index) => ({
      id: String(index + 1),
      name: order.customerName,
    })),
  );
  const [orders, setOrders] = useLocalStorage<Order[]>(
    "hisaab-orders",
    initialOrders,
  );

  function addOrder(
    customerName: string,
    productId: string,
    quantity: number,
    price: number | null,
  ) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const existingCustomer = customers.find(
      (customer) =>
        customer.name.toLocaleLowerCase() === customerName.toLocaleLowerCase(),
    );
    if (!existingCustomer) {
      setCustomers((current) => [
        ...current,
        { id: crypto.randomUUID(), name: customerName },
      ]);
    }

    setOrders((current) => [
      {
        id: crypto.randomUUID(),
        customerName,
        productName: product.hindiName,
        quantity,
        price,
        timestamp: new Date().toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        }),
        status: "pending",
      },
      ...current,
    ]);
  }

  function addProduct(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const duplicate = products.some(
      (product) =>
        product.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
    );
    if (duplicate) return false;
    setProducts((current) => [
      ...current,
      { id: crypto.randomUUID(), name: trimmedName, hindiName: trimmedName },
    ]);
    return true;
  }

  function removeProduct(productId: string) {
    setProducts((current) =>
      current.filter((product) => product.id !== productId),
    );
  }

  function removeOrder(orderId: string) {
    setOrders((current) => current.filter((order) => order.id !== orderId));
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translations[language][key],
      copy: (hindi: string, english: string) =>
        language === "hi" ? hindi : english,
      products,
      addProduct,
      removeProduct,
      customers,
      orders,
      addOrder,
      removeOrder,
    }),
    [language, products, customers, orders],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used inside AppProvider");
  return context;
}
