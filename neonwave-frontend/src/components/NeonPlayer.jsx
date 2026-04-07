import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  PlayIcon, PauseIcon, SkipNext, SkipPrev, ShuffleIcon, 
  RepeatIcon, VolumeIcon, MusicIcon, PlusIcon, ListIcon, 
  GridIcon, TrashIcon 
} from "./Icons";
import Visualizer from "./Visualizer";
import AlbumArt from "./AlbumArt";
import api from "../api";

const THEMES = {
  neon: {
    bg: "#080810",
    surface: "#0d0d1a",
    card: "#111128",
    border: "#1a1a3a",
    accent: "#00f5ff",
    accent2: "#a855f7",
    accent3: "#ff006e",
    text: "#e0e8ff",
    muted: "#4a4a7a",
    glow: "0 0 20px #00f5ff55, 0 0 40px #00f5ff22",
    glowPurple: "0 0 20px #a855f755, 0 0 40px #a855f722",
  },
  moody: {
    bg: "#060609",
    surface: "#0c0c14",
    card: "#10101c",
    border: "#1c1c2e",
    accent: "#7c3aed",
    accent2: "#ec4899",
    accent3: "#f59e0b",
    text: "#d4d4f0",
    muted: "#3a3a5a",
    glow: "0 0 20px #7c3aed55, 0 0 40px #7c3aed22",
    glowPurple: "0 0 20px #ec489955, 0 0 40px #ec489922",
  },
};

const formatTime = (s) => {
  if (isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function NeonPlayer() {
  const [themeName, setThemeName] = useState("neon");
  const theme = THEMES[themeName];

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-bg', theme.bg);
    document.documentElement.style.setProperty('--theme-surface', theme.surface);
    document.documentElement.style.setProperty('--theme-card', theme.card);
    document.documentElement.style.setProperty('--theme-border', theme.border);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
    document.documentElement.style.setProperty('--theme-accent-44', theme.accent + "44");
    document.documentElement.style.setProperty('--theme-accent-aa', theme.accent + "aa");
    document.documentElement.style.setProperty('--theme-accent-11', theme.accent + "11");
    document.documentElement.style.setProperty('--theme-accent-18', theme.accent + "18");
    document.documentElement.style.setProperty('--theme-accent-33', theme.accent + "33");
    document.documentElement.style.setProperty('--theme-accent-88', theme.accent + "88");
    document.documentElement.style.setProperty('--theme-accent-22', theme.accent + "22");
  }, [theme]);

  const [library, setLibrary] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [view, setView] = useState("library");
  const [gridView, setGridView] = useState(false);
  const [search, setSearch] = useState("");
  const [analyser, setAnalyser] = useState(null);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const currentTrack = queue[currentIndex] || null;

  const setupAudioContext = useCallback((audio) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.connect(ctx.destination);
      setAnalyser(analyserRef.current);
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
    }
    sourceRef.current = ctx.createMediaElementSource(audio);
    sourceRef.current.connect(analyserRef.current);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = api.getStreamUrl(currentTrack.id);
    audio.volume = volume;
    if (isPlaying) {
      if (!audioCtxRef.current || !sourceRef.current) setupAudioContext(audio);
      audio.play().catch(() => {});
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (!audioCtxRef.current || !sourceRef.current) setupAudioContext(audio);
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const playTrack = (index) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (index === currentIndex && currentTrack) {
      togglePlay();
      return;
    }
    setCurrentIndex(index);
    setIsPlaying(true);
    const track = queue[index];
    if (!track) return;
    audio.src = api.getStreamUrl(track.id);
    if (!audioCtxRef.current) setupAudioContext(audio);
    else {
      if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} }
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
    }
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const skipNext = () => {
    if (!queue.length) return;
    const next = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (currentIndex + 1) % queue.length;
    playTrack(next);
  };

  const skipPrev = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (!queue.length) return;
    const prev = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (currentIndex - 1 + queue.length) % queue.length;
    playTrack(prev);
  };

  useEffect(() => {
    // Initial fetch of library from backend
    api.getTracks().then(({ tracks }) => {
      // Map 'title' to 'name' so it connects cleanly with your existing UI
      const mapped = tracks.map(t => ({ ...t, name: t.title }));
      setLibrary(mapped);
      setQueue(mapped);
    }).catch(console.error);
  }, []);

  const handleFiles = async (files) => {
    const audioFiles = Array.from(files).filter((f) => f.type.startsWith("audio/"));
    if (!audioFiles.length) return;
    
    try {
      const uploaded = await api.uploadTracks(audioFiles);
      const mapped = uploaded.map(t => ({ ...t, name: t.title }));
      setLibrary((prev) => {
        const updated = [...prev, ...mapped];
        setQueue(updated);
        return updated;
      });
    } catch (e) {
      console.error("Upload error", e);
    }
  };

  useEffect(() => {
    const drop = dropRef.current;
    if (!drop) return;
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => { prevent(e); handleFiles(e.dataTransfer.files); };
    drop.addEventListener("dragover", prevent);
    drop.addEventListener("drop", onDrop);
    return () => { drop.removeEventListener("dragover", prevent); drop.removeEventListener("drop", onDrop); };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      if (repeat) { audio.currentTime = 0; audio.play(); }
      else skipNext();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [currentIndex, repeat, shuffle]);

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const removeTrack = async (id) => {
    try {
      await api.deleteTrack(id);
      setLibrary((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        setQueue(updated);
        if (updated.length === 0) { setIsPlaying(false); setCurrentIndex(0); }
        return updated;
      });
    } catch (e) {
      console.error("Error deleting track", e);
    }
  };

  const filtered = library.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} crossOrigin="anonymous" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        ref={dropRef}
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          background: theme.bg,
          minHeight: "100vh",
          color: theme.text,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surface,
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: theme.glow,
            }}>
              <MusicIcon size={16} />
            </div>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, color: theme.accent, letterSpacing: 2 }}>
              NEON<span style={{ color: theme.accent2 }}>WAVE</span>
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {["library", "queue"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 16px", borderRadius: 6, border: `1px solid ${view === v ? theme.accent : theme.border}`,
                background: view === v ? theme.accent + "22" : "transparent",
                color: view === v ? theme.accent : theme.muted,
                fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
                transition: "all 0.2s",
              }}>
                {v}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Object.keys(THEMES).map((t) => (
              <button key={t} onClick={() => setThemeName(t)} className="theme-btn" style={{
                padding: "5px 12px", borderRadius: 6,
                border: `1px solid ${themeName === t ? theme.accent : theme.border}`,
                background: themeName === t ? theme.accent + "22" : "transparent",
                color: themeName === t ? theme.accent : theme.muted,
                fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 600,
                cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", transition: "all 0.2s",
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{
            width: 280, minWidth: 280, padding: 20,
            borderRight: `1px solid ${theme.border}`,
            background: theme.surface,
            display: "flex", flexDirection: "column", gap: 16,
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <div className={`vinyl ${isPlaying ? 'playing' : 'paused'}`} style={{
                borderRadius: 12,
                boxShadow: currentTrack ? theme.glow : "none",
                transition: "box-shadow 0.5s",
              }}>
                <AlbumArt song={currentTrack} theme={theme} size={220} />
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 600,
                color: theme.text, marginBottom: 4,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {currentTrack?.name || "NO TRACK LOADED"}
              </div>
              <div style={{ fontSize: 13, color: theme.accent2, letterSpacing: 1 }}>
                {currentTrack?.artist || "—"}
              </div>
            </div>

            <div>
              <div
                onClick={seek}
                style={{
                  height: 4, background: theme.border, borderRadius: 2,
                  cursor: "pointer", position: "relative", marginBottom: 6,
                }}
              >
                <div style={{
                  height: "100%", width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
                  borderRadius: 2,
                  boxShadow: `0 0 8px ${theme.accent}88`,
                  transition: "width 0.1s",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: theme.muted, letterSpacing: 1 }}>
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <button onClick={() => setShuffle(!shuffle)} className={`ctrl-btn ${shuffle ? "active" : ""}`} style={{
                background: "none", border: "none", color: shuffle ? theme.accent : theme.muted,
                cursor: "pointer", padding: 4,
              }}>
                <ShuffleIcon size={16} />
              </button>
              <button onClick={skipPrev} className="ctrl-btn" style={{
                background: "none", border: "none", color: theme.text, cursor: "pointer", padding: 4,
              }}>
                <SkipPrev size={22} />
              </button>
              <button onClick={togglePlay} className="play-btn" style={{
                width: 52, height: 52, borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                border: "none", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: theme.glow,
                transition: "all 0.2s",
              }}>
                {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
              </button>
              <button onClick={skipNext} className="ctrl-btn" style={{
                background: "none", border: "none", color: theme.text, cursor: "pointer", padding: 4,
              }}>
                <SkipNext size={22} />
              </button>
              <button onClick={() => setRepeat(!repeat)} className={`ctrl-btn ${repeat ? "active" : ""}`} style={{
                background: "none", border: "none", color: repeat ? theme.accent : theme.muted,
                cursor: "pointer", padding: 4,
              }}>
                <RepeatIcon size={16} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <VolumeIcon size={14} />
              <input
                type="range" min="0" max="1" step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 11, color: theme.muted, minWidth: 28, textAlign: "right", letterSpacing: 1 }}>
                {Math.round(volume * 100)}
              </span>
            </div>

            <div style={{
              background: theme.card, borderRadius: 8,
              border: `1px solid ${theme.border}`,
              padding: "8px 12px", overflow: "hidden",
            }}>
              <Visualizer analyser={analyser} isPlaying={isPlaying} theme={theme} />
            </div>

            <button onClick={() => fileInputRef.current.click()} className="upload-btn" style={{
              width: "100%", padding: "12px", borderRadius: 8,
              border: `1px dashed ${theme.border}`,
              background: "transparent", color: theme.muted,
              fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}>
              <PlusIcon size={14} />
              Add Music
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${theme.border}`,
              display: "flex", alignItems: "center", gap: 12,
              background: theme.surface,
            }}>
              <input
                type="text"
                placeholder="Search your library..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: "8px 14px", borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: theme.card, color: theme.text,
                  fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
                  outline: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = theme.accent}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
              <div style={{ display: "flex", gap: 4 }}>
                {[["list", <ListIcon size={16} />], ["grid", <GridIcon size={16} />]].map(([id, icon]) => (
                  <button key={id} onClick={() => setGridView(id === "grid")} style={{
                    width: 34, height: 34, borderRadius: 6,
                    border: `1px solid ${(id === "grid") === gridView ? theme.accent : theme.border}`,
                    background: (id === "grid") === gridView ? theme.accent + "22" : "transparent",
                    color: (id === "grid") === gridView ? theme.accent : theme.muted,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {icon}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: theme.muted, letterSpacing: 1, whiteSpace: "nowrap" }}>
                {library.length} TRACKS
              </span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {view === "library" && (
                <div className="fadeIn">
                  {library.length === 0 ? (
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", minHeight: 300, gap: 16,
                      color: theme.muted,
                    }}>
                      <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        border: `2px dashed ${theme.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <MusicIcon size={32} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, color: theme.muted, letterSpacing: 2, marginBottom: 8 }}>
                          YOUR LIBRARY IS EMPTY
                        </div>
                        <div style={{ fontSize: 13, color: theme.muted + "aa" }}>
                          Drop audio files here or click Add Music
                        </div>
                      </div>
                      <button onClick={() => fileInputRef.current.click()} style={{
                        padding: "10px 24px", borderRadius: 8,
                        background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent2}33)`,
                        border: `1px solid ${theme.accent}66`,
                        color: theme.accent, cursor: "pointer",
                        fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 600,
                        letterSpacing: 1,
                      }}>
                        UPLOAD MUSIC
                      </button>
                    </div>
                  ) : gridView ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                      {filtered.map((track, i) => (
                        <div
                          key={track.id}
                          onClick={() => { setQueue(library); playTrack(library.indexOf(track)); }}
                          style={{
                            background: queue[currentIndex]?.id === track.id ? theme.accent + "18" : theme.card,
                            border: `1px solid ${queue[currentIndex]?.id === track.id ? theme.accent + "66" : theme.border}`,
                            borderRadius: 10, overflow: "hidden", cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          <AlbumArt song={track} theme={theme} size={150} />
                          <div style={{ padding: "8px 10px" }}>
                            <div style={{
                              fontSize: 12, fontWeight: 600, color: theme.text,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              marginBottom: 2,
                            }}>
                              {track.name}
                            </div>
                            <div style={{ fontSize: 11, color: theme.muted }}>{track.artist}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          {["#", "TITLE", "ARTIST", ""].map((h, i) => (
                            <th key={i} style={{
                              padding: "8px 12px", textAlign: "left",
                              fontSize: 11, color: theme.muted, letterSpacing: 2, fontWeight: 600,
                              width: i === 0 ? 40 : i === 3 ? 40 : "auto",
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((track, idx) => {
                          const isActive = queue[currentIndex]?.id === track.id;
                          return (
                            <tr
                              key={track.id}
                              className={`track-row ${isActive ? "active" : ""}`}
                              onClick={() => { setQueue(library); playTrack(library.indexOf(track)); }}
                              style={{
                                background: isActive ? theme.accent + "18" : "transparent",
                                cursor: "pointer", transition: "background 0.15s",
                                borderBottom: `1px solid ${theme.border}22`,
                              }}
                            >
                              <td style={{ padding: "10px 12px", width: 40 }}>
                                {isActive && isPlaying ? (
                                  <div style={{
                                    display: "flex", gap: 2, alignItems: "flex-end", height: 14,
                                  }}>
                                    {[1, 1.5, 0.8].map((delay, j) => (
                                      <div key={j} style={{
                                        width: 3, background: theme.accent, borderRadius: 1,
                                        animation: `pulse ${delay}s ease-in-out infinite`,
                                        height: [10, 14, 8][j],
                                      }} />
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 12, color: isActive ? theme.accent : theme.muted, letterSpacing: 1 }}>
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? theme.accent : theme.text }}>
                                  {track.name}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ fontSize: 13, color: theme.muted }}>{track.artist}</span>
                              </td>
                              <td style={{ padding: "10px 12px", width: 40 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
                                  style={{
                                    background: "none", border: "none", color: theme.muted,
                                    cursor: "pointer", opacity: 0.5, padding: 4,
                                    transition: "all 0.15s",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.accent3; e.currentTarget.style.opacity = 1; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.opacity = 0.5; }}
                                >
                                  <TrashIcon size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {view === "queue" && (
                <div className="fadeIn">
                  {queue.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: theme.muted }}>
                      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>
                        QUEUE IS EMPTY
                      </div>
                      <div style={{ fontSize: 13 }}>Add tracks to your library to start playing</div>
                    </div>
                  ) : (
                    queue.map((track, idx) => {
                      const isActive = idx === currentIndex;
                      return (
                        <div
                          key={track.id}
                          onClick={() => playTrack(idx)}
                          className={`track-row ${isActive ? "active" : ""}`}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 12px", borderRadius: 8,
                            background: isActive ? theme.accent + "18" : "transparent",
                            border: `1px solid ${isActive ? theme.accent + "44" : "transparent"}`,
                            cursor: "pointer", marginBottom: 4, transition: "all 0.15s",
                          }}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: isActive ? theme.accent + "33" : theme.border,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {isActive && isPlaying ? (
                              <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end", height: 12 }}>
                                {[1, 1.5, 0.8].map((d, j) => (
                                  <div key={j} style={{
                                    width: 2.5, background: theme.accent, borderRadius: 1,
                                    animation: `pulse ${d}s ease-in-out infinite`,
                                    height: [8, 12, 6][j],
                                  }} />
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 10, color: isActive ? theme.accent : theme.muted, letterSpacing: 1 }}>
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 500,
                              color: isActive ? theme.accent : theme.text,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {track.name}
                            </div>
                            <div style={{ fontSize: 12, color: theme.muted }}>{track.artist}</div>
                          </div>
                          {isActive && (
                            <div style={{
                              fontSize: 10, color: theme.accent, letterSpacing: 2,
                              fontFamily: "'Orbitron', monospace",
                            }}>
                              NOW PLAYING
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{
          position: "fixed", bottom: 20, right: 20,
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 8, padding: "8px 14px",
          fontSize: 11, color: theme.muted, letterSpacing: 1,
          fontFamily: "'Rajdhani', sans-serif",
          pointerEvents: "none",
        }}>
          DROP AUDIO FILES ANYWHERE
        </div>
      </div>
    </>
  );
}
