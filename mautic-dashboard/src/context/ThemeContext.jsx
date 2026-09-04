import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "midnight", label: "Midnight Blue" },
  { id: "slate", label: "Slate Gray" },
  { id: "emerald", label: "Emerald" },
  { id: "royal", label: "Royal Purple" },
  { id: "charcoal", label: "Charcoal Orange" },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ra-dashboard-theme") || "midnight";
    } catch {
      return "midnight";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("ra-dashboard-theme", theme);
    } catch {
      // ignore (e.g. private browsing)
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
