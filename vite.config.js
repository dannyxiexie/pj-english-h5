import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export const allowedLanHosts = ["dannyxiedemac-mini.local", "DannyXiedeMac-mini.local"];

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: allowedLanHosts
  }
});
