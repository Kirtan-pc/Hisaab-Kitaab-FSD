# FSD — Hisaab किताब

> A complete walkthrough: from an empty folder to the running diary-style shop app you see today.

---

## 0. Where Did We Start?

We started with a **real-world problem**: the founder's father runs a tea canteen (Shankar Tea Stall) and tracks orders/dues in a paper diary. Tea spills, wet hands, fast counter rush — the diary gets messy, typing on phone is too slow.

**The idea**: A web app that logs orders via **voice** or **typing** — a digital khata (ledger) for small Indian shops.

**The assignment**: Map this app to 10 FSD lab experiments, starting from Experiment 1 (Responsive UI with Tailwind CSS).

---

## 1. Project Scaffolding — Vite + TypeScript

### What we did

We created the `hisaab-kitaab` project using **Vite** with TypeScript support.

### Commands run

```bash
# Create project (inside FSD folder)
npm create vite@latest hisaab-kitaab -- --template vanilla-ts

# Enter the project
cd hisaab-kitaab

# Install dependencies
npm install
```

### What this gave us

```
hisaab-kitaab/
├── index.html          ← Entry point (Vite serves this)
├── package.json        ← Project config + dependencies
├── tsconfig.json       ← TypeScript rules
├── src/
│   ├── main.ts         ← Our app logic (vanilla TS for now)
│   └── style.css       ← Our styles
└── vite.config.ts      ← (if it existed)
```

### Key config files explained

**`package.json`** — lists what the project needs:

- `vite` — dev server + build tool (fast, modern)
- `typescript` — type checking
- `tailwindcss` — utility CSS framework
- `@tailwindcss/postcss` + `autoprefixer` — Tailwind's CSS processing pipeline

**`tsconfig.json`** — tells TypeScript how to check code:

- `target: "es2023"` — output modern JavaScript
- `module: "esnext"` — use ES module imports
- `noEmit: true` — TypeScript only checks, Vite does the bundling
- `noUnusedLocals: true` — error if you declare a variable you never use

---

## 2. Tailwind CSS Setup — The Styling Engine

### What we did

Installed and configured Tailwind CSS v4 (the latest, zero-config version).

### Commands run

```bash
npm install -D tailwindcss @tailwindcss/postcss autoprefixer
```

### How it works

**`postcss.config.js`** — connects Tailwind to Vite's CSS pipeline:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**`src/style.css`** — first line imports Tailwind:

```css
@import "tailwindcss";
```

That single import gives you **every** Tailwind utility class: `p-4`, `bg-red-500`, `grid-cols-3`, `text-lg`, etc.

### Custom theme (the diary colours)

We defined a custom theme block right inside `style.css` (Tailwind v4 feature):

```css
@theme {
  --color-paper: #f4eddd; /* notebook page colour */
  --color-burgundy: #75252b; /* diary cover / accent */
  --color-ink: #252725; /* text colour */
  --color-gold: #d6b15b; /* decorative gold */
  --color-paid: #397053; /* green for paid */
  --color-due: #a34c42; /* red for due */
  --color-line: #cfc3ad; /* border/divider lines */
  --color-margin: #c8827f; /* notebook margin line */
}
```

This means classes like `bg-paper`, `text-ink`, `text-paid`, `border-line` now work everywhere.

---

## 3. The HTML Shell — `index.html`

### What we did

Set up a minimal HTML page that Vite can process.

```html
<!doctype html>
<html lang="hi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <meta name="theme-color" content="#722f37" />
    <title>Hisaab किताब — आपकी दुकान का हिसाब</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### Key decisions

| Choice                 | Why                                                                 |
| ---------------------- | ------------------------------------------------------------------- |
| `lang="hi"`            | Hindi is the primary language for the target users                  |
| `user-scalable=no`     | Prevents accidental zoom on mobile (shop counter use)               |
| `theme-color: #722f37` | Chrome mobile address bar matches the diary burgundy                |
| `#app` div             | Single mount point — all UI is rendered by JavaScript into this div |
| `type="module"`        | Vite needs this to process TypeScript imports                       |

---

## 4. The CSS — Making It Look Like a Real Diary

### What we did

Wrote `src/style.css` with a combination of Tailwind utilities and custom CSS that creates the physical diary aesthetic.

### The diary metaphor in CSS

**Cover page** (the first screen you see):

```css
.diary-cover {
  background-color: #75252b; /* burgundy leather */
  background-image:
    linear-gradient(90deg, rgba(0, 0, 0, 0.26) 0 15px, ...),
    /* left binding shadow */
    radial-gradient(circle at 80% 10%, rgba(214, 177, 91, 0.12) 0 2px, ...),
    /* gold speckle texture */
    linear-gradient(135deg, #8c3439, #661e26 55%, #4e151c); /* leather gradient */
}
```

**Paper pages** (onboarding + dashboard):

```css
.paper-page {
  background-color: #f4eddd; /* cream paper */
  background-image:
    linear-gradient(
      90deg,
      transparent 0,
      transparent 53px,
      rgba(200, 130, 127, 0.55) 53px,
      rgba(200, 130, 127, 0.55) 55px,
      transparent 55px
    ),
    /* red margin line */
    repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 34px,
        rgba(126, 112, 90, 0.14) 34px,
        rgba(126, 112, 90, 0.14) 35px
      ); /* ruled lines */
}
```

**Stitched border** on cover:

```css
.cover-stitching::before,
.cover-stitching::after {
  content: "";
  border-top: 1px dashed rgba(214, 177, 91, 0.45); /* gold dashed line */
}
```

**Touch feedback** (big buttons for mobile):

```css
.pressable {
  transition:
    transform 0.16s ease,
    ...;
}
.pressable:active {
  transform: translateY(1px) scale(0.985);
}
```

**Page-turn animation**:

```css
@keyframes page-in-right { from { opacity: .45; transform: translateX(18%); } ... }
@keyframes page-out-left  { from { opacity: 1; transform: translateX(0); } ... }
```

**Desktop constraint** — on wide screens, the app stays notebook-width:

```css
@media (min-width: 700px) {
  body {
    padding: 24px;
  }
  #app {
    max-width: 450px;
    margin: 0 auto;
    box-shadow: 0 20px 55px rgba(54, 41, 26, 0.28);
  }
}
```

---

## 5. The TypeScript App — `src/main.ts`

### What we did

Wrote the entire app logic in vanilla TypeScript (no React yet — Experiment 1 uses plain TS + browser events).

### Architecture overview

```
init()                    ← runs once on page load
  └── renders cover screen
        └── "शुरू करें" button → navigateTo("onboarding-1")
              └── "आगे बढ़ें" → navigateTo("onboarding-2")
                    └── "आगे बढ़ें" → navigateTo("onboarding-3")
                          └── "डायरी खोलें" → navigateTo("dashboard")
```

### State management (beginner-friendly)

One global object holds everything:

```ts
const state: AppState = {
  currentPage: "cover",
  history: [],         // for back button
  language: "hi",      // Hindi or English
  shopName: "",
  selectedProducts: ["chai", "coffee", "ukala"],
  phoneNumber: "",
  orders: [ ... ],     // sample ledger data
};
```

### Navigation system

```ts
function navigateTo(page: string): void {
  state.history.push(state.currentPage); // save current for back button
  movePage(page, "forward"); // animate + render new page
}

function goBack(): void {
  const previous = state.history.pop();
  if (previous) movePage(previous, "back"); // animate reverse
}
```

### Page rendering

Each screen is a function that returns an HTML string:

- `renderCover()` — the diary front cover
- `renderShopName()` — Step 1: enter shop name
- `renderProducts()` — Step 2: pick your products (checkboxes)
- `renderPhone()` — Step 3: enter mobile number
- `renderDashboard()` — The main ledger view with orders

### Language toggle

The `copy()` function returns Hindi or English text:

```ts
function copy(hindi: string, english: string): string {
  return state.language === "hi" ? hindi : english;
}
```

Used everywhere: `copy("शुरू करें", "Get started")`

### Event listeners (re-attached after every render)

```ts
function attachListeners(page: string): void {
  // Language button — rebuilds current page in new language
  $("#btn-language")?.addEventListener("click", () => {
    state.language = state.language === "hi" ? "en" : "hi";
    // re-render current page
  });
  // Page-specific listeners (input validation, navigation, etc.)
}
```

### Helper utilities

```ts
const $ = (s) => document.querySelector(s);     // find one element
const $$ = (s) => [...document.querySelectorAll(s)];  // find all elements
const today = () => new Date().toLocaleDateString("hi-IN", { ... });  // Indian date format
```

---

## 6. The Dashboard — Today's Ledger

The dashboard (`renderDashboard()`) is the core screen:

```
┌─────────────────────────────────┐
│  आज की खाता-बही     [English]  │  ← burgundy header
│  Shankar Tea Stall    Mon, 19   │
├─────────────────────────────────┤
│  आज का हिसाब                     │  ← summary card (paper)
│  4 orders  │  ₹95 total │ ₹70 due│
├─────────────────────────────────┤
│  ग्राहक      ऑर्डर     राशि      │  ← column headers
│  ─────────────────────────────  │
│  मनोज      1 चाय      ₹10 चुका  │  ← order rows
│  रमेश       2 कॉफी    ₹40 उधार  │
│  पियुष      1 उकाला    ₹15 चुका  │
│  अनिल       3 चाय      ₹30 उधार  │
├─────────────────────────────────┤
│                              [+] │  ← floating add button
└─────────────────────────────────┘
```

Key Tailwind classes used:

- `grid grid-cols-[1.15fr_.95fr_.55fr]` — asymmetric column layout for the ledger table
- `divide-x divide-line` — vertical dividers between stats
- `shadow-[3px_4px_0_rgba(106,84,53,.12)]` — subtle paper shadow
- `bg-burgundy text-[#f8edd4]` — dark header with cream text

---

## 7. The Build — Production Output

### Commands run

```bash
npm run build    # runs: tsc && vite build
```

### What happens

1. `tsc` — TypeScript checks all code for type errors (no output files, just validation)
2. `vite build` — bundles everything into optimised files

### Output in `dist/`

```
dist/
├── index.html                    ← minified HTML
├── assets/
│   ├── index-CbDE475g.js        ← all TypeScript → bundled JS (hashed name)
│   └── index-DDm65uzn.css       ← all Tailwind → single CSS file (hashed name)
├── favicon.svg
└── icons.svg
```

The hash in filenames (`CbDE475g`) ensures browsers always get fresh files when you rebuild.

---

## 8. What Experiment 1 Covers (FSD Mapping)

| FSD Concept         | How it's implemented                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| Responsive Design   | Tailwind breakpoints (`md:grid-cols-2`), mobile-first layout           |
| CSS Framework       | Tailwind CSS v4 with custom `@theme` colours                           |
| Utility-first CSS   | All styling via Tailwind classes in HTML strings                       |
| Component structure | Each page is a function returning HTML (precursor to React components) |
| State management    | Single `state` object (precursor to React state / Redux)               |
| DOM manipulation    | `querySelector`, `addEventListener`, `innerHTML`                       |
| Event handling      | Button clicks, input changes, form validation                          |
| Mobile UX           | Large touch targets (48px+), `user-scalable=no`, touch feedback        |
| Accessibility       | `:focus-visible` outlines, `aria-label` on icon buttons                |
| Animation           | CSS keyframes for page-turn effect, reduced-motion support             |

---

## 9. Concepts We'll Learn Next (Future Experiments)

| #     | Topic               | Where in Hisaab किताब                                                                             |
| ----- | ------------------- | ------------------------------------------------------------------------------------------------- |
| ~~2~~ | ~~React Hooks~~     | ✅ Done — `useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`, `useRef`, custom hooks |
| 3     | Redux / Context API | Global state for products, customers, live order feed                                             |
| 4     | REST API + MongoDB  | CRUD for Shop, Product, Customer, Order, Payment                                                  |
| 5     | Secure REST APIs    | Server-side validation of voice/typed input                                                       |
| 6     | JWT Authentication  | Shop owner registration + login (multi-tenant)                                                    |
| 7     | Docker              | Separate Dockerfiles for client and server                                                        |
| 8     | WebSockets          | Real-time order feed across devices                                                               |
| 9     | Docker Compose      | `docker-compose up` → client + server + MongoDB                                                   |
| 10    | CI/CD               | GitHub Actions: lint → build → push → deploy                                                      |

---

## 10. Quick Reference — Commands

```bash
# Development
npm run dev          # Start Vite dev server (hot reload)

# Build
npm run build        # Type-check + produce dist/ folder

# Preview production build
npm run preview      # Serve dist/ locally to test production build

# Install dependencies (first time)
npm install          # Read package.json + install everything
```

---

## 11. The Design Philosophy

1. **Mobile-first**: Shopkeepers use phones with wet hands → big buttons, no tiny text
2. **Hindi-first**: UI labels in Hindi (the language they think in) with English toggle
3. **Diary metaphor**: Every screen looks like a page in a physical ledger
4. **Price optional**: Voice input can't reliably say prices → always optional
5. **Free tools only**: Web Speech API, MongoDB Atlas free tier, Vercel/Render free hosting
6. **Multi-tenant from day one**: Each shop owner only sees their own data

---

## 12. Experiment 2 — React Hooks

### What we did

Converted the entire vanilla TypeScript app (Experiment 1) to React. Each page became a React component, and we introduced three key hooks: `useState`, `useEffect`, and `useContext`. We also created three custom hooks.

### What is useState?

`useState` is a React hook that lets a component "remember" values between renders.

```tsx
const [shopName, setShopName] = useState("");
```

- `shopName` is the current value (starts as `""`)
- `setShopName` is a function to update it
- When `setShopName("Shankar Tea Stall")` is called, React re-renders the component with the new value

In Experiment 1, we had `state.shopName` — one big object. In React, each component manages its own piece of state with `useState`.

### What is useEffect?

`useEffect` runs code AFTER a component renders — for things that React can't handle directly (like updating the browser tab title, or talking to localStorage).

```tsx
useEffect(() => {
  document.title = shopName ? `${shopName} — Hisaab किताब` : "Hisaab किताब";
}, [shopName]);
```

- The first argument is the function to run
- The second argument `[shopName]` is the "dependency array" — React runs this effect only when `shopName` changes
- Empty array `[]` = run once on mount (like `init()` in Experiment 1)

#### useEffect Cleanup

Sometimes an effect creates a resource that needs cleanup (like a timer, event listener, or speech recognition session). You return a **cleanup function** from useEffect:

```tsx
useEffect(() => {
  const recognition = new SpeechRecognition();
  recognition.start();

  // Return a cleanup function — React calls this when the component unmounts
  return () => {
    recognition.abort();
  };
}, []);
```

**Why cleanup matters:** Without it, speech recognition would keep running after the component disappears, causing memory leaks and errors.

**When to use cleanup:**

- Timers (`setInterval`, `setTimeout`)
- Event listeners (`addEventListener`)
- WebSocket connections
- Speech recognition / media streams
- Any subscription

**Where in Hisaab किताब:** `useSpeechRecognition` returns `() => recognitionRef.current?.abort()` in its useEffect cleanup, so the mic stops listening when the component unmounts.

### What is useContext?

`useContext` lets any component read data from a shared "context" without passing props through every parent.

**Without context (prop drilling):**

```
App → CoverPage → Button → needs shopName
```

You'd have to pass `shopName` through every parent, even if they don't use it.

**With context:**

```
ShopProvider wraps App
CoverPage calls useShop() → gets shopName directly
```

### What is useCallback?

`useCallback` memoizes a function so it doesn't get recreated on every render. Without it, a new function reference is created each time, which can cause child components to re-render unnecessarily.

```tsx
const navigateTo = useCallback(
  (page: string) => {
    setHistory((prev) => [...prev, currentPage]);
    setCurrentPage(page);
  },
  [currentPage],
);
```

- The function is only recreated when `currentPage` changes
- Used in ShopContext for `navigateTo`, `goBack`, `toggleProduct`, `copy`

### What is useMemo?

`useMemo` caches a computed VALUE (not a function). It only recalculates when its dependencies change.

```tsx
const total = useMemo(
  () =>
    orders.reduce((sum, order) => sum + (order.price ?? 0) * order.quantity, 0),
  [orders],
);
```

- Without useMemo, `total` would recalculate on every render even if orders didn't change
- Used in Dashboard to cache the `total` and `due` calculations

### What is useRef?

`useRef` creates a mutable reference that persists across re-renders WITHOUT causing re-renders itself. Unlike useState, changing a ref doesn't trigger a re-render.

```tsx
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus(); // Direct DOM access
}, []);
```

- Used for auto-focusing inputs in OnboardingShopName and OnboardingPhone
- Also used in useSpeechRecognition to hold the SpeechRecognition instance

### What are Custom Hooks?

Custom hooks are regular JavaScript functions that start with `use` and can call other hooks inside them. They let you extract reusable logic.

We created three custom hooks:

1. **`useLocalStorage`** — persists state in browser's localStorage (survives page reload)
2. **`useSpeechRecognition`** — wraps the Web Speech API for voice input
3. **`useNavigation`** — manages page transitions and history (partially done via context)

### Where is it used in Hisaab किताब?

- `ShopContext` holds shop name, products, orders, language, navigation — all shared data
- `useSpeechRecognition` will be used when the shopkeeper taps the mic button
- `useEffect` updates the browser tab title when the shop name changes
- Each onboarding page (CoverPage, OnboardingShopName, OnboardingProducts, OnboardingPhone) is now a separate React component

### Key files created/modified

| File                                    | Purpose                                             |
| --------------------------------------- | --------------------------------------------------- |
| `src/main.tsx`                          | React entry point (replaced `main.ts`)              |
| `src/App.tsx`                           | Root component — renders pages based on currentPage |
| `src/context/ShopContext.tsx`           | Global state via useContext                         |
| `src/hooks/useLocalStorage.ts`          | Custom hook — localStorage persistence              |
| `src/hooks/useSpeechRecognition.ts`     | Custom hook — Web Speech API wrapper                |
| `src/components/CoverPage.tsx`          | Diary cover page                                    |
| `src/components/OnboardingShopName.tsx` | Step 1: enter shop name                             |
| `src/components/OnboardingProducts.tsx` | Step 2: select products                             |
| `src/components/OnboardingPhone.tsx`    | Step 3: enter phone number                          |
| `src/components/Dashboard.tsx`          | Main ledger view                                    |
| `src/types.ts`                          | Shared TypeScript interfaces                        |
| `src/speech-recognition.d.ts`           | Type declarations for Web Speech API                |
| `vite.config.ts`                        | Vite config with React plugin                       |

---

## 13. Hooks Used in Hisaab किताब — Quick Reference

| Hook          | File                      | What it does                                             |
| ------------- | ------------------------- | -------------------------------------------------------- |
| `useState`    | `ShopContext.tsx`         | Manages shopName, language, products, phone, navigation  |
| `useEffect`   | `ShopContext.tsx`         | Updates `document.title` when shopName changes           |
| `useEffect`   | `OnboardingShopName.tsx`  | Auto-focuses the shop name input on mount                |
| `useEffect`   | `OnboardingPhone.tsx`     | Auto-focuses the phone input on mount                    |
| `useEffect`   | `useSpeechRecognition.ts` | Cleans up speech recognition on unmount                  |
| `useEffect`   | `useLocalStorage.ts`      | Writes value to localStorage when it changes             |
| `useCallback` | `ShopContext.tsx`         | Memoizes `navigateTo`, `goBack`, `toggleProduct`, `copy` |
| `useMemo`     | `Dashboard.tsx`           | Caches `total` and `due` calculations from orders        |
| `useRef`      | `OnboardingShopName.tsx`  | Holds input element reference for auto-focus             |
| `useRef`      | `OnboardingPhone.tsx`     | Holds input element reference for auto-focus             |
| `useRef`      | `useSpeechRecognition.ts` | Holds SpeechRecognition instance across re-renders       |
| `useContext`  | All components            | Accesses ShopContext via `useShop()` custom hook         |

---

_Last updated: Experiment 2 (React Hooks) — React + useState + useEffect + useContext + useCallback + useMemo + useRef + custom hooks._

---

# Experiment 3 — Complex State Management

## Experiment Aim

Use Context API to manage shared Hisaab किताब order data and demonstrate a controlled order form.

## Exact Code Locations

`hisaab-kitaab/src/context/AppContext.tsx`
→ Creates `AppContext`, stores products, customers, and orders, and defines `AppProvider`, `addOrder()`, and `removeOrder()`.

`hisaab-kitaab/src/main.tsx`
→ Wraps `<App />` inside `<AppProvider>` so child components can access the shared state.

`hisaab-kitaab/src/components/OrderEntry.tsx`
→ Uses `useAppContext()`, controls the customer/product/quantity/price inputs, validates them in `handleSubmit()`, and calls `addOrder()`.

`hisaab-kitaab/src/components/Dashboard.tsx`
→ Uses `useAppContext()`, displays the shared order count and ledger, and calls `removeOrder()`.

`hisaab-kitaab/src/App.tsx`
→ Preserves the cover and three-step onboarding flow, then opens the dashboard with the entered shop name.

## What is Context API?

Context lets React components read shared data without passing it through every intermediate component. Here, the shared data is the shop ledger.

## How does it work?

`createContext()` creates the shared channel → `AppProvider` stores the state → `useContext()` reads it → `OrderEntry` changes it → `Dashboard` updates automatically.

## Global State and Actions

The provider stores products, customers, and orders. `addOrder()` creates a customer when needed and adds a pending order. `removeOrder()` removes an order from the ledger. These are meaningful Hisaab किताब actions, not demo-only state.

## Form Handling

`OrderEntry` uses `useState` for each input. The inputs receive values from React state, `onChange` updates that state, and `handleSubmit()` validates the customer name and quantity before calling `addOrder()`.

## Concept → Code → UI Mapping

| Concept          | Actual File                     | Actual Code / Function            | Visible UI                       |
| ---------------- | ------------------------------- | --------------------------------- | -------------------------------- |
| Context creation | `src/context/AppContext.tsx`    | `createContext()`                 | Shared ledger                    |
| Provider         | `src/context/AppContext.tsx`    | `AppProvider`                     | Makes state available            |
| Global state     | `src/context/AppContext.tsx`    | `products`, `customers`, `orders` | Dashboard totals and rows        |
| Action 1         | `src/context/AppContext.tsx`    | `addOrder()`                      | `ऑर्डर जोड़ें` button            |
| Action 2         | `src/context/AppContext.tsx`    | `removeOrder()`                   | `हटाएं` button                   |
| useContext       | `src/context/AppContext.tsx`    | `useAppContext()`                 | Form and dashboard share updates |
| Form state       | `src/components/OrderEntry.tsx` | `useState()` fields               | Visible order form               |
| Form submission  | `src/components/OrderEntry.tsx` | `handleSubmit()`                  | New ledger row                   |

## How to Demonstrate

Open the app → click `शुरू करें` → complete the three onboarding pages → click `+` → enter a customer, item, quantity, and optional price → click `ऑर्डर जोड़ें`. The order count and ledger update. Click `हटाएं` to demonstrate the second action.

## Screenshots to Capture

1. Dashboard before adding an order.
2. Order form with controlled fields before submission.
3. Dashboard after submission showing the new row and increased count.
4. `AppContext.tsx` showing context, provider, state, and actions.
5. `main.tsx` showing the provider wrapping `App`.
6. `OrderEntry.tsx` showing controlled inputs and `handleSubmit()`.

## Viva Explanation

The problem was sharing order data between the order form and dashboard. State is changing application data. I used Context API to avoid prop drilling. `AppContext` is created in `src/context/AppContext.tsx`, and `AppProvider` stores the shared ledger. `addOrder()` and `removeOrder()` modify it. `OrderEntry` and `Dashboard` both use `useAppContext()`, so a form submission changes the dashboard automatically. Form handling uses `useState`, `value`, `onChange`, validation, and `handleSubmit()`.

## What Changed from Experiment 2

The current checkout contained the Experiment 1 vanilla implementation, so this experiment adds the missing React foundation as well. The diary styling and onboarding remain, while order state now has a real Context API owner and visible actions.
