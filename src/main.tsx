// main.tsx — the React entry point.
//
// In Experiment 1, main.ts called init() which manually created DOM elements.
// Now, React takes over: createRoot() creates a React root inside the #app div,
// and render() tells React to render the App component into that root.
//
// ShopProvider wraps App so that the entire component tree has access
// to the shop context (shopName, products, orders, language, navigation).

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShopProvider } from "./context/ShopContext";
import App from "./App";
import "./index.css";

// find the #app div from index.html
const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element #app not found");

// createRoot is React 18's way of starting a React app (replaces the old ReactDOM.render).
createRoot(rootElement).render(
  <StrictMode>
    <ShopProvider>
      <App />
    </ShopProvider>
  </StrictMode>
);
