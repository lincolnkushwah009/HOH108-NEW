"use client";

import { useContext } from "react";
import { LenisContext } from "@/components/providers/SmoothScroll";

export function useLenis() {
  return useContext(LenisContext);
}
