"use client";

import { useState, useEffect } from "react";

const ADMIN_SECRET_STORAGE_KEY = "adminSecret";
const ADMIN_SECRET_CHANGE_EVENT = "adminSecretChange";

export function useAdminSecret() {
  const [secret, setSecret] = useState<string>("");

  useEffect(() => {
    const storedSecret = sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY);
    if (storedSecret) {
      setSecret(storedSecret);
    }

    const handleSecretChange = () => {
      const updatedSecret = sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY);
      setSecret(updatedSecret || "");
    };

    window.addEventListener(ADMIN_SECRET_CHANGE_EVENT, handleSecretChange);

    return () => {
      window.removeEventListener(ADMIN_SECRET_CHANGE_EVENT, handleSecretChange);
    };
  }, []);

  const updateSecret = (newSecret: string) => {
    setSecret(newSecret);
    if (typeof window !== "undefined") {
      if (newSecret) {
        sessionStorage.setItem(ADMIN_SECRET_STORAGE_KEY, newSecret);
      } else {
        sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
      }

      window.dispatchEvent(new CustomEvent(ADMIN_SECRET_CHANGE_EVENT));
    }
  };

  const clearSecret = () => {
    setSecret("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);

      window.dispatchEvent(new CustomEvent(ADMIN_SECRET_CHANGE_EVENT));
    }
  };

  return {
    secret,
    setSecret: updateSecret,
    clearSecret,
  };
}
