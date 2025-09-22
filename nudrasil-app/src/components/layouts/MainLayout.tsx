"use client";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { Menu, Home, Settings, Leaf, ChevronDown, Github } from "lucide-react";

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

  const configItems: Array<{
    href: string;
    label: string;
    icon?: React.ElementType;
  }> = [
    { href: "/admin/boards", label: "Boards" },
    { href: "/admin/board-configs", label: "Board Config" },
    { href: "/admin/sensors", label: "Sensors" },
    { href: "/admin/sensor-types", label: "Sensor Types" },
  ];

  const mobileNavItems = (
    <>
      <Button
        variant="ghost"
        className="justify-start"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Home className="h-4 w-4" />
        <Link href="/">Dashboard</Link>
      </Button>

      <Button
        variant="ghost"
        className="justify-start"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Link className="ml-5" href="/about">
          About
        </Link>
      </Button>

      <hr />

      {configItems.map((item) => {
        return (
          <Button
            key={item.href}
            variant="ghost"
            className="justify-start"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Settings className="h-4 w-4" />

            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}

      <Button
        variant="outline"
        className="justify-start mr-5"
        asChild
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <a
          href="https://github.com/Winston-Saarloos/Nudrasil"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center"
        >
          <Github className="mr-2 h-5 w-5" />
          GitHub
        </a>
      </Button>
    </>
  );

  return (
    <div className="min-h-screen">
      {/* top navigation */}
      <header className="bg-background border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <Link href="/" className="text-xl font-bold">
              Plant Monitor
            </Link>
          </div>

          {/* desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                Dashboard
              </Link>
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/about" className="flex items-center gap-2">
                About
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
                        {Icon && <Icon className="h-4 w-4" />}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="lg" asChild>
              <a
                href="https://github.com/Winston-Saarloos/Nudrasil"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </a>
            </Button>
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
