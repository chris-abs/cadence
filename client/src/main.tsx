import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installSessionGuard } from "@/features/auth";
import { createQueryClient } from "@/lib/query-client";
import { createAppRouter } from "./router";
import "./index.css";

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
