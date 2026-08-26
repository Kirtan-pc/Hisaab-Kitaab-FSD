import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for React — enables JSX transformation and fast refresh.
export default defineConfig({
  plugins: [react()],
});
