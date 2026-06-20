"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

export function useAdminTheme() {
  return useContext(ThemeCtx);
}

// Owns the admin theme (light/dark) and renders the `.admin-root` wrapper that
// carries the data-theme attribute the CSS tokens key off. Shared by the shell
// toggle and the mobile launcher's Day/Night cards.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme");
    if (saved === "dark" || saved === "light") setThemeState(saved);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("admin-theme", t);
  }

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "light" ? "dark" : "light") }}>
      <div className="admin-root" data-theme={theme}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}
