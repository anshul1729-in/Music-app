// src/components/ThemeSwitcher.jsx
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { THEMES, THEME_ORDER } from "../themes";

// Color swatches for each theme
const THEME_SWATCHES = {
  neon:      ["#00f5ff", "#b44eff", "#ff2d78", "#060612"],
  retro:     ["#ff9d00", "#ff5e00", "#ffe566", "#0f0a00"],
  minimal:   ["#ffffff", "#888888", "#444444", "#0a0a0a"],
  synthwave: ["#ff00c8", "#ff6b00", "#7700ff", "#0d0015"],
};

export default function ThemeSwitcher() {
  const { themeId, switchTheme, transitioning } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "7px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text)",
          fontFamily: "var(--font-display)",
          fontSize: "11px",
          letterSpacing: "2px",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--text)";
        }}
      >
        {/* Live swatch */}
        <span style={{ display: "flex", gap: "3px" }}>
          {THEME_SWATCHES[themeId].slice(0, 3).map((c, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "block" }} />
          ))}
        </span>
        <span>{THEMES[themeId]?.name}</span>
        <span style={{ fontSize: "9px", opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />

          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 100,
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "12px",
            minWidth: "260px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), var(--glow)",
            animation: "fadeSlideDown 0.15s ease",
          }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "9px",
              letterSpacing: "3px",
              color: "var(--text-dim)",
              padding: "4px 8px 12px",
              textTransform: "uppercase",
            }}>
              VIBE SELECT
            </div>

            {THEME_ORDER.map((id) => {
              const t = THEMES[id];
              const swatches = THEME_SWATCHES[id];
              const isActive = id === themeId;

              return (
                <button
                  key={id}
                  onClick={() => { switchTheme(id); setOpen(false); }}
                  disabled={transitioning}
                  style={{
                    width: "100%",
                    background: isActive ? "var(--playlist-selected)" : "transparent",
                    border: isActive
                      ? "1px solid var(--border-hover)"
                      : "1px solid transparent",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    marginBottom: "4px",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--card-hover)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  {/* Swatch strip */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    flexShrink: 0,
                  }}>
                    {swatches.slice(0, 3).map((c, i) => (
                      <span key={i} style={{
                        width: 14,
                        height: 14,
                        borderRadius: "3px",
                        background: c,
                        display: "block",
                        boxShadow: isActive ? `0 0 6px ${c}66` : "none",
                      }} />
                    ))}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "13px",
                      letterSpacing: "2px",
                      color: isActive ? "var(--accent)" : "var(--text-bright)",
                      marginBottom: "2px",
                    }}>
                      {t.name}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--text-dim)",
                    }}>
                      {t.subtitle}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <span style={{
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      boxShadow: "var(--glow)",
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
