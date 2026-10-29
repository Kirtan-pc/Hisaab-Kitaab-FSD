import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "../api";
import { useAppContext } from "../context/AppContext";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import type {
  ApiCustomer,
  ApiOrder,
  ApiProduct,
  AuthSession,
} from "../types";
import { RealtimeChat } from "./RealtimeChat";

interface AuthenticatedDashboardProps {
  session: AuthSession;
  onSignOut: () => void;
  onUnauthorized: () => void;
}

interface NewOrder {
  customerName: string;
  productId: string;
  quantity: number;
  price: number | null;
}

export function AuthenticatedDashboard({
  session,
  onSignOut,
  onUnauthorized,
}: AuthenticatedDashboardProps) {
  const { language, setLanguage, t } = useAppContext();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const loadLedger = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError("");
      try {
        const [loadedProducts, loadedCustomers, loadedOrders] =
          await Promise.all([
            apiRequest<ApiProduct[]>(
              `/api/products/shop/${session.account.id}`,
              { token: session.token, signal },
            ),
            apiRequest<ApiCustomer[]>(
              `/api/customers/shop/${session.account.id}`,
              { token: session.token, signal },
            ),
            apiRequest<ApiOrder[]>(
              `/api/orders/shop/${session.account.id}`,
              { token: session.token, signal },
            ),
          ]);
        if (signal?.aborted) return;
        setProducts(loadedProducts);
        setCustomers(loadedCustomers);
        setOrders(loadedOrders);
      } catch (error) {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized();
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : t("savingFailed"),
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [onUnauthorized, session.account.id, session.token, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadLedger(controller.signal);
    return () => controller.abort();
  }, [loadLedger]);

  function reportActionError(error: unknown, context?: string) {
    if (error instanceof ApiError && error.status === 401) {
      onUnauthorized();
      return;
    }
    const message = error instanceof Error ? error.message : t("savingFailed");
    setActionError(context ? `${context} ${message}` : message);
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      const product = await apiRequest<ApiProduct>("/api/products", {
        method: "POST",
        token: session.token,
        body: { name: newProductName.trim() },
      });
      setProducts((current) =>
        [...current, product].sort((first, second) =>
          first.name.localeCompare(second.name),
        ),
      );
      setNewProductName("");
    } catch (error) {
      reportActionError(error);
    } finally {
      setBusy(false);
    }
  }

  async function deactivateProduct(productId: string) {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      const product = await apiRequest<ApiProduct>(
        `/api/products/${productId}`,
        { method: "PATCH", token: session.token, body: { active: false } },
      );
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? product : item)),
      );
    } catch (error) {
      reportActionError(error);
    } finally {
      setBusy(false);
    }
  }

  async function addOrder(order: NewOrder) {
    if (busy) return false;
    setBusy(true);
    setActionError("");
    let didCreateCustomer = false;
    try {
      const product = products.find(
        (item) => item._id === order.productId && item.active,
      );
      if (!product) {
        setActionError(t("productUnavailable"));
        return false;
      }

      let customer = customers.find(
        (item) =>
          item.name.toLocaleLowerCase() ===
          order.customerName.toLocaleLowerCase(),
      );
      if (!customer) {
        const newCustomer = await apiRequest<ApiCustomer>("/api/customers", {
          method: "POST",
          token: session.token,
          body: { name: order.customerName },
        });
        customer = newCustomer;
        didCreateCustomer = true;
        setCustomers((current) => [...current, newCustomer]);
      }

      const saved = await apiRequest<ApiOrder>("/api/orders", {
        method: "POST",
        token: session.token,
        body: {
          customer: customer._id,
          product: product._id,
          quantity: order.quantity,
          price: order.price,
        },
      });
      setOrders((current) => [
        {
          ...saved,
          customer: {
            _id: customer._id,
            name: customer.name,
            balance: customer.balance,
          },
          product: { _id: product._id, name: product.name },
        },
        ...current,
      ]);
      return true;
    } catch (error) {
      reportActionError(
        error,
        didCreateCustomer ? t("customerSavedOrderNotConfirmed") : undefined,
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function removeOrder(orderId: string) {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await apiRequest<void>(`/api/orders/${orderId}`, {
        method: "DELETE",
        token: session.token,
      });
      setOrders((current) =>
        current.filter((order) => order._id !== orderId),
      );
    } catch (error) {
      reportActionError(error);
    } finally {
      setBusy(false);
    }
  }

  if (showChat) {
    return (
      <RealtimeChat
        token={session.token}
        accountId={session.account.id}
        accountName={session.account.name}
        onBack={() => setShowChat(false)}
        onUnauthorized={onUnauthorized}
      />
    );
  }

  const activeProducts = products.filter((product) => product.active);
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[.22em] text-gold">
              {t("todaysLedger")}
            </p>
            <p className="mt-1 text-[10px] text-[#e6cfa6]">
              {t("ledgerApiNotice")}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
              className="pressable rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold text-gold"
              aria-label={t("switchLanguage")}
            >
              {language === "hi" ? "English" : "हिंदी"}
            </button>
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold text-gold"
            >
              {t("chat")}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold text-gold"
            >
              {t("signOut")}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <h1 className="text-2xl font-bold">{session.account.name}</h1>
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

      <section className="mx-5 mt-4 border border-line bg-[#f8f1e2]/80 p-4">
        <h2 className="mb-3 text-lg font-bold">{t("whatSell")}</h2>
        <form onSubmit={addProduct} className="flex gap-2">
          <label className="sr-only" htmlFor="server-product-name">
            {t("productName")}
          </label>
          <input
            id="server-product-name"
            required
            maxLength={100}
            value={newProductName}
            onChange={(event) => setNewProductName(event.target.value)}
            className="min-w-0 flex-1 border-b-2 border-line bg-transparent py-2 outline-none focus:border-burgundy"
            placeholder={t("productName")}
          />
          <button
            type="submit"
            disabled={busy || !newProductName.trim()}
            className="border border-burgundy px-3 py-2 text-xs font-bold text-burgundy disabled:opacity-50"
          >
            {busy ? t("saving") : t("addProduct")}
          </button>
        </form>
        <ul className="mt-3 space-y-2">
          {products.map((product) => (
            <li
              key={product._id}
              className="flex items-center justify-between gap-3 border-b border-line/70 py-2"
            >
              <span className={product.active ? "font-bold" : "text-ink-soft"}>
                {product.name}
                {!product.active && ` · ${t("inactiveProduct")}`}
              </span>
              {product.active && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deactivateProduct(product._id)}
                  className="text-xs font-bold text-due underline disabled:opacity-50"
                >
                  {t("deactivateProduct")}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {actionError && (
        <p role="alert" className="mx-5 mt-3 text-sm font-bold text-due">
          {actionError}
        </p>
      )}
      {loadError ? (
        <section className="mx-5 mt-5 border border-due p-4" role="alert">
          <p className="text-sm font-bold text-due">{loadError}</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadLedger()}
            className="mt-3 border border-burgundy px-3 py-2 text-sm font-bold text-burgundy"
          >
            {loading ? t("loadingLedger") : t("retry")}
          </button>
        </section>
      ) : loading ? (
        <p role="status" className="mx-5 mt-5 text-sm text-ink-soft">
          {t("loadingLedger")}
        </p>
      ) : (
        <>
          {showOrderForm && activeProducts.length > 0 && (
            <ServerOrderEntry
              products={activeProducts}
              busy={busy}
              error={actionError}
              onSave={addOrder}
              onClose={() => {
                setShowOrderForm(false);
                setActionError("");
              }}
            />
          )}
          <section className="mx-5 mt-5 flex-1 overflow-auto pb-20">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-lg font-bold">{t("todaysEntries")}</h2>
              <span className="text-xs text-ink-soft">
                {orders.length} {t("records")}
              </span>
            </div>
            {orders.length === 0 ? (
              <p className="border border-dashed border-line px-4 py-6 text-sm text-ink-soft">
                {t("emptyLedger")}
              </p>
            ) : (
              <div className="border-y border-line bg-[#f8f1e2]/65">
                {orders.map((order) => {
                  const customer =
                    typeof order.customer === "string"
                      ? customers.find(
                          (item) => item._id === order.customer,
                        )?.name ?? t("customerName")
                      : order.customer.name;
                  const product =
                    typeof order.product === "string"
                      ? products.find((item) => item._id === order.product)
                          ?.name ?? t("item")
                      : order.product.name;
                  return (
                    <div
                      key={order._id}
                      className="grid grid-cols-[1.1fr_1fr_.6fr] gap-2 border-b border-line/70 px-3 py-3 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-bold">{customer}</p>
                        <p className="text-[10px] text-ink-soft">
                          {new Date(order.orderedAt).toLocaleTimeString(
                            language === "hi" ? "hi-IN" : "en-IN",
                            { hour: "numeric", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                      <p className="text-sm">
                        {order.quantity} {product}
                      </p>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          ₹{(order.price ?? 0) * order.quantity}
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeOrder(order._id)}
                          className="text-[10px] text-due underline disabled:opacity-50"
                        >
                          {t("removeOrder")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          {!showOrderForm && (
            <button
              type="button"
              disabled={activeProducts.length === 0}
              onClick={() => {
                setActionError("");
                setShowOrderForm(true);
              }}
              className="pressable absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-3xl text-[#f8edd4] shadow-lg disabled:opacity-50"
              aria-label={t("newOrder")}
            >
              +
            </button>
          )}
        </>
      )}
    </main>
  );
}

function ServerOrderEntry({
  products,
  busy,
  error,
  onSave,
  onClose,
}: {
  products: ApiProduct[];
  busy: boolean;
  error: string;
  onSave: (order: NewOrder) => Promise<boolean>;
  onClose: () => void;
}) {
  const { t } = useAppContext();
  const {
    transcript,
    isListening,
    error: voiceError,
    startListening,
    stopListening,
  } = useSpeechRecognition();
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState(products[0]?._id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!transcript) return;
    const lowerTranscript = transcript.toLocaleLowerCase();
    const quantityMatch = transcript.match(/\d+/);
    const spokenQuantity =
      quantityMatch?.[0] ??
      Object.entries({ एक: "1", दो: "2", तीन: "3", चार: "4", five: "5" })
        .find(([word]) => lowerTranscript.includes(word))?.[1];
    const product = products.find((item) =>
      lowerTranscript.includes(item.name.toLocaleLowerCase()),
    );
    if (spokenQuantity) setQuantity(spokenQuantity);
    if (product) setProductId(product._id);
    const customer = transcript
      .replace(quantityMatch?.[0] ?? "", "")
      .replace(product?.name ?? "", "")
      .trim();
    if (customer) setCustomerName(customer);
  }, [products, transcript]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedPrice = price === "" ? null : Number(price);
    if (
      !customerName.trim() ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      (parsedPrice !== null &&
        (!Number.isFinite(parsedPrice) || parsedPrice < 0))
    ) {
      setValidationError(t("orderValidation"));
      return;
    }
    setValidationError("");
    const saved = await onSave({
      customerName: customerName.trim(),
      productId,
      quantity: parsedQuantity,
      price: parsedPrice,
    });
    if (saved) onClose();
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="mx-5 mt-5 border border-line bg-[#f8f1e2]/95 p-4 shadow-[3px_4px_0_rgba(106,84,53,.12)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("newOrder")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold text-burgundy"
        >
          {t("close")}
        </button>
      </div>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className="pressable mb-4 w-full border border-burgundy px-3 py-2 text-sm font-bold text-burgundy"
      >
        {isListening ? t("listeningStop") : t("fillByVoice")}
      </button>
      {(voiceError || transcript) && (
        <p className="mb-3 text-xs text-ink-soft">
          {voiceError ? t(voiceError) : `${t("heard")}: ${transcript}`}
        </p>
      )}
      <label className="block text-xs font-bold text-ink-soft">
        {t("customerName")}
        <input
          required
          maxLength={100}
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          className="mt-1 w-full border-b-2 border-line bg-transparent py-2 outline-none focus:border-burgundy"
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-xs font-bold text-ink-soft">
          {t("item")}
          <select
            required
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="mt-1 w-full border border-line bg-paper p-2 text-sm text-ink"
          >
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-ink-soft">
          {t("quantity")}
          <input
            required
            type="number"
            min="1"
            max="10000"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-full border border-line bg-paper p-2 text-sm text-ink"
          />
        </label>
      </div>
      <label className="mt-4 block text-xs font-bold text-ink-soft">
        {t("priceOptional")}
        <input
          type="number"
          min="0"
          max="100000000"
          step="any"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mt-1 w-full border-b-2 border-line bg-transparent py-2 outline-none focus:border-burgundy"
          placeholder={t("priceLater")}
        />
      </label>
      {(validationError || error) && (
        <p role="alert" className="mt-3 text-xs font-bold text-due">
          {validationError || error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || products.length === 0}
        className="pressable mt-5 w-full rounded-md bg-burgundy py-3 font-bold text-[#f8edd4] disabled:opacity-50"
      >
        {busy ? t("saving") : t("addOrder")}
      </button>
    </form>
  );
}
