import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  PlayIcon, PauseIcon, SkipNext, SkipPrev, ShuffleIcon, 
  RepeatIcon, VolumeIcon, MusicIcon, PlusIcon, ListIcon, 
  GridIcon, TrashIcon 
} from "./Icons";
import Visualizer from "./Visualizer";
import AlbumArt from "./AlbumArt";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useQueue } from "../contexts/QueueContext";
import ThemeSwitcher from "./ThemeSwitcher";
import QueuePanel from "./QueuePanel";
import PlaylistPanel from "./PlaylistPanel";

const formatTime = (s) => {
  if (isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function NeonPlayer() {
  const { theme } = useTheme();

  const t = theme || {};
  const th = {
    bg:         t.vars?.["--bg"]         || "#060612",
    surface:    t.vars?.["--surface"]    || "#0d0d24",
    card:       t.vars?.["--bg3"]        || "#12122e",
    border:     t.vars?.["--border"]     || "rgba(0,245,255,0.12)",
    accent:     t.vars?.["--accent"]     || "#00f5ff",
    accent2:    t.vars?.["--accent2"]    || "#b44eff",
    accent3:    t.vars?.["--accent3"]    || "#ff2d78",
    text:       t.vars?.["--text"]       || "#c8d0e8",
    muted:      t.vars?.["--text-dim"]   || "#5a6a8a",
    glow:       t.vars?.["--glow"]       || "0 0 20px rgba(0,245,255,0.4)",
    glowPurple: t.vars?.["--glow2"]      || "0 0 20px rgba(180,78,255,0.4)",
  };

  const {
    queue: ctxQueue,
    queueIndex,
    currentTrack,
    shuffled,
    repeat,
    loadQueue,
    jumpTo,
    goToNext,
    goToPrev,
    toggleShuffle,
    cycleRepeat,
    setQueueOpen,
    setPlaylistOpen,
  } = useQueue();

  const [library, setLibrary]         = useState([]);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [volume, setVolume]           = useState(0.8);
  const [view, setView]               = useState("library");
  const [gridView, setGridView]       = useState(false);
  const [search, setSearch]           = useState("");
  const [analyser, setAnalyser]       = useState(null);
  const [mobilePlayerOpen, setMobilePlayerOpen] = useState(false);

  const audioRef    = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef   = useRef(null);
  const analyserRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropRef      = useRef(null);

  // ── Audio Context ─────────────────────────────────────────────────────────
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
    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} }
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
    if (index === queueIndex && currentTrack) { togglePlay(); return; }
    jumpTo(index);
    setIsPlaying(true);
    const track = ctxQueue[index];
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

  const doSkipNext = () => {
    const result = goToNext();
    if (!result) return;
    const audio = audioRef.current;
    const track = result.track;
    if (!track || !audio) return;
    audio.src = api.getStreamUrl(track.id);
    if (audioCtxRef.current) {
      if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} }
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
    }
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const doSkipPrev = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    const result = goToPrev();
    if (!result) return;
    const track = result.track;
    if (!track || !audio) return;
    audio.src = api.getStreamUrl(track.id);
    if (audioCtxRef.current) {
      if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} }
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
    }
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  useEffect(() => {
    api.getTracks().then(({ tracks }) => {
      const mapped = tracks.map(t => ({ ...t, name: t.title }));
      setLibrary(mapped);
      loadQueue(mapped, 0);
    }).catch(console.error);
  }, []);

  const handleFiles = async (files) => {
    const audioFiles = Array.from(files).filter(f => f.type.startsWith("audio/"));
    if (!audioFiles.length) return;
    try {
      const uploaded = await api.uploadTracks(audioFiles);
      const mapped = uploaded.map(t => ({ ...t, name: t.title }));
      setLibrary(prev => {
        const updated = [...prev, ...mapped];
        loadQueue(updated, queueIndex);
        return updated;
      });
    } catch (e) { console.error("Upload error", e); }
  };

  useEffect(() => {
    const drop = dropRef.current;
    if (!drop) return;
    const prevent = e => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = e => { prevent(e); handleFiles(e.dataTransfer.files); };
    drop.addEventListener("dragover", prevent);
    drop.addEventListener("drop", onDrop);
    return () => { drop.removeEventListener("dragover", prevent); drop.removeEventListener("drop", onDrop); };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime     = () => setProgress(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnded    = () => doSkipNext();
    const onPlay     = () => setIsPlaying(true);
    const onPause    = () => setIsPlaying(false);
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
  }, [queueIndex, repeat, shuffled]);

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
      setLibrary(prev => {
        const updated = prev.filter(t => t.id !== id);
        loadQueue(updated, Math.min(queueIndex, Math.max(0, updated.length - 1)));
        if (!updated.length) setIsPlaying(false);
        return updated;
      });
    } catch (e) { console.error("Error deleting track", e); }
  };

  const filtered = library.filter(t =>
    (t.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (t.artist||"").toLowerCase().includes(search.toLowerCase())
  );
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  // ── Shared control bar (used in sidebar and mobile expanded view) ─────────
  const ControlBar = ({ compact = false }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: compact ? 12 : 16 }}>
      <button onClick={toggleShuffle} className={`ctrl-btn ${shuffled ? "active" : ""}`}
        style={{ background: "none", border: "none", color: shuffled ? th.accent : th.muted, cursor: "pointer", padding: 4 }}>
        <ShuffleIcon size={compact ? 14 : 16} />
      </button>
      <button onClick={doSkipPrev} className="ctrl-btn"
        style={{ background: "none", border: "none", color: th.text, cursor: "pointer", padding: 4 }}>
        <SkipPrev size={compact ? 20 : 22} />
      </button>
      <button onClick={togglePlay} className="play-btn" style={{
        width: compact ? 46 : 52, height: compact ? 46 : 52, borderRadius: "50%",
        background: `linear-gradient(135deg, ${th.accent}, ${th.accent2})`,
        border: "none", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: th.glow, transition: "all 0.2s",
      }}>
        {isPlaying ? <PauseIcon size={compact ? 20 : 22} /> : <PlayIcon size={compact ? 20 : 22} />}
      </button>
      <button onClick={doSkipNext} className="ctrl-btn"
        style={{ background: "none", border: "none", color: th.text, cursor: "pointer", padding: 4 }}>
        <SkipNext size={compact ? 20 : 22} />
      </button>
      <button onClick={cycleRepeat} className={`ctrl-btn ${repeat !== "none" ? "active" : ""}`}
        style={{ background: "none", border: "none", color: repeat !== "none" ? th.accent : th.muted, cursor: "pointer", padding: 4 }}>
        {repeat === "one"
          ? <span style={{ fontSize: 10, fontFamily: "var(--font-display,monospace)", letterSpacing: 1 }}>↺1</span>
          : <RepeatIcon size={compact ? 14 : 16} />}
      </button>
    </div>
  );

  // ── Track list (reused in library view) ──────────────────────────────────
  const TrackList = () => (
    <div className="fadeIn">
      {library.length === 0 ? (
        <div className="nw-empty-state">
          <div className="nw-empty-icon"><MusicIcon size={32} /></div>
          <div>
            <div className="nw-empty-title">YOUR LIBRARY IS EMPTY</div>
            <div className="nw-empty-sub">Drop audio files here or click Add Music</div>
          </div>
          <button onClick={() => fileInputRef.current.click()} className="nw-upload-cta"
            style={{ background: `linear-gradient(135deg, ${th.accent}33, ${th.accent2}33)`, border: `1px solid ${th.accent}66`, color: th.accent }}>
            UPLOAD MUSIC
          </button>
        </div>
      ) : gridView ? (
        <div className="nw-grid">
          {filtered.map(track => (
            <div key={track.id} className="nw-grid-card"
              onClick={() => { loadQueue(library, library.indexOf(track)); setIsPlaying(true); }}
              style={{
                background: currentTrack?.id === track.id ? th.accent + "18" : th.card,
                border: `1px solid ${currentTrack?.id === track.id ? th.accent + "66" : th.border}`,
              }}>
              <AlbumArt song={track} theme={th} size={150} />
              <div style={{ padding: "8px 10px" }}>
                <div className="nw-grid-title" style={{ color: th.text }}>{track.name || track.title}</div>
                <div className="nw-grid-artist" style={{ color: th.muted }}>{track.artist}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="nw-table">
          <thead>
            <tr style={{ borderBottom: `1px solid ${th.border}` }}>
              {["#","TITLE","ARTIST",""].map((h, i) => (
                <th key={i} className="nw-th" style={{ color: th.muted, width: i === 0 ? 40 : i === 3 ? 40 : "auto" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((track, idx) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <tr key={track.id}
                  className={`track-row ${isActive ? "active" : ""}`}
                  onClick={() => { loadQueue(library, library.indexOf(track)); setIsPlaying(true); }}
                  style={{
                    background: isActive ? th.accent + "18" : "transparent",
                    cursor: "pointer", transition: "background 0.15s",
                    borderBottom: `1px solid ${th.border}22`,
                  }}>
                  <td className="nw-td" style={{ width: 40 }}>
                    {isActive && isPlaying ? (
                      <div className="nw-bars">
                        {[1,1.5,0.8].map((d,j) => <div key={j} style={{ width:3, background:th.accent, borderRadius:1, animation:`pulse ${d}s ease-in-out infinite`, height:[10,14,8][j] }} />)}
                      </div>
                    ) : (
                      <span style={{ fontSize:12, color: isActive ? th.accent : th.muted, letterSpacing:1 }}>{String(idx+1).padStart(2,"0")}</span>
                    )}
                  </td>
                  <td className="nw-td">
                    <span style={{ fontSize:14, fontWeight:500, color: isActive ? th.accent : th.text }}>{track.name || track.title}</span>
                  </td>
                  <td className="nw-td nw-td-artist">
                    <span style={{ fontSize:13, color:th.muted }}>{track.artist}</span>
                  </td>
                  <td className="nw-td" style={{ width:40 }}>
                    <button onClick={e => { e.stopPropagation(); removeTrack(track.id); }}
                      className="nw-delete-btn"
                      style={{ color:th.muted }}
                      onMouseEnter={e => { e.currentTarget.style.color = th.accent3; e.currentTarget.style.opacity = 1; }}
                      onMouseLeave={e => { e.currentTarget.style.color = th.muted; e.currentTarget.style.opacity = 0.5; }}>
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
  );

  return (
    <>
      <audio ref={audioRef} crossOrigin="anonymous" />
      <input ref={fileInputRef} type="file" accept="audio/*" multiple style={{ display:"none" }}
        onChange={e => handleFiles(e.target.files)} />

      {/* Phase 3 slide-in panels */}
      <QueuePanel />
      <PlaylistPanel currentTrack={currentTrack} />

      {/* ── Mobile expanded player overlay ─────────────────────────────── */}
      {mobilePlayerOpen && (
        <div className="nw-mobile-expanded" style={{ background: th.bg }}>
          {/* Header */}
          <div className="nw-mob-exp-header" style={{ borderBottom: `1px solid ${th.border}` }}>
            <button onClick={() => setMobilePlayerOpen(false)} className="nw-mob-back"
              style={{ color: th.muted }}>
              ↓
            </button>
            <span style={{ fontFamily:"var(--font-display,'Orbitron',monospace)", fontSize:11, letterSpacing:3, color:th.muted }}>NOW PLAYING</span>
            <ThemeSwitcher />
          </div>

          {/* Album art */}
          <div className="nw-mob-art" style={{ boxShadow: th.glow }}>
            <div className={`vinyl ${isPlaying ? "playing" : "paused"}`} style={{ borderRadius:20 }}>
              <AlbumArt song={currentTrack} theme={th} size={280} />
            </div>
          </div>

          {/* Track info */}
          <div className="nw-mob-info">
            <div className="nw-mob-title" style={{ color: th.text }}>
              {currentTrack?.name || currentTrack?.title || "NO TRACK LOADED"}
            </div>
            <div className="nw-mob-artist" style={{ color: th.accent2 }}>{currentTrack?.artist || "—"}</div>
          </div>

          {/* Progress */}
          <div className="nw-mob-progress">
            <div onClick={seek} className="nw-progress-track" style={{ background: th.border }}>
              <div style={{
                height:"100%", width:`${progressPct}%`,
                background:`linear-gradient(90deg, ${th.accent}, ${th.accent2})`,
                borderRadius:2, boxShadow:`0 0 8px ${th.accent}88`, transition:"width 0.1s",
              }} />
            </div>
            <div className="nw-progress-times" style={{ color: th.muted }}>
              <span>{formatTime(progress)}</span><span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ padding: "0 32px" }}>
            <ControlBar />
          </div>

          {/* Volume */}
          <div className="nw-mob-volume">
            <VolumeIcon size={14} />
            <input type="range" min="0" max="1" step="0.01" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))} style={{ flex:1 }} />
            <span style={{ fontSize:11, color:th.muted, minWidth:28, textAlign:"right" }}>{Math.round(volume*100)}</span>
          </div>

          {/* Visualizer */}
          <div className="nw-mob-visualizer" style={{ background:th.card, border:`1px solid ${th.border}` }}>
            <Visualizer analyser={analyser} isPlaying={isPlaying} theme={th} />
          </div>

          {/* Queue / Playlists */}
          <div className="nw-mob-panel-btns">
            <button className="nw-panel-btn" onClick={() => setPlaylistOpen(true)}
              style={{ border:`1px solid ${th.border}`, color:th.muted, background:"transparent" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=th.accent; e.currentTarget.style.color=th.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=th.border; e.currentTarget.style.color=th.muted; }}>
              ≡ PLAYLISTS
            </button>
            <button className="nw-panel-btn" onClick={() => setQueueOpen(true)}
              style={{ border:`1px solid ${th.border}`, color:th.muted, background:"transparent", position:"relative" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=th.accent; e.currentTarget.style.color=th.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=th.border; e.currentTarget.style.color=th.muted; }}>
              ♫ QUEUE
              {ctxQueue.length > 0 && <span className="nw-badge" style={{ background:th.accent, color:th.bg }}>{ctxQueue.length}</span>}
            </button>
            <button className="nw-panel-btn" onClick={() => fileInputRef.current.click()}
              style={{ border:`1px solid ${th.border}`, color:th.muted, background:"transparent" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=th.accent; e.currentTarget.style.color=th.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=th.border; e.currentTarget.style.color=th.muted; }}>
              + ADD
            </button>
          </div>
        </div>
      )}

      {/* ── Main App Shell ──────────────────────────────────────────────── */}
      <div ref={dropRef} className="nw-app" style={{ background: th.bg, color: th.text }}>

        {/* ── Top Bar ─────────────────────────────────────────────────── */}
        <div className="nw-topbar" style={{ borderBottom:`1px solid ${th.border}`, background:th.surface }}>
          <div className="nw-logo">
            <div className="nw-logo-icon" style={{ background:`linear-gradient(135deg, ${th.accent}, ${th.accent2})`, boxShadow:th.glow }}>
              <MusicIcon size={16} />
            </div>
            <span style={{ fontFamily:"var(--font-display,'Orbitron',monospace)", fontSize:16, fontWeight:700, color:th.accent, letterSpacing:2 }}>
              NEON<span style={{ color:th.accent2 }}>WAVE</span>
            </span>
          </div>

          <div className="nw-view-btns">
            {["library","queue"].map(v => (
              <button key={v} onClick={() => setView(v)} className="nw-view-btn"
                style={{
                  border:`1px solid ${view===v ? th.accent : th.border}`,
                  background: view===v ? th.accent+"22" : "transparent",
                  color: view===v ? th.accent : th.muted,
                }}>
                {v}
              </button>
            ))}
          </div>

          <div className="nw-topbar-right">
            <ThemeSwitcher />
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="nw-body">

          {/* ── Desktop Sidebar ─────────────────────────────────────── */}
          <div className="nw-sidebar" style={{ borderRight:`1px solid ${th.border}`, background:th.surface }}>
            <div className="nw-sidebar-inner">
              {/* Vinyl art */}
              <div className="nw-art-wrap">
                <div className={`vinyl ${isPlaying ? "playing" : "paused"}`}
                  style={{ borderRadius:12, boxShadow: currentTrack ? th.glow : "none", transition:"box-shadow 0.5s" }}>
                  <AlbumArt song={currentTrack} theme={th} size={220} />
                </div>
              </div>

              {/* Track info */}
              <div className="nw-track-info">
                <div className="nw-track-name" style={{ color:th.text }}>
                  {currentTrack?.name || currentTrack?.title || "NO TRACK LOADED"}
                </div>
                <div className="nw-track-artist" style={{ color:th.accent2 }}>{currentTrack?.artist || "—"}</div>
              </div>

              {/* Progress */}
              <div>
                <div onClick={seek} className="nw-progress-track" style={{ background:th.border, marginBottom:6 }}>
                  <div style={{
                    height:"100%", width:`${progressPct}%`,
                    background:`linear-gradient(90deg, ${th.accent}, ${th.accent2})`,
                    borderRadius:2, boxShadow:`0 0 8px ${th.accent}88`, transition:"width 0.1s",
                  }} />
                </div>
                <div className="nw-progress-times" style={{ color:th.muted }}>
                  <span>{formatTime(progress)}</span><span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <ControlBar />

              {/* Volume */}
              <div className="nw-volume-row">
                <VolumeIcon size={14} />
                <input type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))} style={{ flex:1 }} />
                <span style={{ fontSize:11, color:th.muted, minWidth:28, textAlign:"right" }}>{Math.round(volume*100)}</span>
              </div>

              {/* Visualizer */}
              <div style={{ background:th.card, borderRadius:8, border:`1px solid ${th.border}`, padding:"8px 12px", overflow:"hidden" }}>
                <Visualizer analyser={analyser} isPlaying={isPlaying} theme={th} />
              </div>

              {/* Queue + Playlist buttons */}
              <div style={{ display:"flex", gap:8 }}>
                <button className="nw-panel-btn" onClick={() => setPlaylistOpen(true)}
                  style={{ flex:1, border:`1px solid ${th.border}`, color:th.muted, background:"transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=th.accent; e.currentTarget.style.color=th.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=th.border; e.currentTarget.style.color=th.muted; }}>
                  ≡ LISTS
                </button>
                <button className="nw-panel-btn" onClick={() => setQueueOpen(true)}
                  style={{ flex:1, border:`1px solid ${th.border}`, color:th.muted, background:"transparent", position:"relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=th.accent; e.currentTarget.style.color=th.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=th.border; e.currentTarget.style.color=th.muted; }}>
                  ♫ QUEUE
                  {ctxQueue.length > 0 && <span className="nw-badge" style={{ background:th.accent, color:th.bg }}>{ctxQueue.length}</span>}
                </button>
              </div>

              {/* Upload */}
              <button onClick={() => fileInputRef.current.click()} className="upload-btn"
                style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px dashed ${th.border}`, background:"transparent", color:th.muted, fontFamily:"var(--font-body,'Rajdhani',sans-serif)", fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:1, textTransform:"uppercase", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}>
                <PlusIcon size={14} /> Add Music
              </button>
            </div>
          </div>

          {/* ── Main Content ─────────────────────────────────────────── */}
          <div className="nw-main">
            {/* Search + view toggle bar */}
            <div className="nw-search-bar" style={{ borderBottom:`1px solid ${th.border}`, background:th.surface }}>
              <input type="text" placeholder="Search your library..." value={search}
                onChange={e => setSearch(e.target.value)} className="nw-search-input"
                style={{ border:`1px solid ${th.border}`, background:th.card, color:th.text }}
                onFocus={e => e.target.style.borderColor = th.accent}
                onBlur={e => e.target.style.borderColor = th.border} />
              <div style={{ display:"flex", gap:4 }}>
                {[["list",<ListIcon size={16}/>],["grid",<GridIcon size={16}/>]].map(([id,icon]) => (
                  <button key={id} onClick={() => setGridView(id==="grid")}
                    style={{ width:34, height:34, borderRadius:6,
                      border:`1px solid ${(id==="grid")===gridView ? th.accent : th.border}`,
                      background:(id==="grid")===gridView ? th.accent+"22" : "transparent",
                      color:(id==="grid")===gridView ? th.accent : th.muted,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {icon}
                  </button>
                ))}
              </div>
              <span className="nw-track-count" style={{ color:th.muted }}>{library.length} TRACKS</span>
            </div>

            {/* Library / Queue content */}
            <div className="nw-content-scroll">
              {view === "library" && <TrackList />}
              {view === "queue" && (
                <div className="fadeIn">
                  {ctxQueue.length === 0 ? (
                    <div style={{ textAlign:"center", padding:40, color:th.muted }}>
                      <div style={{ fontFamily:"var(--font-display,'Orbitron',monospace)", fontSize:13, letterSpacing:2, marginBottom:8 }}>QUEUE IS EMPTY</div>
                      <div style={{ fontSize:13 }}>Add tracks to your library to start playing</div>
                    </div>
                  ) : ctxQueue.map((track, idx) => {
                    const isActive = idx === queueIndex;
                    return (
                      <div key={track.id+idx} onClick={() => playTrack(idx)} className={`track-row ${isActive?"active":""}`}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, background:isActive ? th.accent+"18" : "transparent", border:`1px solid ${isActive?th.accent+"44":"transparent"}`, cursor:"pointer", marginBottom:4, transition:"all 0.15s" }}>
                        <div style={{ width:28, height:28, borderRadius:6, background:isActive?th.accent+"33":th.border, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {isActive && isPlaying
                            ? <div style={{ display:"flex", gap:1.5, alignItems:"flex-end", height:12 }}>{[1,1.5,0.8].map((d,j)=><div key={j} style={{ width:2.5, background:th.accent, borderRadius:1, animation:`pulse ${d}s ease-in-out infinite`, height:[8,12,6][j] }}/>)}</div>
                            : <span style={{ fontSize:10, color:isActive?th.accent:th.muted, letterSpacing:1 }}>{String(idx+1).padStart(2,"0")}</span>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:500, color:isActive?th.accent:th.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.name||track.title}</div>
                          <div style={{ fontSize:12, color:th.muted }}>{track.artist}</div>
                        </div>
                        {isActive && <div style={{ fontSize:10, color:th.accent, letterSpacing:2, fontFamily:"var(--font-display,monospace)" }}>NOW PLAYING</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile bottom mini-player bar ──────────────────────────── */}
        <div className="nw-mobile-bar" style={{ background:th.surface, borderTop:`1px solid ${th.border}` }}
          onClick={() => setMobilePlayerOpen(true)}>
          {/* Mini art */}
          <div className="nw-mob-mini-art" style={{ borderRadius:8, overflow:"hidden", boxShadow: currentTrack ? th.glow : "none" }}>
            <AlbumArt song={currentTrack} theme={th} size={46} />
          </div>
          {/* Track info + progress */}
          <div className="nw-mob-mini-info">
            <div className="nw-mob-mini-title" style={{ color: currentTrack ? th.text : th.muted }}>
              {currentTrack?.name || currentTrack?.title || "No track"}
            </div>
            <div className="nw-mob-mini-artist" style={{ color:th.muted }}>{currentTrack?.artist || "—"}</div>
            {/* Thin progress line */}
            <div style={{ height:2, background:th.border, borderRadius:1, marginTop:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progressPct}%`, background:`linear-gradient(90deg,${th.accent},${th.accent2})`, transition:"width 0.1s" }} />
            </div>
          </div>
          {/* Quick controls */}
          <div className="nw-mob-mini-controls" onClick={e => e.stopPropagation()}>
            <button onClick={doSkipPrev} className="ctrl-btn"
              style={{ background:"none", border:"none", color:th.text, cursor:"pointer", padding:6 }}>
              <SkipPrev size={20} />
            </button>
            <button onClick={togglePlay} className="play-btn"
              style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${th.accent},${th.accent2})`, border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:th.glow }}>
              {isPlaying ? <PauseIcon size={18}/> : <PlayIcon size={18}/>}
            </button>
            <button onClick={doSkipNext} className="ctrl-btn"
              style={{ background:"none", border:"none", color:th.text, cursor:"pointer", padding:6 }}>
              <SkipNext size={20} />
            </button>
          </div>
        </div>

        {/* Drop hint (desktop only) */}
        <div className="nw-drop-hint"
          style={{ background:th.card, border:`1px solid ${th.border}`, color:th.muted }}>
          DROP AUDIO FILES ANYWHERE
        </div>
      </div>
    </>
  );
}
