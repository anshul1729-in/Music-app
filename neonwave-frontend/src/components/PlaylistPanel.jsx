// src/components/PlaylistPanel.jsx
import { useState, useEffect, useCallback } from "react";
import { useQueue } from "../contexts/QueueContext";
import api from "../api";

function formatDuration(s) {
  if (!s || s < 60) return `${s || 0}s`;
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

// ─── Create Playlist Modal ───────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const pl = await api.createPlaylist(name.trim(), desc.trim() || null);
      onCreate(pl);
      onClose();
    } catch (e) {
      alert("Failed to create playlist: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 300,
        background: "var(--bg2)",
        border: "1px solid var(--border-hover)",
        borderRadius: "18px",
        padding: "32px",
        width: "min(400px, 90vw)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.7), var(--glow)",
        animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: "16px",
          letterSpacing: "3px", color: "var(--text-bright)",
          marginBottom: "24px",
        }}>NEW PLAYLIST</h3>

        <label style={{ display: "block", marginBottom: "16px" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "2px", color: "var(--text-dim)", marginBottom: "6px", textTransform: "uppercase" }}>Name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            autoFocus
            placeholder="My awesome playlist..."
            style={{
              width: "100%",
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-bright)",
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </label>

        <label style={{ display: "block", marginBottom: "28px" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "2px", color: "var(--text-dim)", marginBottom: "6px", textTransform: "uppercase" }}>Description (optional)</div>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="For late nights..."
            style={{
              width: "100%",
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-bright)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </label>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "10px 20px",
            color: "var(--text-dim)", fontFamily: "var(--font-display)",
            fontSize: "11px", letterSpacing: "2px", cursor: "pointer",
          }}>CANCEL</button>
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            style={{
              background: "var(--accent)", border: "none",
              borderRadius: "8px", padding: "10px 24px",
              color: "var(--bg)", fontFamily: "var(--font-display)",
              fontSize: "11px", letterSpacing: "2px", cursor: "pointer",
              opacity: name.trim() ? 1 : 0.4,
              fontWeight: 700,
            }}
          >{loading ? "CREATING..." : "CREATE"}</button>
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.9) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }`}</style>
    </>
  );
}

function EditModal({ playlist, onClose, onSave }) {
  const [name, setName] = useState(playlist.name || "");
  const [desc, setDesc] = useState(playlist.description || "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const updated = await api.updatePlaylist(playlist.id, {
        name: name.trim(),
        description: desc.trim() || null,
      });
      onSave(updated);
      onClose();
    } catch (e) {
      alert("Failed to update playlist: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 300,
        background: "var(--bg2)",
        border: "1px solid var(--border-hover)",
        borderRadius: "18px",
        padding: "32px",
        width: "min(400px, 90vw)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.7), var(--glow)",
        animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: "16px",
          letterSpacing: "3px", color: "var(--text-bright)",
          marginBottom: "24px",
        }}>EDIT PLAYLIST</h3>

        <label style={{ display: "block", marginBottom: "16px" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "2px", color: "var(--text-dim)", marginBottom: "6px", textTransform: "uppercase" }}>Name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            autoFocus
            placeholder="Playlist name..."
            style={{
              width: "100%",
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-bright)",
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </label>

        <label style={{ display: "block", marginBottom: "28px" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "2px", color: "var(--text-dim)", marginBottom: "6px", textTransform: "uppercase" }}>Description (optional)</div>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Playlist description..."
            style={{
              width: "100%",
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-bright)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </label>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "10px 20px",
            color: "var(--text-dim)", fontFamily: "var(--font-display)",
            fontSize: "11px", letterSpacing: "2px", cursor: "pointer",
          }}>CANCEL</button>
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            style={{
              background: "var(--accent)", border: "none",
              borderRadius: "8px", padding: "10px 24px",
              color: "var(--bg)", fontFamily: "var(--font-display)",
              fontSize: "11px", letterSpacing: "2px", cursor: "pointer",
              opacity: name.trim() ? 1 : 0.4,
              fontWeight: 700,
            }}
          >{loading ? "SAVING..." : "SAVE"}</button>
        </div>
      </div>
    </>
  );
}

// ─── Playlist Detail View ────────────────────────────────────────────────────
function PlaylistDetail({ playlist, onBack, onDelete, onUpdate }) {
  const [tracks, setTracks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { loadQueue, addToQueue, playNext: playNextInQueue } = useQueue();

  useEffect(() => {
    api.getPlaylistTracks(playlist.id)
      .then(setTracks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playlist.id]);

  const playAll = () => {
    if (tracks.length) loadQueue(tracks, 0);
  };

  const removeTrack = async (trackId) => {
    try {
      await api.removeFromPlaylist(playlist.id, trackId);
      setTracks(prev => prev.filter(t => t.id !== trackId));
    } catch (e) { alert("Failed to remove track"); }
  };

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "none", color: "var(--text-dim)",
            cursor: "pointer", fontFamily: "var(--font-display)",
            fontSize: "10px", letterSpacing: "2px", marginBottom: "16px",
            padding: 0, display: "flex", alignItems: "center", gap: "6px",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
        >← PLAYLISTS</button>

        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "18px",
          letterSpacing: "3px", color: "var(--text-bright)",
          marginBottom: "4px",
        }}>{playlist.name.toUpperCase()}</h2>
        {playlist.description && (
          <p style={{ color: "var(--text-dim)", fontFamily: "var(--font-body)", fontSize: "13px", marginBottom: "8px" }}>
            {playlist.description}
          </p>
        )}
        <p style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "11px", marginBottom: "16px" }}>
          {tracks.length} tracks · {formatDuration(totalDuration)}
        </p>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={playAll} style={actionBtnStyle("var(--accent)", "var(--bg)")}>
            ▶ PLAY ALL
          </button>
          <button
            onClick={() => addToQueue(tracks)}
            style={actionBtnStyle("transparent", "var(--accent)", "var(--border)")}
          >+ ADD TO QUEUE</button>
          <button
            onClick={() => setEditing(true)}
            style={actionBtnStyle("transparent", "var(--text)", "var(--border)")}
          >✎ EDIT</button>
          <button
            onClick={() => {
              if (confirm(`Delete "${playlist.name}"?`)) onDelete(playlist.id);
            }}
            style={{ ...actionBtnStyle("transparent", "var(--text-dim)", "var(--border)"), marginLeft: "auto" }}
          >🗑</button>
        </div>
      </div>

      {/* Tracks */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontFamily: "var(--font-body)" }}>Loading...</div>
        ) : tracks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontFamily: "var(--font-body)", fontSize: "14px" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.3 }}>♫</div>
            <div>No tracks yet</div>
            <div style={{ fontSize: "12px", marginTop: "6px", opacity: 0.5 }}>Right-click any song to add it here</div>
          </div>
        ) : tracks.map((track, i) => (
          <div key={track.id} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "10px 12px", borderRadius: "8px",
            transition: "background 0.15s", cursor: "pointer",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--card-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          onClick={() => loadQueue(tracks, i)}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)", width: "20px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>

            <div style={{
              width: 36, height: 36, borderRadius: "6px", flexShrink: 0,
              background: "var(--bg3)", overflow: "hidden",
            }}>
              {track.art_url
                ? <img src={track.art_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>♪</div>
              }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-bright)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
            </div>

            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)", flexShrink: 0 }}>{formatDuration(track.duration)}</span>

            <button
              onClick={e => { e.stopPropagation(); playNextInQueue(track); }}
              title="Play next"
              style={{ ...iconBtnStyle, opacity: 0, transition: "opacity 0.15s, color 0.15s" }}
              className="track-action"
            >▷</button>

            <button
              onClick={e => { e.stopPropagation(); removeTrack(track.id); }}
              title="Remove from playlist"
              style={{ ...iconBtnStyle }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--accent3)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
            >✕</button>
          </div>
        ))}
      </div>
      {editing && (
        <EditModal
          playlist={playlist}
          onClose={() => setEditing(false)}
          onSave={onUpdate}
        />
      )}
    </div>
  );
}

// ─── Main PlaylistPanel ──────────────────────────────────────────────────────
export default function PlaylistPanel({ currentTrack }) {
  const { playlistOpen, setPlaylistOpen } = useQueue();
  const [playlists, setPlaylists]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [creating, setCreating]           = useState(false);
  const [selected, setSelected]           = useState(null);
  const [addingTo, setAddingTo]           = useState(null); // playlist id being added to

  useEffect(() => {
    if (!playlistOpen) return;
    api.getPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playlistOpen]);

  const handleCreate = (pl) => setPlaylists(prev => [pl, ...prev]);

  const handleDelete = async (id) => {
    try {
      await api.deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      setSelected(null);
    } catch (e) { alert("Failed to delete"); }
  };

  const handleUpdate = useCallback((updatedPlaylist) => {
    setPlaylists(prev =>
      prev.map(pl => (pl.id === updatedPlaylist.id ? { ...pl, ...updatedPlaylist } : pl))
    );
  }, []);

  const addCurrentTrack = async (playlistId) => {
    if (!currentTrack) return;
    try {
      await api.addTrackToPlaylist(playlistId, currentTrack.id);
      setAddingTo(playlistId);
      setTimeout(() => setAddingTo(null), 1500);
    } catch (e) { alert("Failed to add track"); }
  };

  if (!playlistOpen) return null;

  const selectedPlaylist = playlists.find(p => p.id === selected);

  return (
    <>
      <div onClick={() => setPlaylistOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 199, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }} />

      <div style={{
        position: "fixed",
        left: 0, top: 0, bottom: 0,
        width: "min(400px, 100vw)",
        background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        animation: "slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "20px 0 60px rgba(0,0,0,0.5)",
      }}>
        {selected && selectedPlaylist ? (
          <PlaylistDetail
            playlist={selectedPlaylist}
            onBack={() => setSelected(null)}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "14px", letterSpacing: "3px", color: "var(--text-bright)", marginBottom: "2px" }}>PLAYLISTS</h2>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-dim)" }}>{playlists.length} playlist{playlists.length !== 1 ? "s" : ""}</span>
                </div>
                <button onClick={() => setPlaylistOpen(false)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "20px" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text-bright)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                >✕</button>
              </div>

              <button
                onClick={() => setCreating(true)}
                style={actionBtnStyle("var(--accent)", "var(--bg)")}
              >+ NEW PLAYLIST</button>
            </div>

            {/* Current track shortcut */}
            {currentTrack && (
              <div style={{
                padding: "12px 20px",
                background: "var(--playlist-selected)",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
              }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "1px", color: "var(--accent)", marginBottom: "8px", textTransform: "uppercase" }}>
                  ♪ Add "{currentTrack.title}" to:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {playlists.slice(0, 4).map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => addCurrentTrack(pl.id)}
                      style={{
                        background: addingTo === pl.id ? "var(--accent)" : "var(--bg3)",
                        border: "1px solid var(--border)",
                        borderRadius: "100px",
                        padding: "4px 12px",
                        color: addingTo === pl.id ? "var(--bg)" : "var(--text)",
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {addingTo === pl.id ? "✓ Added" : pl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontFamily: "var(--font-body)" }}>Loading...</div>
              ) : playlists.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.2 }}>♫</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", letterSpacing: "2px", color: "var(--text-dim)", marginBottom: "8px" }}>NO PLAYLISTS YET</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-dim)", opacity: 0.6 }}>Create one to get started</div>
                </div>
              ) : playlists.map(pl => (
                <div
                  key={pl.id}
                  onClick={() => setSelected(pl.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "14px 16px", borderRadius: "10px",
                    cursor: "pointer", transition: "background 0.15s",
                    marginBottom: "2px",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--card-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Art placeholder */}
                  <div style={{
                    width: 48, height: 48, borderRadius: "10px",
                    background: "linear-gradient(135deg, var(--accent2), var(--accent))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", flexShrink: 0,
                    opacity: 0.7,
                  }}>♫</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 500, color: "var(--text-bright)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-dim)" }}>
                      {pl.track_count || 0} tracks
                      {pl.description && ` · ${pl.description}`}
                    </div>
                  </div>

                  <span style={{ color: "var(--text-dim)", fontSize: "16px" }}>›</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)} onCreate={handleCreate} />}

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

const actionBtnStyle = (bg, color, border = "none") => ({
  background: bg,
  border: border !== "none" ? `1px solid ${border}` : "none",
  borderRadius: "8px",
  padding: "9px 20px",
  color,
  fontFamily: "var(--font-display)",
  fontSize: "11px",
  letterSpacing: "2px",
  cursor: "pointer",
  fontWeight: 700,
  transition: "all 0.15s",
});

const iconBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--text-dim)",
  cursor: "pointer",
  fontSize: "14px",
  padding: "4px 6px",
  flexShrink: 0,
  transition: "color 0.15s",
};
