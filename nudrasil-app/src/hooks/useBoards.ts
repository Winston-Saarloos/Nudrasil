import { useQuery } from "@tanstack/react-query";
import { fetchBoards } from "@/controllers/boardsController";

export const useBoards = () => {
  const result = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      return await fetchBoards();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};
