// src/components/QueuePanel.jsx
import { useRef } from "react";
import { useQueue } from "../contexts/QueueContext";

function formatDuration(s) {
  if (!s) return "--:--";
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function TrackRow({ item, onPlay, onRemove, isDragging, onDragStart, onDragOver, onDrop }) {
  const { track, rawIndex, isCurrent, isPlayed } = item;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(rawIndex)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(rawIndex); }}
      onDrop={() => onDrop(rawIndex)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        borderRadius: "8px",
        background: isCurrent
          ? "var(--playlist-selected)"
          : "transparent",
        border: isCurrent
          ? "1px solid var(--border-hover)"
          : "1px solid transparent",
        cursor: "grab",
        opacity: isPlayed ? 0.4 : 1,
        transition: "all 0.15s",
        marginBottom: "2px",
      }}
      onMouseEnter={e => {
        if (!isCurrent) e.currentTarget.style.background = "var(--card-hover)";
      }}
      onMouseLeave={e => {
        if (!isCurrent) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Drag handle */}
      <span style={{ color: "var(--text-dim)", fontSize: "13px", cursor: "grab", flexShrink: 0 }}>⠿</span>

      {/* Album art / now playing */}
      <div style={{
        width: 36, height: 36,
        borderRadius: "6px",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        background: track.art_url ? "none" : "var(--bg3)",
      }}>
        {track.art_url
          ? <img src={track.art_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>♪</span>
        }
        {isCurrent && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <NowPlayingBars />
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          fontWeight: 500,
          color: isCurrent ? "var(--accent)" : "var(--text-bright)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>{track.title}</div>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "var(--text-dim)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>{track.artist}</div>
      </div>

      {/* Duration */}
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--text-dim)",
        flexShrink: 0,
      }}>{formatDuration(track.duration)}</span>

      {/* Play button */}
      <button
        onClick={() => onPlay(rawIndex)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-dim)",
          cursor: "pointer",
          fontSize: "14px",
          padding: "4px",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
        title="Play now"
      >▶</button>

      {/* Remove button */}
      <button
        onClick={() => onRemove(rawIndex)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-dim)",
          cursor: "pointer",
          fontSize: "13px",
          padding: "4px",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent3)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
        title="Remove from queue"
      >✕</button>
    </div>
  );
}

function NowPlayingBars() {
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "14px" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 3,
          background: "var(--accent)",
          borderRadius: "2px",
          animation: `barPulse${i} 0.8s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.15}s`,
          height: `${6 + i * 3}px`,
        }} />
      ))}
      <style>{`
        @keyframes barPulse1 { from { height: 4px } to { height: 12px } }
        @keyframes barPulse2 { from { height: 8px } to { height: 4px } }
        @keyframes barPulse3 { from { height: 6px } to { height: 14px } }
      `}</style>
    </div>
  );
}

export default function QueuePanel() {
  const {
    queue, queueIndex, upcomingTracks, shuffled, repeat,
    removeFromQueue, reorderQueue, clearQueue, jumpTo,
    toggleShuffle, cycleRepeat, queueOpen, setQueueOpen,
  } = useQueue();

  const dragFrom = useRef(null);

  if (!queueOpen) return null;

  const upcoming = upcomingTracks.filter(item => !item.isPlayed || item.isCurrent);
  const played = upcomingTracks.filter(item => item.isPlayed);

  const repeatLabel = repeat === "none" ? "↺" : repeat === "all" ? "↺ ALL" : "↺ 1";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setQueueOpen(false)}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 199,
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        right: 0, top: 0, bottom: 0,
        width: "min(420px, 100vw)",
        background: "var(--bg2)",
        borderLeft: "1px solid var(--border)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                letterSpacing: "3px",
                color: "var(--text-bright)",
                marginBottom: "2px",
              }}>QUEUE</h2>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-dim)" }}>
                {queue.length} tracks
              </span>
            </div>
            <button
              onClick={() => setQueueOpen(false)}
              style={{
                background: "none", border: "none",
                color: "var(--text-dim)", cursor: "pointer",
                fontSize: "20px", lineHeight: 1,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-bright)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
            >✕</button>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <QueueControlBtn
              active={shuffled}
              onClick={toggleShuffle}
              title="Shuffle"
            >⇌ SHUFFLE</QueueControlBtn>

            <QueueControlBtn
              active={repeat !== "none"}
              onClick={cycleRepeat}
              title="Repeat"
            >{repeatLabel} REPEAT</QueueControlBtn>

            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-display)",
                  fontSize: "10px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent3)"; e.currentTarget.style.color = "var(--accent3)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
              >CLEAR</button>
            )}
          </div>
        </div>

        {/* Track list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
          {queue.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: "200px", gap: "12px",
              color: "var(--text-dim)", fontFamily: "var(--font-body)", fontSize: "14px",
            }}>
              <span style={{ fontSize: "40px", opacity: 0.3 }}>♫</span>
              <span>Queue is empty</span>
              <span style={{ fontSize: "12px", opacity: 0.5 }}>Add tracks from your library</span>
            </div>
          ) : (
            <>
              {/* Now playing label */}
              {upcoming.length > 0 && (
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "9px",
                  letterSpacing: "3px",
                  color: "var(--accent)",
                  padding: "4px 16px 8px",
                  textTransform: "uppercase",
                }}>NOW PLAYING</div>
              )}

              {upcoming.map((item) => (
                <TrackRow
                  key={item.rawIndex}
                  item={item}
                  onPlay={() => jumpTo(item.rawIndex)}
                  onRemove={removeFromQueue}
                  onDragStart={(i) => { dragFrom.current = i; }}
                  onDragOver={() => {}}
                  onDrop={(i) => {
                    if (dragFrom.current !== null && dragFrom.current !== i) {
                      reorderQueue(dragFrom.current, i);
                    }
                    dragFrom.current = null;
                  }}
                />
              ))}

              {/* History */}
              {played.length > 0 && (
                <>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "9px",
                    letterSpacing: "3px",
                    color: "var(--text-dim)",
                    padding: "12px 16px 8px",
                  }}>PLAYED</div>
                  {played.map((item) => (
                    <TrackRow
                      key={item.rawIndex}
                      item={item}
                      onPlay={() => jumpTo(item.rawIndex)}
                      onRemove={removeFromQueue}
                      onDragStart={() => {}}
                      onDragOver={() => {}}
                      onDrop={() => {}}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

function QueueControlBtn({ children, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? "var(--playlist-selected)" : "transparent",
        border: `1px solid ${active ? "var(--border-hover)" : "var(--border)"}`,
        borderRadius: "6px",
        padding: "5px 12px",
        color: active ? "var(--accent)" : "var(--text-dim)",
        fontFamily: "var(--font-display)",
        fontSize: "10px",
        letterSpacing: "1px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => {
        if (!active) { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-bright)"; }
      }}
      onMouseLeave={e => {
        if (!active) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }
      }}
    >{children}</button>
  );
}
