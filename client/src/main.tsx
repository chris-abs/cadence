import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installSessionGuard } from "@/features/auth";
import { createQueryClient } from "@/lib/query-client";
import { createAppRouter } from "./router";
import "./index.css";

async function startMockApi() {
  // Dev-only: `import.meta.env.DEV` is false in production builds, so the mock
  // and MSW are dropped from the bundle entirely.
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_API === "1") {
    const { startMockWorker } = await import("./mocks/browser");
    await startMockWorker();
  }
}

await startMockApi();

const queryClient = createQueryClient();
installSessionGuard(queryClient);
const router = createAppRouter(queryClient);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
