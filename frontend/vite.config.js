import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function normalizeBasePath(input) {
  const basePath = (input || "/").trim();
  if (!basePath || basePath === "/") return "/";
  const prefixed = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appBasePath = normalizeBasePath(env.VITE_APP_BASE_PATH || "/");
  const apiTarget = (env.VITE_API_URL || "").trim() || "http://localhost:4000";

  return {
    plugins: [react()],
    base: appBasePath,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }

            if (
              id.includes("/react/") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-stack";
            }

            if (id.includes("@dnd-kit")) {
              return "dnd-kit";
            }

            if (id.includes("html5-qrcode") || id.includes("/qrcode/")) {
              return "qr-tools";
            }

            return undefined;
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
