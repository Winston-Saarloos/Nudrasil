import { useQuery } from "@tanstack/react-query";
import { fetchBoardStatus } from "@/controllers/boardsController";

export const useBoardStatus = () => {
  return useQuery({
    queryKey: ["boardStatus"],
    queryFn: fetchBoardStatus,
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 3,
    retryDelay: 1000,
  });
};
