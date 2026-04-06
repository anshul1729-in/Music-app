import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import pg from "pg";
import * as mm from "music-metadata";
import { Readable } from "stream";
import crypto from "crypto";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// ─── Auth Middleware ──────────────────────────────────────────
const authenticate = (req, res, next) => {
  const key = req.headers["x-api-key"] || req.query.key;
  if (key !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// ─── Cloudflare R2 Client ─────────────────────────────────────
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

// ─── PostgreSQL Client ────────────────────────────────────────
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ─── Multer (in-memory, 200MB limit) ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ["audio/mpeg", "audio/flac", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"];
    cb(null, allowed.includes(file.mimetype) || file.originalname.match(/\.(mp3|flac|wav|ogg|m4a)$/i));
  },
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", service: "NeonWave API" }));

// ─── UPLOAD TRACK ─────────────────────────────────────────────
app.post("/api/tracks/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });

    // Parse metadata from the audio file
    const metadata = await mm.parseBuffer(req.file.buffer, req.file.mimetype);
    const { title, artist, album, year, track } = metadata.common;
    const duration = metadata.format.duration ? Math.round(metadata.format.duration) : 0;

    // Extract album art if present
    let artUrl = null;
    const picture = metadata.common.picture?.[0];
    if (picture) {
      const artKey = `art/${crypto.randomUUID()}.${picture.format.split("/")[1] || "jpg"}`;
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: artKey,
        Body: picture.data,
        ContentType: picture.format,
      }));
      artUrl = `${process.env.R2_PUBLIC_URL}/${artKey}`;
    }

    // Upload audio to R2
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileKey = `tracks/${crypto.randomUUID()}${ext}`;
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // Save metadata to PostgreSQL
    const trackTitle = title || path.basename(req.file.originalname, ext);
    const result = await db.query(
      `INSERT INTO tracks (title, artist, album, year, track_number, duration, file_key, art_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [trackTitle, artist || "Unknown Artist", album || "Unknown Album", year || null,
       track?.no || null, duration, fileKey, artUrl, req.file.size, req.file.mimetype]
    );

    // Update play count to 0
    await db.query(`UPDATE tracks SET play_count = 0 WHERE id = $1`, [result.rows[0].id]);

    res.status(201).json({ success: true, track: result.rows[0] });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// ─── GET ALL TRACKS ───────────────────────────────────────────
app.get("/api/tracks", authenticate, async (req, res) => {
  try {
    const { search, artist, album, sort = "created_at", order = "DESC", limit = 200, offset = 0 } = req.query;

    let query = `SELECT id, title, artist, album, year, track_number, duration, art_url, play_count, favorited, created_at
                 FROM tracks WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR artist ILIKE $${params.length} OR album ILIKE $${params.length})`;
    }
    if (artist) { params.push(artist); query += ` AND artist = $${params.length}`; }
    if (album)  { params.push(album);  query += ` AND album = $${params.length}`; }

    const validSorts = ["title", "artist", "album", "duration", "play_count", "created_at"];
    const sortCol = validSorts.includes(sort) ? sort : "created_at";
    const sortDir = order === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${sortCol} ${sortDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    const countResult = await db.query(`SELECT COUNT(*) FROM tracks`);

    res.json({ tracks: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error("Get tracks error:", err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

// ─── GET SINGLE TRACK ─────────────────────────────────────────
app.get("/api/tracks/:id", authenticate, async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM tracks WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Track not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch track" });
  }
});

// ─── STREAM AUDIO ─────────────────────────────────────────────
app.get("/api/tracks/:id/stream", authenticate, async (req, res) => {
  try {
    const result = await db.query(`SELECT file_key, mime_type, title FROM tracks WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Track not found" });

    const { file_key, mime_type, title } = result.rows[0];

    // Handle range requests for seeking
    const range = req.headers.range;
    const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: file_key });

    if (range) {
      // Fetch with range from R2
      const signedUrl = await getSignedUrl(r2, getCmd, { expiresIn: 3600 });
      const response = await fetch(signedUrl, { headers: { Range: range } });
      res.status(response.status);
      response.headers.forEach((v, k) => {
        if (["content-type","content-range","content-length","accept-ranges"].includes(k)) res.setHeader(k, v);
      });
      Readable.fromWeb(response.body).pipe(res);
    } else {
      const r2Response = await r2.send(getCmd);
      res.setHeader("Content-Type", mime_type || "audio/mpeg");
      res.setHeader("Content-Length", r2Response.ContentLength);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(title)}"`);
      r2Response.Body.transformToWebStream
        ? Readable.fromWeb(r2Response.Body.transformToWebStream()).pipe(res)
        : r2Response.Body.pipe(res);
    }

    // Increment play count (async, don't await)
    db.query(`UPDATE tracks SET play_count = play_count + 1, last_played = NOW() WHERE id = $1`, [req.params.id]);
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).json({ error: "Stream failed" });
  }
});

// ─── SIGNED URL (for direct browser playback) ─────────────────
app.get("/api/tracks/:id/url", authenticate, async (req, res) => {
  try {
    const result = await db.query(`SELECT file_key FROM tracks WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Track not found" });

    const url = await getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: result.rows[0].file_key }), { expiresIn: 3600 });
    res.json({ url, expiresIn: 3600 });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate URL" });
  }
});

// ─── DELETE TRACK ─────────────────────────────────────────────
app.delete("/api/tracks/:id", authenticate, async (req, res) => {
  try {
    const result = await db.query(`SELECT file_key, art_url FROM tracks WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Track not found" });

    const { file_key, art_url } = result.rows[0];

    // Delete from R2
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: file_key }));
    if (art_url) {
      const artKey = art_url.replace(`${process.env.R2_PUBLIC_URL}/`, "");
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: artKey })).catch(() => {});
    }

    // Delete from DB
    await db.query(`DELETE FROM tracks WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: "Track deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ─── TOGGLE FAVORITE ─────────────────────────────────────────
app.patch("/api/tracks/:id/favorite", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE tracks SET favorited = NOT favorited WHERE id = $1 RETURNING id, favorited`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Track not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle favorite" });
  }
});

// ─── GET ARTISTS ──────────────────────────────────────────────
app.get("/api/artists", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT artist, COUNT(*) as track_count, array_agg(DISTINCT album) as albums
       FROM tracks GROUP BY artist ORDER BY artist ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch artists" });
  }
});

// ─── GET ALBUMS ───────────────────────────────────────────────
app.get("/api/albums", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT album, artist, COUNT(*) as track_count,
              MIN(year) as year,
              (SELECT art_url FROM tracks t2 WHERE t2.album = t.album AND t2.artist = t.artist AND t2.art_url IS NOT NULL LIMIT 1) as art_url
       FROM tracks t GROUP BY album, artist ORDER BY artist, album`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// ─── PLAYLISTS ────────────────────────────────────────────────
app.get("/api/playlists", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, COUNT(pt.track_id) as track_count
       FROM playlists p LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       GROUP BY p.id ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

app.post("/api/playlists", authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const result = await db.query(
      `INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

app.get("/api/playlists/:id/tracks", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, t.title, t.artist, t.album, t.duration, t.art_url, pt.position
       FROM tracks t JOIN playlist_tracks pt ON t.id = pt.track_id
       WHERE pt.playlist_id = $1 ORDER BY pt.position`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch playlist tracks" });
  }
});

app.post("/api/playlists/:id/tracks", authenticate, async (req, res) => {
  try {
    const { track_id } = req.body;
    const pos = await db.query(
      `SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM playlist_tracks WHERE playlist_id = $1`,
      [req.params.id]
    );
    await db.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [req.params.id, track_id, pos.rows[0].next_pos]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add track to playlist" });
  }
});

app.delete("/api/playlists/:id/tracks/:trackId", authenticate, async (req, res) => {
  try {
    await db.query(`DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2`, [req.params.id, req.params.trackId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove track" });
  }
});

app.delete("/api/playlists/:id", authenticate, async (req, res) => {
  try {
    await db.query(`DELETE FROM playlists WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

// ─── STATS ────────────────────────────────────────────────────
app.get("/api/stats", authenticate, async (req, res) => {
  try {
    const [tracks, artists, albums, favorites, recentlyPlayed] = await Promise.all([
      db.query(`SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size, COALESCE(SUM(duration), 0) as total_duration FROM tracks`),
      db.query(`SELECT COUNT(DISTINCT artist) as count FROM tracks`),
      db.query(`SELECT COUNT(DISTINCT album) as count FROM tracks`),
      db.query(`SELECT COUNT(*) as count FROM tracks WHERE favorited = true`),
      db.query(`SELECT id, title, artist, art_url, last_played FROM tracks WHERE last_played IS NOT NULL ORDER BY last_played DESC LIMIT 10`),
    ]);
    res.json({
      tracks: parseInt(tracks.rows[0].count),
      totalSize: parseInt(tracks.rows[0].total_size),
      totalDuration: parseInt(tracks.rows[0].total_duration),
      artists: parseInt(artists.rows[0].count),
      albums: parseInt(albums.rows[0].count),
      favorites: parseInt(favorites.rows[0].count),
      recentlyPlayed: recentlyPlayed.rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎵 NeonWave API running on port ${PORT}`);
  db.query("SELECT NOW()").then(() => console.log("✅ Database connected")).catch(e => console.error("❌ DB Error:", e.message));
});
