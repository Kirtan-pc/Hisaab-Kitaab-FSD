// Dashboard — the main ledger screen, like opening today's page in the diary.
//
// React concepts used:
// - useEffect: computes derived values (total, due) from the orders array
// - Array methods: filter, reduce, map — working with the orders data
// - Conditional rendering: showing different styles for paid vs unpaid orders

import { useMemo } from "react";
import { useShop } from "../context/ShopContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { PRODUCTS } from "../types";

export default function Dashboard() {
  const { shopName, language, setLanguage, orders, copy } = useShop();
  const [ledgerSaved, setLedgerSaved] = useLocalStorage("ledger-saved", false);

  // useMemo caches the computed values so they only recalculate when `orders` changes.
  // Without useMemo, these would recompute on every render (even if orders didn't change).
  // This is similar to useEffect but for VALUES, not side effects.
  const total = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + (order.price ?? 0) * order.quantity,
        0,
      ),
    [orders],
  );
  const due = useMemo(
    () =>
      orders
        .filter((order) => order.status === "unpaid")
        .reduce((sum, order) => sum + (order.price ?? 0) * order.quantity, 0),
    [orders],
  );

  // Format today's date in Indian locale — same logic from Experiment 1.
  const today = new Date().toLocaleDateString(
    language === "hi" ? "hi-IN" : "en-IN",
    {
      day: "numeric",
      month: "long",
      weekday: "short",
    },
  );

  // Translate product name from Hindi to English if needed.
  const translateProduct = (hindiName: string) => {
    if (language === "hi") return hindiName;
    return PRODUCTS.find((p) => p.hindiName === hindiName)?.name ?? hindiName;
  };

  return (
    <main className="diary-shell paper-page flex flex-col">
      {/* Header — dark burgundy, same as Experiment 1 */}
      <header className="border-b border-burgundy-dark bg-burgundy px-6 py-5 text-[#f8edd4]">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold tracking-[.22em] text-gold">
            {copy("आज की खाता-बही", "TODAY'S LEDGER")}
          </p>
          <button
            onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
            className="pressable rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold text-gold hover:bg-white/10"
          >
            {language === "hi" ? "English" : "हिंदी"}
          </button>
        </div>
        <div className="mt-1 flex items-end justify-between">
          <h1 className="text-2xl font-bold">
            {shopName || copy("मेरी दुकान", "My shop")}
          </h1>
          <span className="text-xs text-[#e6cfa6]">{today}</span>
        </div>
      </header>

      {/* Summary card — shows total orders, total amount, and due amount */}
      <section className="mx-5 mt-5 border border-line bg-[#f8f1e2]/90 p-4 shadow-[3px_4px_0_rgba(106,84,53,.12)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold tracking-[.18em] text-ink-soft">
            {copy("आज का हिसाब", "TODAY'S TOTAL")}
          </p>
          <button
            type="button"
            onClick={() => setLedgerSaved(true)}
            className="pressable border border-burgundy px-2 py-1 text-[10px] font-bold text-burgundy"
          >
            {ledgerSaved ? "Saved" : "Save ledger"}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-paid">
          Custom hook status:{" "}
          {ledgerSaved ? "Ledger saved locally" : "Ready to save"}
        </p>
        <div className="mt-3 grid grid-cols-3 divide-x divide-line text-center">
          <div>
            <p className="text-xl font-bold">{orders.length}</p>
            <p className="text-[11px] text-ink-soft">
              {copy("ऑर्डर", "orders")}
            </p>
          </div>
          <div>
            <p className="text-xl font-bold text-paid">₹{total}</p>
            <p className="text-[11px] text-ink-soft">{copy("कुल", "total")}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-due">₹{due}</p>
            <p className="text-[11px] text-ink-soft">{copy("उधार", "due")}</p>
          </div>
        </div>
      </section>

      {/* Order entries — the diary-style ledger rows */}
      <section className="mx-5 mt-6 flex-1 overflow-auto pb-28">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">
            {copy("आज की एंट्री", "Today's entries")}
          </h2>
          <span className="text-xs text-ink-soft">
            {copy("ग्राहक • ऑर्डर • समय", "customer • order • time")}
          </span>
        </div>

        <div className="border-y border-line bg-[#f8f1e2]/65">
          {/* Column headers */}
          <div className="grid grid-cols-[1.15fr_.95fr_.55fr] gap-2 border-b border-line px-3 py-2 text-[10px] font-bold tracking-wide text-ink-soft">
            <span>{copy("ग्राहक", "CUSTOMER")}</span>
            <span>{copy("ऑर्डर", "ORDER")}</span>
            <span className="text-right">{copy("राशि", "AMOUNT")}</span>
          </div>

          {/* Each order row — mapped from the orders array */}
          {orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1.15fr_.95fr_.55fr] gap-2 border-b border-line/70 px-3 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-bold">{order.customerName}</p>
                <p className="text-[10px] text-ink-soft">{order.timestamp}</p>
              </div>
              <p className="text-sm">
                {order.quantity} {translateProduct(order.productName)}
              </p>
              <p
                className={`text-right text-sm font-bold ${order.status === "paid" ? "text-paid" : "text-due"}`}
              >
                ₹{(order.price ?? 0) * order.quantity}
                <br />
                <span className="text-[10px] font-medium">
                  {order.status === "paid"
                    ? copy("चुका", "paid")
                    : copy("उधार", "due")}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer navigation — 3 main sections of the app */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto grid max-w-[450px] grid-cols-3 divide-x divide-line text-center">
          <button className="flex flex-col items-center gap-1 py-3 text-burgundy">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-[10px] font-bold">
              {copy("खाता", "Ledger")}
            </span>
          </button>
          <button className="flex flex-col items-center gap-1 py-3 text-ink-soft">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-[10px] font-bold">
              {copy("ऑर्डर", "Orders")}
            </span>
          </button>
          <button className="flex flex-col items-center gap-1 py-3 text-ink-soft">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-[10px] font-bold">
              {copy("ग्राहक", "Customers")}
            </span>
          </button>
        </div>
      </footer>

      {/* Floating add button — bottom right, above the footer */}
      <button
        className="pressable absolute bottom-19 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-3xl text-[#f8edd4] shadow-[0_5px_0_#50171d]"
        onClick={() =>
          alert(
            copy(
              "नया ऑर्डर जोड़ने का विकल्प अगले प्रयोग में आएगा।",
              "Adding an order will be available in the next experiment.",
            ),
          )
        }
      >
        +
      </button>
    </main>
  );
}
