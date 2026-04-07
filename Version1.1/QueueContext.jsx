// src/contexts/QueueContext.jsx
// Manages playback queue, history, and playlist operations
import { createContext, useContext, useState, useCallback, useRef } from "react";

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  // The full ordered queue of tracks
  const [queue, setQueue]         = useState([]);
  // Index into queue of currently playing track
  const [queueIndex, setQueueIndex] = useState(0);
  // Playback history (for prev button across sources)
  const [history, setHistory]     = useState([]);
  // Shuffle state — stores a shuffled order array
  const [shuffled, setShuffled]   = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);
  // Repeat: 'none' | 'all' | 'one'
  const [repeat, setRepeat]       = useState("none");
  // Queue panel open
  const [queueOpen, setQueueOpen] = useState(false);
  // Playlist panel open
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const shuffleOrderRef = useRef([]);

  // ─── Queue Operations ────────────────────────────────────────────────────

  // Replace queue with new tracks and start playing at index
  const loadQueue = useCallback((tracks, startIndex = 0) => {
    setQueue(tracks);
    setQueueIndex(startIndex);
    setHistory([]);
    if (shuffled) {
      const order = generateShuffleOrder(tracks.length, startIndex);
      setShuffleOrder(order);
      shuffleOrderRef.current = order;
    }
  }, [shuffled]);

  // Add tracks to end of queue
  const addToQueue = useCallback((tracks) => {
    setQueue(prev => {
      const newQueue = [...prev, ...(Array.isArray(tracks) ? tracks : [tracks])];
      if (shuffled) {
        // Extend shuffle order with new indices at end
        const newOrder = [...shuffleOrderRef.current];
        for (let i = prev.length; i < newQueue.length; i++) newOrder.push(i);
        setShuffleOrder(newOrder);
        shuffleOrderRef.current = newOrder;
      }
      return newQueue;
    });
  }, [shuffled]);

  // Add track to play next (insert after current)
  const playNext = useCallback((track) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(queueIndex + 1, 0, track);
      return newQueue;
    });
  }, [queueIndex]);

  // Remove track from queue by index
  const removeFromQueue = useCallback((index) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    setQueueIndex(prev => index < prev ? prev - 1 : prev);
  }, []);

  // Reorder queue (drag & drop)
  const reorderQueue = useCallback((fromIndex, toIndex) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      return newQueue;
    });
    // Adjust current index
    setQueueIndex(prev => {
      if (prev === fromIndex) return toIndex;
      if (prev > fromIndex && prev <= toIndex) return prev - 1;
      if (prev < fromIndex && prev >= toIndex) return prev + 1;
      return prev;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(0);
    setHistory([]);
  }, []);

  // ─── Navigation ──────────────────────────────────────────────────────────

  const getEffectiveIndex = useCallback((rawIndex) => {
    if (!shuffled || shuffleOrder.length === 0) return rawIndex;
    return shuffleOrder[rawIndex] ?? rawIndex;
  }, [shuffled, shuffleOrder]);

  const currentTrack = queue[getEffectiveIndex(queueIndex)] || null;

  const goToNext = useCallback(() => {
    if (repeat === "one") return { track: currentTrack, index: queueIndex };

    setHistory(prev => [...prev.slice(-49), queueIndex]);

    if (queueIndex >= queue.length - 1) {
      if (repeat === "all") {
        setQueueIndex(0);
        return { track: queue[getEffectiveIndex(0)], index: 0 };
      }
      return null; // end of queue
    }

    const next = queueIndex + 1;
    setQueueIndex(next);
    return { track: queue[getEffectiveIndex(next)], index: next };
  }, [queue, queueIndex, repeat, currentTrack, getEffectiveIndex]);

  const goToPrev = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setQueueIndex(prev);
      return { track: queue[getEffectiveIndex(prev)], index: prev };
    }
    if (queueIndex > 0) {
      const prev = queueIndex - 1;
      setQueueIndex(prev);
      return { track: queue[getEffectiveIndex(prev)], index: prev };
    }
    return null;
  }, [queue, queueIndex, history, getEffectiveIndex]);

  const jumpTo = useCallback((index) => {
    setHistory(prev => [...prev.slice(-49), queueIndex]);
    setQueueIndex(index);
  }, [queueIndex]);

  // ─── Shuffle ─────────────────────────────────────────────────────────────

  function generateShuffleOrder(length, currentIdx) {
    const indices = Array.from({ length }, (_, i) => i).filter(i => i !== currentIdx);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return [currentIdx, ...indices]; // current track stays first
  }

  const toggleShuffle = useCallback(() => {
    setShuffled(prev => {
      if (!prev && queue.length > 0) {
        const order = generateShuffleOrder(queue.length, queueIndex);
        setShuffleOrder(order);
        shuffleOrderRef.current = order;
      }
      return !prev;
    });
  }, [queue.length, queueIndex]);

  const cycleRepeat = useCallback(() => {
    setRepeat(prev => prev === "none" ? "all" : prev === "all" ? "one" : "none");
  }, []);

  // ─── Upcoming tracks (for queue display) ──────────────────────────────────
  const upcomingTracks = queue.map((track, rawIdx) => ({
    track,
    rawIndex: rawIdx,
    effectiveIndex: getEffectiveIndex(rawIdx),
    isCurrent: rawIdx === queueIndex,
    isPlayed: rawIdx < queueIndex,
  }));

  return (
    <QueueContext.Provider value={{
      queue,
      queueIndex,
      currentTrack,
      history,
      shuffled,
      repeat,
      upcomingTracks,
      queueOpen,
      playlistOpen,
      // Operations
      loadQueue,
      addToQueue,
      playNext,
      removeFromQueue,
      reorderQueue,
      clearQueue,
      jumpTo,
      goToNext,
      goToPrev,
      toggleShuffle,
      cycleRepeat,
      setQueueOpen,
      setPlaylistOpen,
    }}>
      {children}
    </QueueContext.Provider>
  );
}

export const useQueue = () => {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue must be used inside QueueProvider");
  return ctx;
};
