import "./style.css";

// Hisaab किताब — Experiment 1. This file uses plain TypeScript and browser events;
// later experiments can replace this small state object with React and an API.

// Product describes a shop item shown in the onboarding checklist.
interface Product {
  id: string;
  name: string;
  hindiName: string;
}
// Order is sample data used only to demonstrate the diary-style dashboard UI.
interface Order {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  price: number | null;
  timestamp: string;
  status: "paid" | "unpaid";
}
// AppState preserves entered values while the page HTML changes during navigation.
type Language = "hi" | "en";
interface AppState {
  currentPage: string;
  history: string[];
  language: Language;
  shopName: string;
  selectedProducts: string[];
  phoneNumber: string;
  orders: Order[];
  isAnimating: boolean;
}

// These are selectable example products; the choices remain unchanged from the original Experiment 1 UI.
const PRODUCTS: Product[] = [
  { id: "chai", name: "Chai", hindiName: "चाय" },
  { id: "coffee", name: "Coffee", hindiName: "कॉफी" },
  { id: "ukala", name: "Ukala", hindiName: "उकाला" },
  { id: "samosa", name: "Samosa", hindiName: "समोसा" },
  { id: "chips", name: "Chips", hindiName: "चिप्स" },
  { id: "biscuit", name: "Biscuit", hindiName: "बिस्कुट" },
];

// Keep JavaScript's cleanup timer in sync with the CSS page animation duration.
const TRANSITION_MS = 380;

// This one object is a beginner-friendly, temporary way to store the interface state.
const state: AppState = {
  currentPage: "cover",
  history: [],
  language: "hi",
  shopName: "",
  selectedProducts: ["chai", "coffee", "ukala"],
  phoneNumber: "",
  isAnimating: false,
  orders: [
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
      price: 40,
      timestamp: "9:48 AM",
      status: "unpaid",
    },
    {
      id: "3",
      customerName: "पियुष",
      productName: "उकाला",
      quantity: 1,
      price: 15,
      timestamp: "9:32 AM",
      status: "paid",
    },
    {
      id: "4",
      customerName: "अनिल",
      productName: "चाय",
      quantity: 3,
      price: 30,
      timestamp: "9:15 AM",
      status: "unpaid",
    },
  ],
};

// $ finds one element; $$ finds all matching elements and turns them into an array.
const $ = (selector: string): HTMLElement | null =>
  document.querySelector(selector);
const $$ = (selector: string): HTMLElement[] =>
  Array.from(document.querySelectorAll(selector)) as HTMLElement[];
// This formats the dashboard date in an Indian locale.
const today = (): string =>
  new Date().toLocaleDateString(state.language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    weekday: "short",
  });

// copy stores visible text in both languages. The brand uses its own fixed spelling below.
function copy(hindi: string, english: string): string {
  return state.language === "hi" ? hindi : english;
}
// languageButton is reused on every screen, so the visitor can switch at any time.
function languageButton(dark = false): string {
  const tone = dark
    ? "border-gold/60 text-gold hover:bg-white/10"
    : "border-line text-ink-soft hover:bg-white";
  return `<button id="btn-language" class="pressable rounded-full border px-3 py-1 text-[11px] font-bold ${tone}" aria-label="Switch language">${state.language === "hi" ? "English" : "हिंदी"}</button>`;
}

// renderPage chooses which screen's HTML should be inserted into the page container.
function renderPage(page: string): string {
  if (page === "onboarding-1") return renderShopName();
  if (page === "onboarding-2") return renderProducts();
  if (page === "onboarding-3") return renderPhone();
  if (page === "dashboard") return renderDashboard();
  return renderCover();
}

// movePage creates the gentle forward/back page-turn effect and then connects new buttons.
function movePage(page: string, direction: "forward" | "back"): void {
  if (state.isAnimating || state.currentPage === page) return;
  const container = $("#page-container");
  if (!container) return;
  state.isAnimating = true;
  const oldPage = container.querySelector(".page") as HTMLElement | null;
  const newPage = document.createElement("section");
  newPage.className = "page absolute inset-0";
  newPage.innerHTML = renderPage(page);
  container.append(newPage);
  void newPage.offsetHeight; // Forces layout so the animation class begins after insertion.
  oldPage?.classList.add(
    direction === "forward" ? "page-out-left" : "page-out-right",
  );
  newPage.classList.add(
    direction === "forward" ? "page-in-right" : "page-in-left",
  );
  window.setTimeout(() => {
    oldPage?.remove();
    state.currentPage = page;
    state.isAnimating = false;
    attachListeners(page);
  }, TRANSITION_MS);
}

// navigateTo remembers the current screen before moving forward, enabling the back button.
function navigateTo(page: string): void {
  state.history.push(state.currentPage);
  movePage(page, "forward");
}
// goBack reads the last screen from history and plays the animation in reverse.
function goBack(): void {
  const previous = state.history.pop();
  if (previous) movePage(previous, "back");
}

// This shared heading makes every onboarding screen feel like the next diary page.
function pageHeader(step: number): string {
  return `<header class="flex items-center justify-between px-6 pt-6 pb-3"><button id="btn-back" class="pressable text-sm font-semibold text-burgundy hover:text-burgundy-dark">← ${copy("पीछे", "Back")}</button><div class="flex items-center gap-2"><span class="rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold tracking-[.14em] text-ink-soft">${copy("पन्ना", "PAGE")} ${step}/3</span>${languageButton()}</div></header>`;
}

// The cover stays intentionally minimal: it is the front cover of the user's digital khata.
function renderCover(): string {
  return `<main class="diary-shell diary-cover flex items-center justify-center px-7 text-center text-[#f8edd4]"><div class="absolute right-6 top-6">${languageButton(true)}</div><div class="cover-stitching relative w-full max-w-sm px-7 py-16"><div class="mx-auto mb-8 flex h-18 w-18 items-center justify-center rounded-sm border border-gold/70 bg-burgundy-dark/20 text-gold shadow-inner"><svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35" d="M6 3.75h10.5A1.5 1.5 0 0118 5.25v15H7.5A1.5 1.5 0 016 18.75v-15zM9 3.75v16.5M11.5 8.25h4M11.5 12h4M11.5 15.75h2.5"/></svg></div><p class="mb-3 text-[10px] font-bold tracking-[.34em] text-gold">${copy("आपकी दुकान की डायरी", "YOUR SHOP DIARY")}</p><h1 class="text-4xl font-bold tracking-tight">Hisaab <span class="text-gold">किताब</span></h1><div class="mx-auto my-6 h-px w-16 bg-gold/70"></div><p class="mx-auto max-w-55 text-sm leading-6 text-[#ead9bc]">${copy("दुकान का रोज़ का हिसाब, एक सुरक्षित जगह पर।", "Your daily shop accounts, safely in one place.")}</p><button id="btn-get-started" class="pressable mt-12 w-full rounded-md bg-[#f7e8c8] px-5 py-4 text-base font-bold text-burgundy-dark shadow-[0_5px_0_rgba(45,10,14,.35)] hover:bg-white">${copy("शुरू करें", "Get started")} →</button></div></main>`;
}

// This first paper page collects the shop name and prevents moving on when it is blank.
function renderShopName(): string {
  return `<main class="diary-shell paper-page flex flex-col">${pageHeader(1)}<section class="mx-7 mt-14 border-l-2 border-margin pl-5"><p class="text-[10px] font-bold tracking-[.22em] text-burgundy">${copy("पहला पन्ना", "FIRST PAGE")}</p><h2 class="mt-3 text-3xl font-bold leading-tight text-ink">${copy("आपकी दुकान का<br>नाम क्या है?", "What is your<br>shop name?")}</h2><p class="mt-3 text-sm leading-6 text-ink-soft">${copy("अपनी दुकान का नाम लिखें।", "Write your shop name.")}</p><label class="mt-10 block text-xs font-bold text-ink-soft" for="input-shop-name">${copy("दुकान का नाम", "SHOP NAME")}</label><input id="input-shop-name" class="mt-2 w-full border-b-2 border-line bg-transparent py-3 text-lg font-medium text-ink outline-none transition focus:border-burgundy" value="${state.shopName}" placeholder="" autocomplete="organization"></section><div class="mt-auto px-7 pb-8"><p class="mb-4 text-center text-xs text-ink-soft">● ○ ○</p><button id="btn-next-1" class="pressable w-full rounded-md bg-burgundy py-4 font-bold text-[#f8edd4] shadow-[0_4px_0_#50171d] disabled:cursor-not-allowed disabled:opacity-40" ${state.shopName.trim() ? "" : "disabled"}>${copy("आगे बढ़ें", "Continue")} →</button></div></main>`;
}

// This page uses large checkboxes so choosing products is comfortable on a phone.
function renderProducts(): string {
  const choices = PRODUCTS.map(
    (product) =>
      `<label class="product-choice flex cursor-pointer items-center gap-4 rounded-md border border-line bg-paper/70 px-4 py-3.5 transition hover:bg-white"><input class="h-5 w-5 accent-burgundy" type="checkbox" value="${product.id}" ${state.selectedProducts.includes(product.id) ? "checked" : ""}><span class="font-bold text-ink">${state.language === "hi" ? product.hindiName : product.name}</span><span class="text-xs text-ink-soft">${state.language === "hi" ? product.name : product.hindiName}</span></label>`,
  ).join("");
  return `<main class="diary-shell paper-page flex flex-col">${pageHeader(2)}<section class="mx-7 mt-5 border-l-2 border-margin pl-5"><p class="text-[10px] font-bold tracking-[.22em] text-burgundy">${copy("दूसरा पन्ना", "SECOND PAGE")}</p><h2 class="mt-3 text-3xl font-bold leading-tight text-ink">${copy("आप क्या<br>बेचते हैं?", "What do you<br>sell?")}</h2><p class="mt-3 text-sm text-ink-soft">${copy("अपनी दुकान की चीज़ें चुनें।", "Choose the items in your shop.")}</p></section><div id="product-list" class="hide-scrollbar mx-7 mt-7 flex-1 space-y-2 overflow-auto pb-4">${choices}</div><div class="px-7 pb-8 pt-4"><p class="mb-4 text-center text-xs text-ink-soft">○ ● ○</p><button id="btn-next-2" class="pressable w-full rounded-md bg-burgundy py-4 font-bold text-[#f8edd4] shadow-[0_4px_0_#50171d]">${copy("आगे बढ़ें", "Continue")} →</button></div></main>`;
}

// This final onboarding page accepts only digits and enables its button at ten digits.
function renderPhone(): string {
  return `<main class="diary-shell paper-page flex flex-col">${pageHeader(3)}<section class="mx-7 mt-14 border-l-2 border-margin pl-5"><p class="text-[10px] font-bold tracking-[.22em] text-burgundy">${copy("तीसरा पन्ना", "THIRD PAGE")}</p><h2 class="mt-3 text-3xl font-bold leading-tight text-ink">${copy("लॉगिन के लिए<br>नंबर डालें", "Enter a number<br>to log in")}</h2><p class="mt-3 text-sm leading-6 text-ink-soft">${copy("इसी नंबर से आप फिर अपना खाता खोल सकेंगे।", "Use this number to open your account again.")}</p><label class="mt-10 block text-xs font-bold text-ink-soft" for="input-phone">${copy("मोबाइल नंबर", "MOBILE NUMBER")}</label><div class="mt-2 flex items-center gap-3 border-b-2 border-line focus-within:border-burgundy"><span class="font-bold text-burgundy">+91</span><input id="input-phone" class="w-full bg-transparent py-3 text-lg font-medium tracking-[.1em] text-ink outline-none" value="${state.phoneNumber}" inputmode="numeric" maxlength="10" placeholder="" autocomplete="tel"></div></section><div class="mt-auto px-7 pb-8"><p class="mb-4 text-center text-xs text-ink-soft">○ ○ ●</p><button id="btn-start" class="pressable w-full rounded-md bg-burgundy py-4 font-bold text-[#f8edd4] shadow-[0_4px_0_#50171d] disabled:cursor-not-allowed disabled:opacity-40" ${state.phoneNumber.length === 10 ? "" : "disabled"}>${copy("डायरी खोलें", "Open diary")} →</button></div></main>`;
}

// The dashboard uses a ledger table instead of generic summary cards, continuing the diary metaphor.
function renderDashboard(): string {
  const total = state.orders.reduce(
    (sum, order) => sum + (order.price ?? 0) * order.quantity,
    0,
  );
  const due = state.orders
    .filter((order) => order.status === "unpaid")
    .reduce((sum, order) => sum + (order.price ?? 0) * order.quantity, 0);
  const entries = state.orders
    .map(
      (order) =>
        `<div class="grid grid-cols-[1.15fr_.95fr_.55fr] gap-2 border-b border-line/70 px-3 py-3 last:border-0"><div><p class="text-sm font-bold">${order.customerName}</p><p class="text-[10px] text-ink-soft">${order.timestamp}</p></div><p class="text-sm">${order.quantity} ${state.language === "hi" ? order.productName : PRODUCTS.find(product => product.hindiName === order.productName)?.name ?? order.productName}</p><p class="text-right text-sm font-bold ${order.status === "paid" ? "text-paid" : "text-due"}">₹${(order.price ?? 0) * order.quantity}<br><span class="text-[10px] font-medium">${order.status === "paid" ? copy("चुका", "paid") : copy("उधार", "due")}</span></p></div>`,
    )
    .join("");
  return `<main class="diary-shell paper-page flex flex-col"><header class="border-b border-burgundy-dark bg-burgundy px-6 py-5 text-[#f8edd4]"><div class="flex items-start justify-between"><p class="text-[10px] font-bold tracking-[.22em] text-gold">${copy("आज की खाता-बही", "TODAY'S LEDGER")}</p>${languageButton(true)}</div><div class="mt-1 flex items-end justify-between"><h1 class="text-2xl font-bold">${state.shopName || copy("मेरी दुकान", "My shop")}</h1><span class="text-xs text-[#e6cfa6]">${today()}</span></div></header><section class="mx-5 mt-5 border border-line bg-[#f8f1e2]/90 p-4 shadow-[3px_4px_0_rgba(106,84,53,.12)]"><p class="text-[10px] font-bold tracking-[.18em] text-ink-soft">${copy("आज का हिसाब", "TODAY'S TOTAL")}</p><div class="mt-3 grid grid-cols-3 divide-x divide-line text-center"><div><p class="text-xl font-bold">${state.orders.length}</p><p class="text-[11px] text-ink-soft">${copy("ऑर्डर", "orders")}</p></div><div><p class="text-xl font-bold text-paid">₹${total}</p><p class="text-[11px] text-ink-soft">${copy("कुल", "total")}</p></div><div><p class="text-xl font-bold text-due">₹${due}</p><p class="text-[11px] text-ink-soft">${copy("उधार", "due")}</p></div></div></section><section class="mx-5 mt-6 flex-1 overflow-auto pb-22"><div class="mb-3 flex items-end justify-between"><h2 class="text-lg font-bold">${copy("आज की एंट्री", "Today's entries")}</h2><span class="text-xs text-ink-soft">${copy("ग्राहक • ऑर्डर • समय", "customer • order • time")}</span></div><div class="border-y border-line bg-[#f8f1e2]/65"><div class="grid grid-cols-[1.15fr_.95fr_.55fr] gap-2 border-b border-line px-3 py-2 text-[10px] font-bold tracking-wide text-ink-soft"><span>${copy("ग्राहक", "CUSTOMER")}</span><span>${copy("ऑर्डर", "ORDER")}</span><span class="text-right">${copy("राशि", "AMOUNT")}</span></div>${entries}</div></section><button id="btn-add-order" class="pressable absolute bottom-19 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-3xl text-[#f8edd4] shadow-[0_4px_0_#50171d]" aria-label="${copy("नया ऑर्डर जोड़ें", "Add new order")}">+</button><nav class="grid grid-cols-4 border-t border-line bg-[#f8f1e2] text-center text-[11px]"><button class="pressable py-3 font-bold text-burgundy">${copy("खाता", "Ledger")}</button><button class="pressable py-3 text-ink-soft">${copy("ऑर्डर", "Orders")}</button><button class="pressable py-3 text-ink-soft">${copy("ग्राहक", "Customers")}</button><button class="pressable py-3 text-ink-soft">${copy("सेटिंग्स", "Settings")}</button></nav></main>`;
}

// attachListeners is called after every render because replaced HTML loses its old event listeners.
function attachListeners(page: string): void {
  // Rebuild only the visible page after a language change; state keeps all typed values.
  $("#btn-language")?.addEventListener("click", () => {
    state.language = state.language === "hi" ? "en" : "hi";
    const current = $(".page");
    if (!current) return;
    current.innerHTML = renderPage(state.currentPage);
    attachListeners(state.currentPage);
  });
  if (page === "cover") {
    $("#btn-get-started")?.addEventListener("click", () =>
      navigateTo("onboarding-1"),
    );
    return;
  }
  $("#btn-back")?.addEventListener("click", goBack);
  if (page === "onboarding-1") {
    const input = $("#input-shop-name") as HTMLInputElement | null;
    const next = $("#btn-next-1") as HTMLButtonElement | null;
    input?.addEventListener("input", () => {
      state.shopName = input.value;
      if (next) next.disabled = !input.value.trim();
    });
    next?.addEventListener("click", () => {
      if (state.shopName.trim()) navigateTo("onboarding-2");
    });
    window.setTimeout(() => input?.focus(), 100);
  }
  if (page === "onboarding-2") {
    $$("#product-list input").forEach((element) =>
      element.addEventListener("change", () => {
        const input = element as HTMLInputElement;
        state.selectedProducts = input.checked
          ? [...new Set([...state.selectedProducts, input.value])]
          : state.selectedProducts.filter((id) => id !== input.value);
      }),
    );
    $("#btn-next-2")?.addEventListener("click", () =>
      navigateTo("onboarding-3"),
    );
  }
  if (page === "onboarding-3") {
    const input = $("#input-phone") as HTMLInputElement | null;
    const start = $("#btn-start") as HTMLButtonElement | null;
    input?.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "");
      state.phoneNumber = input.value;
      if (start) start.disabled = input.value.length !== 10;
    });
    start?.addEventListener("click", () => {
      if (state.phoneNumber.length === 10) navigateTo("dashboard");
    });
    window.setTimeout(() => input?.focus(), 100);
  }
  if (page === "dashboard")
    $("#btn-add-order")?.addEventListener("click", () =>
      alert(copy("नया ऑर्डर जोड़ने का विकल्प अगले प्रयोग में आएगा।", "Adding an order will be available in the next experiment.")),
    );
}

// init runs once when Vite loads the app and draws the cover screen.
function init(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  app.innerHTML = `<div id="page-container" class="relative min-h-[100dvh] overflow-hidden"><section class="page absolute inset-0">${renderCover()}</section></div>`;
  attachListeners("cover");
}
init();
