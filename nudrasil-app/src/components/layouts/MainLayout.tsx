"use client";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { Menu, Home, Settings, Leaf, ChevronDown } from "lucide-react";

import { DialogTitle } from "@components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Button } from "@components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@components/ui/sheet";

export default function DefaultLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const configItems = [
    { href: "/admin/boards", label: "Boards", icon: Settings },
    { href: "/admin/board-configs", label: "Board Config", icon: Settings },
    { href: "/admin/sensors", label: "Sensors", icon: Settings },
    { href: "/admin/sensor-types", label: "Sensor Types", icon: Settings },
  ];

  const mobileNavItems = (
    <>
      <Button
        variant="ghost"
        className="justify-start"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Home className="h-4 w-4 mr-2" />
        <Link href="/">Dashboard</Link>
      </Button>
      {configItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            variant="ghost"
            className="justify-start"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4 mr-2" />
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen">
      {/* top navigation */}
      <header className="bg-background border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">Plant Monitor</span>
          </div>

          {/* desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {configItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* mobile menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <DialogTitle className="mb-6"></DialogTitle>
                <nav className="flex flex-col gap-2 pl-6">{mobileNavItems}</nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* main content */}
      <main>{children}</main>
    </div>
  );
}
