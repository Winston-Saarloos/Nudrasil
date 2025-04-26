"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Side Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-muted p-4 border-r">
        <div className="mb-6 flex items-center gap-2">
          {/* Inline SVG logo */}
          <span className="text-lg font-bold">Nudrasil</span>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/">
            <Button variant="ghost" className="justify-start">
              Home
            </Button>
          </Link>
          <Link href="/admin/boards">
            <Button variant="ghost" className="justify-start">
              Boards
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Header */}
        <header className="flex items-center justify-between p-4 border-b md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="mb-6 flex items-center gap-2">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 545 587"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M489 301.5C565 289..." fill="#206C8D" />
                  <path d="M273.5 112.999C295.5..." fill="#483523" />
                  <ellipse cx="151.5" cy="205" rx="8.5" ry="8" fill="#483523" />
                  <ellipse cx="396.5" cy="205" rx="8.5" ry="8" fill="#483523" />
                </svg>
                <span className="text-lg font-bold">Nudrasil</span>
              </div>
              <nav className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start">
                  Dashboard
                </Button>
                <Button variant="ghost" className="justify-start">
                  Devices
                </Button>
                <Button variant="ghost" className="justify-start">
                  Settings
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <span className="text-lg font-bold">Nudrasil</span>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
