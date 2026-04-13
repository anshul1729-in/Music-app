// scripts/setup-db.js
// Run with: node scripts/setup-db.js
// This creates all required tables in your Neon PostgreSQL database

import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  artist      TEXT NOT NULL DEFAULT 'Unknown Artist',
  album       TEXT NOT NULL DEFAULT 'Unknown Album',
  year        INTEGER,
  track_number INTEGER,
  duration    INTEGER NOT NULL DEFAULT 0,  -- seconds
  file_key    TEXT NOT NULL UNIQUE,         -- R2 object key
  art_url     TEXT,                          -- public URL
  file_size   BIGINT DEFAULT 0,             -- bytes
  mime_type   TEXT DEFAULT 'audio/mpeg',
  play_count  INTEGER NOT NULL DEFAULT 0,
  favorited   BOOLEAN NOT NULL DEFAULT false,
  last_played TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Playlist <-> Track join table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    UUID REFERENCES tracks(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (playlist_id, track_id)
);

-- Users table (single-user today, multi-user ready)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raw playback signals
CREATE TABLE IF NOT EXISTS listening_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id         UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  event_type       TEXT NOT NULL CHECK (event_type IN ('play_start', 'play_progress', 'play_complete', 'skip')),
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completion_ratio NUMERIC(5,4) NOT NULL DEFAULT 0,
  source           TEXT NOT NULL DEFAULT 'library',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional precomputed affinities for future recommendation jobs
CREATE TABLE IF NOT EXISTS user_track_affinity (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id      UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  affinity_score NUMERIC(10,4) NOT NULL DEFAULT 0,
  play_count    INTEGER NOT NULL DEFAULT 0,
  skip_count    INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS user_artist_affinity (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist         TEXT NOT NULL,
  affinity_score NUMERIC(10,4) NOT NULL DEFAULT 0,
  play_count     INTEGER NOT NULL DEFAULT 0,
  skip_count     INTEGER NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, artist)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist  ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_album   ON tracks(album);
CREATE INDEX IF NOT EXISTS idx_tracks_play_count ON tracks(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_last_played ON tracks(last_played DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_favorited ON tracks(favorited) WHERE favorited = true;
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_listening_events_user_time ON listening_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_events_track ON listening_events(track_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_track_affinity_score ON user_track_affinity(user_id, affinity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_artist_affinity_score ON user_artist_affinity(user_id, affinity_score DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracks_updated_at ON tracks;
CREATE TRIGGER tracks_updated_at
  BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS playlists_updated_at ON playlists;
CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO users (username, display_name)
VALUES ('default-user', 'Default User')
ON CONFLICT (username) DO NOTHING;
`;

async function setup() {
  console.log("🗄️  Setting up NeonWave database...\n");
  try {
    await db.query(schema);
    console.log("✅ Tables created: tracks, playlists, playlist_tracks, users, listening_events, affinity tables");
    console.log("✅ Indexes created");
    console.log("✅ Triggers created");
    console.log("\n🎉 Database is ready! You can now start the server.");
  } catch (err) {
    console.error("❌ Setup failed:", err.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

setup();
