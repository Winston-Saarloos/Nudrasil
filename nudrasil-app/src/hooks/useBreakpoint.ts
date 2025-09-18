"use client";

import { useState, useEffect } from "react";

// Similar to MUI's breakpoints
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface BreakpointConfig {
  xs: number; // 0px
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  "2xl": number; // 1536px
}

// Tailwind CSS breakpoints
export const BREAKPOINTS: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Custom hook to detect current breakpoint based on window width
 * Similar to MUI's useMediaQuery but returns the actual breakpoint name
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("lg");

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= BREAKPOINTS["2xl"]) {
        setBreakpoint("2xl");
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint("xl");
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint("lg");
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint("md");
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint("sm");
      } else {
        setBreakpoint("xs");
      }
    };

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Custom hook to check if current breakpoint matches or is above a specific breakpoint
 * Similar to MUI's useMediaQuery(theme.breakpoints.up('md'))
 */
export function useBreakpointUp(targetBreakpoint: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  const currentIndex = Object.keys(BREAKPOINTS).indexOf(currentBreakpoint);
  const targetIndex = Object.keys(BREAKPOINTS).indexOf(targetBreakpoint);

  return currentIndex >= targetIndex;
}

/**
 * Custom hook to check if current breakpoint matches or is below a specific breakpoint
 * Similar to MUI's useMediaQuery(theme.breakpoints.down('md'))
 */
export function useBreakpointDown(targetBreakpoint: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  const currentIndex = Object.keys(BREAKPOINTS).indexOf(currentBreakpoint);
  const targetIndex = Object.keys(BREAKPOINTS).indexOf(targetBreakpoint);

  return currentIndex <= targetIndex;
}

/**
 * Custom hook to check if current breakpoint is between two breakpoints
 * Similar to MUI's useMediaQuery(theme.breakpoints.between('sm', 'lg'))
 */
export function useBreakpointBetween(
  minBreakpoint: Breakpoint,
  maxBreakpoint: Breakpoint,
): boolean {
  const currentBreakpoint = useBreakpoint();
  const currentIndex = Object.keys(BREAKPOINTS).indexOf(currentBreakpoint);
  const minIndex = Object.keys(BREAKPOINTS).indexOf(minBreakpoint);
  const maxIndex = Object.keys(BREAKPOINTS).indexOf(maxBreakpoint);

  return currentIndex >= minIndex && currentIndex <= maxIndex;
}
