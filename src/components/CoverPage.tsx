// CoverPage — the diary's front cover, first thing the shopkeeper sees.
// This is a React conversion of Experiment 1's renderCover() function.
//
// Key differences from Experiment 1:
// - Instead of returning an HTML string, we return JSX (<main>, <button>, etc.)
// - Event handlers are inline (onClick={...}) instead of querySelector + addEventListener
// - The language toggle uses useShop().setLanguage instead of mutating a global state object

import { useShop } from "../context/ShopContext";

export default function CoverPage() {
  // useShop() gives us access to the shared context — language, shopName, navigation, etc.
  const { language, setLanguage, copy, navigateTo } = useShop();

  return (
    <main className="diary-shell diary-cover flex items-center justify-center px-7 text-center text-[#f8edd4]">
      {/* Language toggle — positioned top-right, same as Experiment 1 */}
      <div className="absolute right-6 top-6">
        <button
          onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
          className="pressable rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold text-gold hover:bg-white/10"
          aria-label="Switch language"
        >
          {language === "hi" ? "English" : "हिंदी"}
        </button>
      </div>

      {/* The stitched border container — same visual as before */}
      <div className="cover-stitching relative w-full max-w-sm px-7 py-16">
        {/* Book icon */}
        <div className="mx-auto mb-8 flex h-18 w-18 items-center justify-center rounded-sm border border-gold/70 bg-burgundy-dark/20 text-gold shadow-inner">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.35" d="M6 3.75h10.5A1.5 1.5 0 0118 5.25v15H7.5A1.5 1.5 0 016 18.75v-15zM9 3.75v16.5M11.5 8.25h4M11.5 12h4M11.5 15.75h2.5" />
          </svg>
        </div>

        <p className="mb-3 text-[10px] font-bold tracking-[.34em] text-gold">
          {copy("आपकी दुकान की डायरी", "YOUR SHOP DIARY")}
        </p>

        <h1 className="text-4xl font-bold tracking-tight">
          Hisaab <span className="text-gold">किताब</span>
        </h1>

        <div className="mx-auto my-6 h-px w-16 bg-gold/70" />

        <p className="mx-auto max-w-55 text-sm leading-6 text-[#ead9bc]">
          {copy("दुकान का रोज़ का हिसाब, एक सुरक्षित जगह पर।", "Your daily shop accounts, safely in one place.")}
        </p>

        {/* onClick replaces the old document.querySelector("#btn-get-started").addEventListener("click", ...) */}
        <button
          onClick={() => navigateTo("onboarding-1")}
          className="pressable mt-12 w-full rounded-md bg-[#f7e8c8] px-5 py-4 text-base font-bold text-burgundy-dark shadow-[0_5px_0_rgba(45,10,14,.35)] hover:bg-white"
        >
          {copy("शुरू करें", "Get started")} →
        </button>
      </div>
    </main>
  );
}
