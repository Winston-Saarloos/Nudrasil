import { useQuery } from "@tanstack/react-query";

import { validateAdminSecret } from "@/controllers/adminController";

interface AdminSecretData {
  secret: string;
  isValid: boolean;
}

const fetchAdminSecretValidation = async (
  secret: string,
): Promise<AdminSecretData> => {
  try {
    const isValid = await validateAdminSecret(secret);
    return { secret, isValid };
  } catch (error) {
    console.error("Admin secret validation error:", error);
    return { secret, isValid: false };
  }
};

const useAdminSecretValidation = (secret: string) => {
  const result = useQuery({
    queryKey: ["adminSecret", secret],
    queryFn: async () => fetchAdminSecretValidation(secret),
    enabled: !!secret.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};

export default useAdminSecretValidation;
