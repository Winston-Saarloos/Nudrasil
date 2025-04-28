"use client";
"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";

export default function DefaultLayout({ children }: { children: ReactNode }) {
  const linkButtons = (
    <>
      <Button variant="ghost" className="justify-start">
        <Link href="/">Home</Link>
      </Button>
      <Button variant="ghost" className="justify-start">
        <Link href="/admin/boards">Boards</Link>
      </Button>
      <Button variant="ghost" className="justify-start">
        <Link href="/admin/board-configs">Board Config</Link>
      </Button>
      <Button variant="ghost" className="justify-start">
        <Link href="/admin/sensors">Sensors Config</Link>
      </Button>
      <Button variant="ghost" className="justify-start">
        <Link href="/admin/sensor-types">Sensors Types Config</Link>
      </Button>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Side Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-muted p-4 border-r">
        <div className="mb-6 flex items-center gap-2">
          {/* Inline SVG logo */}
          <span className="text-lg font-bold">Nudrasil</span>
        </div>
        <nav className="flex flex-col gap-2">{linkButtons}</nav>
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
              <DialogTitle></DialogTitle>
              <div className="mb-6 flex items-center gap-2 pl-4">
                <span className="text-lg font-bold">Nudrasil</span>
              </div>
              <nav className="flex flex-col gap-2 pl-6">{linkButtons}</nav>
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
