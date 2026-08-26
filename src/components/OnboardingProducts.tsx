// OnboardingProducts — Step 2 of onboarding.
// The shopkeeper selects which products their shop sells.
//
// React concepts used:
// - Array.map() in JSX: rendering a list of checkboxes from the PRODUCTS array
// - Controlled checkboxes: checked state driven by React state
// - Event handling: onChange on each checkbox toggles the product in context

import { useShop } from "../context/ShopContext";
import { PRODUCTS } from "../types";

// Reusing the same PageHeader pattern — shared across onboarding steps.
function PageHeader({ step }: { step: number }) {
  const { language, setLanguage, copy, goBack } = useShop();
  return (
    <header className="flex items-center justify-between px-6 pt-6 pb-3">
      <button onClick={goBack} className="pressable text-sm font-semibold text-burgundy hover:text-burgundy-dark">
        ← {copy("पीछे", "Back")}
      </button>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold tracking-[.14em] text-ink-soft">
          {copy("पन्ना", "PAGE")} {step}/3
        </span>
        <button
          onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
          className="pressable rounded-full border border-line px-3 py-1 text-[11px] font-bold text-ink-soft hover:bg-white"
          aria-label="Switch language"
        >
          {language === "hi" ? "English" : "हिंदी"}
        </button>
      </div>
    </header>
  );
}

export default function OnboardingProducts() {
  const { language, selectedProducts, toggleProduct, copy, navigateTo } = useShop();

  // selectedProducts is an array of Product objects (filtered from PRODUCTS in context).
  // We check if a product is selected by comparing its ID against the selectedProducts array.
  const isSelected = (id: string) => selectedProducts.some((p) => p.id === id);

  return (
    <main className="diary-shell paper-page flex flex-col">
      <PageHeader step={2} />

      <section className="mx-7 mt-5 border-l-2 border-margin pl-5">
        <p className="text-[10px] font-bold tracking-[.22em] text-burgundy">
          {copy("दूसरा पन्ना", "SECOND PAGE")}
        </p>
        <h2 className="mt-3 whitespace-pre-line text-3xl font-bold leading-tight text-ink">
          {copy("आप क्या\nबेचते हैं?", "What do you\nsell?")}
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          {copy("अपनी दुकान की चीज़ें चुनें।", "Choose the items in your shop.")}
        </p>
      </section>

      {/* Product list — each checkbox toggles a product in the shop's product list */}
      <div className="hide-scrollbar mx-7 mt-7 flex-1 space-y-2 overflow-auto pb-4">
        {PRODUCTS.map((product) => (
          <label
            key={product.id}
            className="product-choice flex cursor-pointer items-center gap-4 rounded-md border border-line bg-paper/70 px-4 py-3.5 transition hover:bg-white"
          >
            <input
              className="h-5 w-5 accent-burgundy"
              type="checkbox"
              checked={isSelected(product.id)}
              onChange={() => toggleProduct(product.id)}
            />
            <span className="font-bold text-ink">
              {language === "hi" ? product.hindiName : product.name}
            </span>
            <span className="text-xs text-ink-soft">
              {language === "hi" ? product.name : product.hindiName}
            </span>
          </label>
        ))}
      </div>

      <div className="px-7 pb-8 pt-4">
        <p className="mb-4 text-center text-xs text-ink-soft">○ ● ○</p>
        <button
          onClick={() => navigateTo("onboarding-3")}
          className="pressable w-full rounded-md bg-burgundy py-4 font-bold text-[#f8edd4] shadow-[0_4px_0_#50171d]"
        >
          {copy("आगे बढ़ें", "Continue")} →
        </button>
      </div>
    </main>
  );
}
