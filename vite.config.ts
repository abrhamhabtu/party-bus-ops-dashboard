import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createApi } from "./server/api.mjs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: "local-reveal-api",
      configureServer(server) {
        server.middlewares.use(
          createApi({ ...process.env, ...loadEnv(mode, process.cwd(), "") }),
        );
      },
    },
  ],
}));
