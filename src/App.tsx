// App — the root component that ties everything together.
//
// In Experiment 1, init() chose which page to render based on state.currentPage.
// In React, App does the same thing — but instead of replacing innerHTML,
// it conditionally renders React components based on state.
//
// The ShopProvider wraps the entire app so every component can access
// the shared shop data via useShop().

import { useShop } from "./context/ShopContext";
import CoverPage from "./components/CoverPage";
import OnboardingShopName from "./components/OnboardingShopName";
import OnboardingProducts from "./components/OnboardingProducts";
import OnboardingPhone from "./components/OnboardingPhone";
import Dashboard from "./components/Dashboard";

export default function App() {
  const { currentPage } = useShop();

  // renderPage — same logic as Experiment 1, but returns JSX elements instead of HTML strings.
  // React will mount/unmount components as currentPage changes.
  const renderPage = () => {
    switch (currentPage) {
      case "onboarding-1":
        return <OnboardingShopName />;
      case "onboarding-2":
        return <OnboardingProducts />;
      case "onboarding-3":
        return <OnboardingPhone />;
      case "dashboard":
        return <Dashboard />;
      default:
        return <CoverPage />;
    }
  };

  return (
    <div id="page-container" className="relative min-h-[100dvh] overflow-hidden">
      <section className="page absolute inset-0">
        {renderPage()}
      </section>
    </div>
  );
}
