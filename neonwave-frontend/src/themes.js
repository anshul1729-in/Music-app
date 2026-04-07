// src/themes.js
// Drop-in theme system for NeonWave
// Each theme is a complete set of CSS variables + metadata

export const THEMES = {
  // ─── NEON / CYBERPUNK ────────────────────────────────────────────────────
  neon: {
    id: "neon",
    name: "NEON",
    subtitle: "Cyberpunk City",
    emoji: "⚡",
    fonts: {
      display: "'Orbitron', monospace",
      body: "'Rajdhani', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    googleFonts: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
    vars: {
      "--bg":           "#060612",
      "--bg2":          "#0d0d24",
      "--bg3":          "#12122e",
      "--surface":      "rgba(13,13,36,0.92)",
      "--surface2":     "rgba(18,18,46,0.8)",
      "--border":       "rgba(0,245,255,0.12)",
      "--border-hover": "rgba(0,245,255,0.35)",
      "--accent":       "#00f5ff",
      "--accent2":      "#b44eff",
      "--accent3":      "#ff2d78",
      "--accent4":      "#ffe94e",
      "--text":         "#c8d0e8",
      "--text-dim":     "#5a6a8a",
      "--text-bright":  "#ffffff",
      "--glow":         "0 0 20px rgba(0,245,255,0.4), 0 0 40px rgba(0,245,255,0.15)",
      "--glow2":        "0 0 20px rgba(180,78,255,0.4)",
      "--progress-bg":  "rgba(0,245,255,0.12)",
      "--progress-fill":"linear-gradient(90deg, #00f5ff, #b44eff)",
      "--scrollbar":    "#00f5ff",
      "--vinyl-rim":    "#1a1a3e",
      "--vinyl-shine":  "rgba(0,245,255,0.3)",
      "--card-hover":   "rgba(0,245,255,0.05)",
      "--now-playing":  "#00f5ff",
      "--playlist-selected": "rgba(0,245,255,0.1)",
    },
    bgEffect: `
      radial-gradient(ellipse 80% 40% at 20% 0%, rgba(0,245,255,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 100%, rgba(180,78,255,0.09) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 50% 50%, rgba(255,45,120,0.03) 0%, transparent 70%)
    `,
    scanlines: false,
    grain: false,
    gridLines: false,
  },

  // ─── RETRO / CASSETTE ────────────────────────────────────────────────────
  retro: {
    id: "retro",
    name: "RETRO",
    subtitle: "Cassette Tape",
    emoji: "📼",
    fonts: {
      display: "'VT323', monospace",
      body: "'Share Tech Mono', monospace",
      mono: "'Share Tech Mono', monospace",
    },
    googleFonts: "https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap",
    vars: {
      "--bg":           "#0f0a00",
      "--bg2":          "#1a1200",
      "--bg3":          "#221800",
      "--surface":      "rgba(26,18,0,0.95)",
      "--surface2":     "rgba(34,24,0,0.85)",
      "--border":       "rgba(255,165,0,0.2)",
      "--border-hover": "rgba(255,165,0,0.5)",
      "--accent":       "#ff9d00",
      "--accent2":      "#ff5e00",
      "--accent3":      "#ffe566",
      "--accent4":      "#c8ff00",
      "--text":         "#d4a843",
      "--text-dim":     "#6b5020",
      "--text-bright":  "#ffe8a0",
      "--glow":         "0 0 12px rgba(255,157,0,0.5), 0 0 30px rgba(255,94,0,0.2)",
      "--glow2":        "0 0 12px rgba(255,94,0,0.4)",
      "--progress-bg":  "rgba(255,157,0,0.12)",
      "--progress-fill":"linear-gradient(90deg, #ff5e00, #ff9d00, #ffe566)",
      "--scrollbar":    "#ff9d00",
      "--vinyl-rim":    "#2a1e00",
      "--vinyl-shine":  "rgba(255,157,0,0.25)",
      "--card-hover":   "rgba(255,157,0,0.06)",
      "--now-playing":  "#ff9d00",
      "--playlist-selected": "rgba(255,157,0,0.1)",
    },
    bgEffect: `
      radial-gradient(ellipse 100% 60% at 50% 100%, rgba(255,94,0,0.06) 0%, transparent 70%),
      radial-gradient(ellipse 50% 30% at 0% 0%, rgba(255,157,0,0.04) 0%, transparent 60%)
    `,
    scanlines: true,
    grain: true,
    gridLines: false,
  },

  // ─── MINIMAL / MONOCHROME ─────────────────────────────────────────────────
  minimal: {
    id: "minimal",
    name: "MONO",
    subtitle: "Clean Slate",
    emoji: "◻",
    fonts: {
      display: "'Bebas Neue', cursive",
      body: "'DM Sans', sans-serif",
      mono: "'DM Mono', monospace",
    },
    googleFonts: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap",
    vars: {
      "--bg":           "#0a0a0a",
      "--bg2":          "#111111",
      "--bg3":          "#181818",
      "--surface":      "rgba(17,17,17,0.97)",
      "--surface2":     "rgba(24,24,24,0.9)",
      "--border":       "rgba(255,255,255,0.08)",
      "--border-hover": "rgba(255,255,255,0.25)",
      "--accent":       "#ffffff",
      "--accent2":      "#aaaaaa",
      "--accent3":      "#555555",
      "--accent4":      "#e0e0e0",
      "--text":         "#888888",
      "--text-dim":     "#444444",
      "--text-bright":  "#ffffff",
      "--glow":         "none",
      "--glow2":        "none",
      "--progress-bg":  "rgba(255,255,255,0.08)",
      "--progress-fill":"linear-gradient(90deg, #fff, #aaa)",
      "--scrollbar":    "#444",
      "--vinyl-rim":    "#1e1e1e",
      "--vinyl-shine":  "rgba(255,255,255,0.1)",
      "--card-hover":   "rgba(255,255,255,0.04)",
      "--now-playing":  "#ffffff",
      "--playlist-selected": "rgba(255,255,255,0.07)",
    },
    bgEffect: `none`,
    scanlines: false,
    grain: false,
    gridLines: false,
  },

  // ─── SYNTHWAVE / OUTRUN ───────────────────────────────────────────────────
  synthwave: {
    id: "synthwave",
    name: "SYNTH",
    subtitle: "Outrun Forever",
    emoji: "🌆",
    fonts: {
      display: "'Russo One', sans-serif",
      body: "'Exo 2', sans-serif",
      mono: "'Fira Code', monospace",
    },
    googleFonts: "https://fonts.googleapis.com/css2?family=Russo+One&family=Exo+2:wght@300;400;500;600&family=Fira+Code:wght@400;500&display=swap",
    vars: {
      "--bg":           "#0d0015",
      "--bg2":          "#130020",
      "--bg3":          "#1a0030",
      "--surface":      "rgba(19,0,32,0.95)",
      "--surface2":     "rgba(26,0,48,0.85)",
      "--border":       "rgba(255,0,200,0.15)",
      "--border-hover": "rgba(255,0,200,0.4)",
      "--accent":       "#ff00c8",
      "--accent2":      "#ff6b00",
      "--accent3":      "#7700ff",
      "--accent4":      "#00eeff",
      "--text":         "#e0bfff",
      "--text-dim":     "#6b4080",
      "--text-bright":  "#ffffff",
      "--glow":         "0 0 20px rgba(255,0,200,0.45), 0 0 50px rgba(119,0,255,0.2)",
      "--glow2":        "0 0 20px rgba(255,107,0,0.4)",
      "--progress-bg":  "rgba(255,0,200,0.12)",
      "--progress-fill":"linear-gradient(90deg, #7700ff, #ff00c8, #ff6b00)",
      "--scrollbar":    "#ff00c8",
      "--vinyl-rim":    "#200040",
      "--vinyl-shine":  "rgba(255,0,200,0.3)",
      "--card-hover":   "rgba(255,0,200,0.05)",
      "--now-playing":  "#ff00c8",
      "--playlist-selected": "rgba(255,0,200,0.1)",
    },
    bgEffect: `
      radial-gradient(ellipse 100% 50% at 50% 100%, rgba(119,0,255,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,0,200,0.08) 0%, transparent 50%),
      linear-gradient(180deg, transparent 60%, rgba(119,0,255,0.06) 100%)
    `,
    scanlines: false,
    grain: false,
    gridLines: true,
  },
};

export const THEME_ORDER = ["neon", "retro", "minimal", "synthwave"];
export const DEFAULT_THEME = "neon";

// Apply a theme to :root CSS variables
export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.neon;
  const root = document.documentElement;

  // Remove old font link
  const oldFont = document.getElementById("neonwave-font");
  if (oldFont) oldFont.remove();

  // Inject font
  if (theme.googleFonts) {
    const link = document.createElement("link");
    link.id = "neonwave-font";
    link.rel = "stylesheet";
    link.href = theme.googleFonts;
    document.head.appendChild(link);
  }

  // Apply CSS vars
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Font vars
  root.style.setProperty("--font-display", theme.fonts.display);
  root.style.setProperty("--font-body", theme.fonts.body);
  root.style.setProperty("--font-mono", theme.fonts.mono);

  // Bg effect
  root.style.setProperty("--bg-effect", theme.bgEffect);

  // Body class for scanlines/grain/grid
  document.body.dataset.theme = themeId;

  // Save preference
  localStorage.setItem("neonwave-theme", themeId);

  return theme;
}

export function getSavedTheme() {
  return localStorage.getItem("neonwave-theme") || DEFAULT_THEME;
}
