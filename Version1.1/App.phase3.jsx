// src/App.phase3.jsx
// This shows how to wire Phase 3 into your existing Phase 1 App.jsx
// Copy the relevant pieces into your existing App.jsx

// ─── 1. Add these imports at the top of your App.jsx ─────────────────────────
import { ThemeProvider } from "./contexts/ThemeContext";
import { QueueProvider, useQueue } from "./contexts/QueueContext";
import ThemeSwitcher from "./components/ThemeSwitcher";
import QueuePanel from "./components/QueuePanel";
import PlaylistPanel from "./components/PlaylistPanel";

// ─── 2. Wrap your app with providers ─────────────────────────────────────────
// In your main.jsx or root App.jsx:
//
// export default function App() {
//   return (
//     <ThemeProvider>
//       <QueueProvider>
//         <NeonWaveApp />
//       </QueueProvider>
//     </ThemeProvider>
//   );
// }

// ─── 3. In your top bar / header, add ThemeSwitcher ──────────────────────────
// <ThemeSwitcher />
// This renders a dropdown with all 4 theme options

// ─── 4. Add queue and playlist buttons to your player controls ────────────────
// These go alongside your existing play/pause/skip buttons:
function QueuePlaylistButtons() {
  const { setQueueOpen, setPlaylistOpen, queue } = useQueue();
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={() => setPlaylistOpen(true)}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "8px 14px",
          color: "var(--text)",
          fontFamily: "var(--font-display)",
          fontSize: "10px",
          letterSpacing: "2px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
      >≡ PLAYLISTS</button>

      <button
        onClick={() => setQueueOpen(true)}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "8px 14px",
          color: "var(--text)",
          fontFamily: "var(--font-display)",
          fontSize: "10px",
          letterSpacing: "2px",
          cursor: "pointer",
          transition: "all 0.2s",
          position: "relative",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
      >
        ♫ QUEUE
        {queue.length > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: "var(--accent)",
            color: "var(--bg)",
            borderRadius: "100px",
            fontSize: "9px",
            fontWeight: 700,
            padding: "1px 5px",
            minWidth: "16px",
            textAlign: "center",
          }}>{queue.length}</span>
        )}
      </button>
    </div>
  );
}

// ─── 5. Add panels to your app's render ──────────────────────────────────────
// Anywhere at the root level of your rendered JSX (outside main content):
//
// <>
//   {/* ... your existing UI ... */}
//   <QueuePanel />
//   <PlaylistPanel currentTrack={currentTrack} />
// </>

// ─── 6. Connect your library tracks to the queue ─────────────────────────────
// When user clicks a track in your library, use loadQueue instead of direct playback:
//
// const { loadQueue } = useQueue();
//
// // Play a single track:
// loadQueue([track], 0);
//
// // Play whole library starting at clicked track:
// loadQueue(allTracks, clickedIndex);
//
// // Add to queue:
// addToQueue(track);
//
// // Play next:
// playNext(track);

// ─── 7. Right-click context menu on tracks ────────────────────────────────────
// Optional: add this to each track row for playlist/queue shortcuts
function TrackContextMenu({ track, onClose }) {
  const { addToQueue, playNext } = useQueue();

  return (
    <div style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "8px",
      minWidth: "180px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
    }}>
      {[
        { label: "▶  Play now",      action: () => {} },
        { label: "▷  Play next",     action: () => { playNext(track); onClose(); } },
        { label: "+ Add to queue",   action: () => { addToQueue(track); onClose(); } },
        { label: "≡  Add to playlist", action: () => { /* open playlist picker */ onClose(); } },
        null, // divider
        { label: "♡  Favorite",      action: () => {} },
      ].map((item, i) =>
        item === null ? (
          <div key={i} style={{ height: 1, background: "var(--border)", margin: "4px 8px" }} />
        ) : (
          <button
            key={i}
            onClick={item.action}
            style={{
              width: "100%", textAlign: "left",
              background: "none", border: "none",
              borderRadius: "6px",
              padding: "9px 12px",
              color: "var(--text)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--card-hover)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text)"; }}
          >{item.label}</button>
        )
      )}
    </div>
  );
}

// ─── 8. Theme-aware global CSS ────────────────────────────────────────────────
// Add this to your index.css / global styles:
const GLOBAL_CSS = `
/* NeonWave Phase 3 — Theme-aware globals */

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  transition: background 0.4s ease, color 0.3s ease;
}

body::before {
  content: '';
  position: fixed; inset: 0;
  background: var(--bg-effect);
  pointer-events: none;
  z-index: 0;
}

/* Scanlines (retro theme) */
body[data-theme="retro"]::after {
  content: '';
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.15) 0px,
    rgba(0,0,0,0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 9999;
}

/* Grid lines (synthwave theme) */
body[data-theme="synthwave"]::after {
  content: '';
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,0,200,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,0,200,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 2px; opacity: 0.5; }

/* Selection */
::selection { background: var(--accent); color: var(--bg); }

/* Transitions on theme elements */
*, *::before, *::after {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
`;

export { QueuePlaylistButtons, TrackContextMenu, GLOBAL_CSS };
export default function Phase3Integration() {
  return (
    <div style={{ padding: 24, fontFamily: "monospace", color: "#00f5ff", background: "#060612", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 16 }}>Phase 3 Integration Guide</h1>
      <p style={{ color: "#888", marginBottom: 24 }}>See comments in this file for step-by-step integration instructions.</p>
      <p style={{ color: "#555" }}>This file is a guide — not meant to run standalone.</p>
    </div>
  );
}
