import { useState, type ReactNode } from "react";
import { Dashboard } from "./components/Dashboard";
import { useAppContext } from "./context/AppContext";
import { useLocalStorage } from "./hooks/useLocalStorage";

export function App() {
  const { products, language, setLanguage, t, addProduct, removeProduct } =
    useAppContext();
  const [screen, setScreen] = useState<
    "cover" | "shop" | "products" | "phone" | "dashboard"
  >("cover");
  const [shopName, setShopName] = useLocalStorage("hisaab-shop-name", "");
  const [newProductName, setNewProductName] = useState("");
  const [productError, setProductError] = useState("");
  const [phone, setPhone] = useLocalStorage("hisaab-phone", "");
  if (screen === "dashboard") return <Dashboard shopName={shopName} />;
  if (screen === "shop")
    return (
      <OnboardingPage
        title={t("shopNameQuestion")}
        onBack={() => setScreen("cover")}
      >
        <input
          autoFocus
          value={shopName}
          onChange={(event) => setShopName(event.target.value)}
          className="mt-8 w-full border-b-2 border-line bg-transparent py-3 text-lg outline-none focus:border-burgundy"
          placeholder={t("shopName")}
        />
        <NextButton
          disabled={!shopName.trim()}
          onClick={() => setScreen("products")}
        />
      </OnboardingPage>
    );
  if (screen === "products")
    return (
      <OnboardingPage title={t("whatSell")} onBack={() => setScreen("shop")}>
        <div className="mt-8 space-y-2">
          {!products.length && (
            <p className="border border-dashed border-line px-4 py-3 text-sm text-ink-soft">
              {t("noProducts")}
            </p>
          )}
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 border border-line px-4 py-3"
            >
              <span className="font-bold">
                {language === "hi" ? product.hindiName : product.name}
              </span>
              <button
                type="button"
                onClick={() => removeProduct(product.id)}
                className="text-sm font-bold text-due"
                aria-label={`${t("removeProduct")}: ${product.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <form
          className="mt-5 border-t border-line pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const added = addProduct(newProductName);
            if (!newProductName.trim()) {
              setProductError(t("productRequired"));
              return;
            }
            if (!added) {
              setProductError(t("productDuplicate"));
              return;
            }
            setNewProductName("");
            setProductError("");
          }}
        >
          <label className="block text-xs font-bold text-ink-soft">
            {t("addAnotherProduct")}
            <div className="mt-2 flex gap-2">
              <input
                value={newProductName}
                onChange={(event) => setNewProductName(event.target.value)}
                className="min-w-0 flex-1 border-b-2 border-line bg-transparent py-2 outline-none focus:border-burgundy"
                placeholder={t("productName")}
              />
              <button
                type="submit"
                className="pressable border border-burgundy px-3 py-2 text-xs font-bold text-burgundy"
              >
                {t("addProduct")}
              </button>
            </div>
          </label>
          {productError && (
            <p className="mt-2 text-xs font-bold text-due">{productError}</p>
          )}
        </form>
        <NextButton
          disabled={!products.length}
          onClick={() => setScreen("phone")}
        />
      </OnboardingPage>
    );
  if (screen === "phone")
    return (
      <OnboardingPage
        title={t("loginNumber")}
        onBack={() => setScreen("products")}
      >
        <input
          autoFocus
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
          className="mt-8 w-full border-b-2 border-line bg-transparent py-3 text-lg tracking-widest outline-none focus:border-burgundy"
          placeholder={t("mobileNumber")}
        />
        <NextButton
          disabled={phone.length !== 10}
          onClick={() => setScreen("dashboard")}
          label={t("openDiary")}
        />
      </OnboardingPage>
    );
  return (
    <main className="page-in-right diary-shell diary-cover flex items-center justify-center px-7 text-center text-[#f8edd4]">
      <button
        onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
        className="pressable absolute right-6 top-6 rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold text-gold"
        aria-label={t("switchLanguage")}
      >
        {language === "hi" ? "English" : "हिंदी"}
      </button>
      <div className="cover-stitching relative w-full max-w-sm px-7 py-16">
        <div className="mx-auto mb-8 flex h-18 w-18 items-center justify-center rounded-sm border border-gold/70 text-gold">
          <span className="text-4xl">▤</span>
        </div>
        <p className="mb-3 text-[10px] font-bold tracking-[.34em] text-gold">
          {t("yourShopDiary")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          Hisaab <span className="text-gold">किताब</span>
        </h1>
        <div className="mx-auto my-6 h-px w-16 bg-gold/70" />
        <p className="mx-auto max-w-55 text-sm leading-6 text-[#ead9bc]">
          {t("dailyAccounts")}
        </p>
        <button
          onClick={() => setScreen("shop")}
          className="pressable mt-12 w-full rounded-md bg-[#f7e8c8] px-5 py-4 text-base font-bold text-burgundy-dark shadow-[0_5px_0_rgba(45,10,14,.35)]"
        >
          {t("openDiaryCover")} →
        </button>
      </div>
    </main>
  );
}

function OnboardingPage({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const { language, setLanguage, t } = useAppContext();

  return (
    <main className="page-in-right diary-shell paper-page flex flex-col px-7 py-6">
      <button
        onClick={onBack}
        className="w-fit text-sm font-semibold text-burgundy"
      >
        ← {t("back")}
      </button>
      <button
        onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
        className="absolute right-6 top-6 rounded-full border border-line px-3 py-1 text-[11px] font-bold text-ink-soft"
        aria-label={t("switchLanguage")}
      >
        {language === "hi" ? "English" : "हिंदी"}
      </button>
      <section className="mt-14 border-l-2 border-margin pl-5">
        <p className="text-[10px] font-bold tracking-[.22em] text-burgundy">
          {t("diaryPage")}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink">
          {title}
        </h1>
        {children}
      </section>
    </main>
  );
}

function NextButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label?: string;
}) {
  const { t } = useAppContext();

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="pressable mt-auto w-full rounded-md bg-burgundy py-4 font-bold text-[#f8edd4] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label ?? t("continue")} →
    </button>
  );
}
