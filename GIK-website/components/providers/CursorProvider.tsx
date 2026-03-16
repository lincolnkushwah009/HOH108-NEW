"use client";

import { createContext, useContext, useState, useCallback } from "react";

type CursorVariant = "default" | "hover" | "link" | "drag" | "hidden";

interface CursorContextType {
  variant: CursorVariant;
  setVariant: (v: CursorVariant) => void;
  text: string;
  setText: (t: string) => void;
}

const CursorContext = createContext<CursorContextType>({
  variant: "default",
  setVariant: () => {},
  text: "",
  setText: () => {},
});

export function useCursor() {
  return useContext(CursorContext);
}

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<CursorVariant>("default");
  const [text, setTextState] = useState("");

  const setVariant = useCallback((v: CursorVariant) => setVariantState(v), []);
  const setText = useCallback((t: string) => setTextState(t), []);

  return (
    <CursorContext.Provider value={{ variant, setVariant, text, setText }}>
      {children}
    </CursorContext.Provider>
  );
}
