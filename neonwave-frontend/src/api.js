// api.js — Drop this into your Phase 1 src/ folder
// This replaces local file handling with backend API calls

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_KEY  = import.meta.env.VITE_API_KEY  || "";

const headers = () => ({
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
});

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Tracks ──────────────────────────────────────────────────────────────
export const api = {
  // Get all tracks (with optional search/sort)
  getTracks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/tracks${query ? "?" + query : ""}`);
  },

  // Get a single track
  getTrack: (id) => request(`/api/tracks/${id}`),

  // Upload one or more audio files
  uploadTracks: async (files, onProgress) => {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE_URL}/api/tracks/upload`, {
        method: "POST",
        headers: { "x-api-key": API_KEY },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed for ${file.name}`);
      }

      const data = await res.json();
      results.push(data.track);
      onProgress?.(i + 1, files.length, file.name);
    }
    return results;
  },

  // Delete a track
  deleteTrack: (id) => request(`/api/tracks/${id}`, { method: "DELETE" }),

  // Toggle favorite
  toggleFavorite: (id) => request(`/api/tracks/${id}/favorite`, { method: "PATCH" }),

  // Get streaming URL for a track
  getStreamUrl: (id) => `${BASE_URL}/api/tracks/${id}/stream?key=${API_KEY}`,

  // Get pre-signed URL (for Howler.js direct playback)
  getSignedUrl: (id) => request(`/api/tracks/${id}/url`),

  // ─── Library ──────────────────────────────────────────────────────────
  getArtists: () => request("/api/artists"),
  getAlbums:  () => request("/api/albums"),
  getStats:   () => request("/api/stats"),
  getListeningHistory: (limit = 30) => request(`/api/me/history?limit=${limit}`),
  getTopTracks: (limit = 12) => request(`/api/me/top-tracks?limit=${limit}`),
  getTopArtists: (limit = 10) => request(`/api/me/top-artists?limit=${limit}`),
  sendPlaybackEvent: (payload) => request("/api/events/playback", { method: "POST", body: JSON.stringify(payload) }),
  getForYouRecommendations: (limit = 10) => request(`/api/recommendations/for-you?limit=${limit}`),
  getSimilarRecommendations: (trackId, limit = 8) => request(`/api/recommendations/similar/${trackId}?limit=${limit}`),
  getDiscoverRecommendations: (limit = 10) => request(`/api/recommendations/discover?limit=${limit}`),

  // ─── Playlists ────────────────────────────────────────────────────────
  getPlaylists:         ()              => request("/api/playlists"),
  createPlaylist:       (name, desc)    => request("/api/playlists", { method: "POST", body: JSON.stringify({ name, description: desc }) }),
  updatePlaylist:       (id, payload)   => request(`/api/playlists/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deletePlaylist:       (id)            => request(`/api/playlists/${id}`, { method: "DELETE" }),
  getPlaylistTracks:    (id)            => request(`/api/playlists/${id}/tracks`),
  addTrackToPlaylist:   (id, track_id)  => request(`/api/playlists/${id}/tracks`, { method: "POST", body: JSON.stringify({ track_id }) }),
  removeFromPlaylist:   (id, track_id)  => request(`/api/playlists/${id}/tracks/${track_id}`, { method: "DELETE" }),
};

export default api;
