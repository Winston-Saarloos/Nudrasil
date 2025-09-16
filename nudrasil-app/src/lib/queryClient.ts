import { QueryClient, isServer } from "@tanstack/react-query";

function queryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 30 * 1000, // 30 seconds
        retry: 3,
      },
    },
  });
}

let currentQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // always make a new query client on the server
    return queryClient();
  } else {
    if (!currentQueryClient) currentQueryClient = queryClient();
    return currentQueryClient;
  }
}

