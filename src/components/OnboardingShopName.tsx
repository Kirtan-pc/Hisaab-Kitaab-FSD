// OnboardingShopName — Step 1 of the 3-page onboarding flow.
// The shopkeeper enters their shop's name here.
//
// React concepts used:
// - useState: the input value is managed by React state, not a raw DOM variable
// - useEffect: auto-focuses the input when the page appears
// - Controlled component: the input's value comes from state, and onChange updates state

import { useRef, useEffect } from "react";
import { useShop } from "../context/ShopContext";

// PageHeader is a shared component for all onboarding pages.
// It shows the back button, page indicator, and language toggle.
function PageHeader({ step }: { step: number }) {
  const { language, setLanguage, copy, goBack } = useShop();
  return (
    <header className="flex items-center justify-between px-6 pt-6 pb-3">
      <button
        onClick={goBack}
        className="pressable text-sm font-semibold text-burgundy hover:text-burgundy-dark"
      >
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

export default function OnboardingShopName() {
  const { shopName, setShopName, copy, navigateTo } = useShop();

  // useRef gives us direct access to the DOM input element.
  // We use this to call .focus() — something we can't do with JSX alone.
  const inputRef = useRef<HTMLInputElement>(null);

  // useEffect with empty dependency array [] runs ONCE after first render.
  // This replaces the old window.setTimeout(() => input?.focus(), 100).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <main className="diary-shell paper-page flex flex-col">
      <PageHeader step={1} />

      <section className="mx-7 mt-14 border-l-2 border-margin pl-5">
        <p className="text-[10px] font-bold tracking-[.22em] text-burgundy">
          {copy("पहला पन्ना", "FIRST PAGE")}
        </p>
        <h2 className="mt-3 whitespace-pre-line text-3xl font-bold leading-tight text-ink">
          {copy("आपकी दुकान का\nनाम क्या है?", "What is your\nshop name?")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {copy("अपनी दुकान का नाम लिखें।", "Write your shop name.")}
        </p>

        <label className="mt-10 block text-xs font-bold text-ink-soft" htmlFor="input-shop-name">
          {copy("दुकान का नाम", "SHOP NAME")}
        </label>

        {/* Controlled input: value={shopName} onChange updates React state */}
        <input
          ref={inputRef}
          id="input-shop-name"
          className="mt-2 w-full border-b-2 border-line bg-transparent py-3 text-lg font-medium text-ink outline-none transition focus:border-burgundy"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder=""
          autoComplete="organization"
        />
      </section>

      <div className="mt-auto px-7 pb-8">
        <p className="mb-4 text-center text-xs text-ink-soft">● ○ ○</p>
        <button
          onClick={() => navigateTo("onboarding-2")}
          disabled={!shopName.trim()}
          className="pressable w-full rounded-md bg-burgundy py-4 font-bold text-[#f8edd4] shadow-[0_4px_0_#50171d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copy("आगे बढ़ें", "Continue")} →
        </button>
      </div>
    </main>
  );
}
