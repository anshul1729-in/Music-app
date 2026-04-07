// src/contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { THEMES, THEME_ORDER, applyTheme, getSavedTheme } from "../themes";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => getSavedTheme());
  const [theme, setTheme]   = useState(() => THEMES[getSavedTheme()] || THEMES.neon);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const applied = applyTheme(themeId);
    setTheme(applied);
  }, []);

  const switchTheme = useCallback((id) => {
    if (id === themeId || transitioning) return;
    setTransitioning(true);

    // Fade out
    document.body.style.transition = "opacity 0.25s ease";
    document.body.style.opacity = "0.6";

    setTimeout(() => {
      const applied = applyTheme(id);
      setThemeId(id);
      setTheme(applied);

      // Fade back in
      document.body.style.opacity = "1";
      setTimeout(() => {
        document.body.style.transition = "";
        setTransitioning(false);
      }, 300);
    }, 250);
  }, [themeId, transitioning]);

  const cycleTheme = useCallback(() => {
    const idx = THEME_ORDER.indexOf(themeId);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    switchTheme(next);
  }, [themeId, switchTheme]);

  return (
    <ThemeContext.Provider value={{ themeId, theme, themes: THEMES, themeOrder: THEME_ORDER, switchTheme, cycleTheme, transitioning }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
