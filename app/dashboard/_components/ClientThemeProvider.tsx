"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

export function useClientTheme() {
  return useContext(Ctx);
}

// Dark/light theme for the client dashboard. Renders a data-theme wrapper that
// the global CSS tokens key off ([data-theme="dark"]). Persists per browser.
export function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("client-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  function toggle() {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      localStorage.setItem("client-theme", next);
      return next;
    });
  }

  return (
    <Ctx.Provider value={{ theme, toggle }}>
      <div data-theme={theme}>{children}</div>
    </Ctx.Provider>
  );
}

export function ClientThemeToggle() {
  const { theme, toggle } = useClientTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        background: "transparent",
        border: "1px solid var(--c-border)",
        color: "var(--c-muted)",
        padding: "0.45rem 0.75rem",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.8125rem",
        width: "100%",
        textAlign: "left",
      }}
    >
      {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
}
