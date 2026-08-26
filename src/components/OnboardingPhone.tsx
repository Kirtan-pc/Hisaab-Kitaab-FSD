// OnboardingPhone — Step 3 of onboarding.
// The shopkeeper enters their mobile number for login.
//
// React concepts used:
// - Controlled input with input filtering (only digits allowed)
// - useEffect for auto-focus
// - Conditional disabled state on the button

import { useRef, useEffect } from "react";
import { useShop } from "../context/ShopContext";

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

export default function OnboardingPhone() {
  const { phoneNumber, setPhoneNumber, copy, navigateTo } = useShop();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // handlePhoneInput strips non-digit characters and caps at 10 digits.
  // This is the same filtering logic from Experiment 1, but now it updates React state.
  const handlePhoneInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(digitsOnly);
  };

  return (
    <main className="diary-shell paper-page flex flex-col">
      <PageHeader step={3} />

      <section className="mx-7 mt-14 border-l-2 border-margin pl-5">
        <p className="text-[10px] font-bold tracking-[.22em] text-burgundy">
          {copy("तीसरा पन्ना", "THIRD PAGE")}
        </p>
        <h2 className="mt-3 whitespace-pre-line text-3xl font-bold leading-tight text-ink">
          {copy("लॉगिन के लिए\nनंबर डालें", "Enter a number\nto log in")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {copy("इसी नंबर से आप फिर अपना खाता खोल सकेंगे।", "Use this number to open your account again.")}
        </p>

        <label className="mt-10 block text-xs font-bold text-ink-soft" htmlFor="input-phone">
          {copy("मोबाइल नंबर", "MOBILE NUMBER")}
        </label>

        <div className="mt-2 flex items-center gap-3 border-b-2 border-line focus-within:border-burgundy">
          <span className="font-bold text-burgundy">+91</span>
          <input
            ref={inputRef}
            id="input-phone"
            className="w-full bg-transparent py-3 text-lg font-medium tracking-[.1em] text-ink outline-none"
            value={phoneNumber}
            onChange={(e) => handlePhoneInput(e.target.value)}
            inputMode="numeric"
            maxLength={10}
            placeholder=""
            autoComplete="tel"
          />
        </div>
      </section>

      <div className="mt-auto px-7 pb-8">
        <p className="mb-4 text-center text-xs text-ink-soft">○ ○ ●</p>
        <button
          onClick={() => navigateTo("dashboard")}
          disabled={phoneNumber.length !== 10}
          className="pressable w-full rounded-md bg-burgundy py-4 font-bold text-[#f8edd4] shadow-[0_4px_0_#50171d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copy("डायरी खोलें", "Open diary")} →
        </button>
      </div>
    </main>
  );
}
