"use client";
import { ReactNode } from "react";

import DefaultLayout from "@/components/layouts/MainLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
