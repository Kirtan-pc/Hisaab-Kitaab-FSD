import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { OrderEntry } from "./OrderEntry";

export function Dashboard({ shopName }: { shopName: string }) {
  const { orders, removeOrder, language, setLanguage, t } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const total = orders.reduce(
    (sum, order) => sum + (order.price ?? 0) * order.quantity,
    0,
  );
  const due = orders
    .filter((order) => order.status === "unpaid")
    .reduce((sum, order) => sum + (order.price ?? 0) * order.quantity, 0);

  return (
    <main className="page-in-right diary-shell paper-page flex flex-col">
      <header className="border-b border-burgundy-dark bg-burgundy px-6 py-5 text-[#f8edd4]">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold tracking-[.22em] text-gold">
            {t("todaysLedger")}
          </p>
          <button
            onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
            className="pressable rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold text-gold"
            aria-label={t("switchLanguage")}
          >
            {language === "hi" ? "English" : "हिंदी"}
          </button>
        </div>
        <div className="mt-1 flex items-end justify-between">
          <h1 className="text-2xl font-bold">{shopName || t("myShop")}</h1>
          <span className="text-xs text-[#e6cfa6]">{t("today")}</span>
        </div>
      </header>
      <section className="mx-5 mt-5 border border-line bg-[#f8f1e2]/90 p-4 shadow-[3px_4px_0_rgba(106,84,53,.12)]">
        <div className="grid grid-cols-3 divide-x divide-line text-center">
          <div>
            <p className="text-xl font-bold">{orders.length}</p>
            <p className="text-[11px] text-ink-soft">{t("orders")}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-paid">₹{total}</p>
            <p className="text-[11px] text-ink-soft">{t("total")}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-due">₹{due}</p>
            <p className="text-[11px] text-ink-soft">{t("due")}</p>
          </div>
        </div>
      </section>
      {showForm && <OrderEntry onClose={() => setShowForm(false)} />}
      <section className="mx-5 mt-6 flex-1 overflow-auto pb-20">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">{t("todaysEntries")}</h2>
          <span className="text-xs text-ink-soft">
            {orders.length} {t("records")}
          </span>
        </div>
        <div className="border-y border-line bg-[#f8f1e2]/65">
          {orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1.1fr_1fr_.6fr] gap-2 border-b border-line/70 px-3 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-bold">{order.customerName}</p>
                <p className="text-[10px] text-ink-soft">{order.timestamp}</p>
              </div>
              <p className="text-sm">
                {order.quantity} {order.productName}
              </p>
              <div className="text-right">
                <p className="text-sm font-bold">
                  ₹{(order.price ?? 0) * order.quantity}
                </p>
                <button
                  onClick={() => removeOrder(order.id)}
                  className="text-[10px] text-due underline"
                >
                  {t("removeOrder")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="pressable absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-3xl text-[#f8edd4] shadow-lg"
          aria-label={t("newOrder")}
        >
          +
        </button>
      )}
    </main>
  );
}
