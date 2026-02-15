"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Provider de React Query. Envuelve la app para que useQuery y useMutation estén disponibles.
 *
 * QueryClient se crea una sola vez por montaje (useState con función inicial)
 * para no perder la caché en cada re-render.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // No refetch en cada foco de ventana por defecto (puedes cambiarlo)
            refetchOnWindowFocus: false,
            // Reintentos en caso de error (útil para red inestable)
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
