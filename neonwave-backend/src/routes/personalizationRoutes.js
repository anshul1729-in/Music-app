export function registerPersonalizationRoutes(app, deps) {
  const { authenticate, db, getDefaultUserId, updateAffinities } = deps;

  app.post("/api/events/playback", authenticate, async (req, res) => {
    try {
      const {
        track_id,
        event_type,
        position_seconds = 0,
        duration_seconds = 0,
        completion_ratio = 0,
        source = "library",
      } = req.body || {};

      const validEvents = new Set(["play_start", "play_progress", "play_complete", "skip"]);
      if (!track_id) return res.status(400).json({ error: "track_id is required" });
      if (!validEvents.has(event_type)) return res.status(400).json({ error: "Invalid event_type" });

      const ratio = Math.max(0, Math.min(1, Number(completion_ratio) || 0));
      const position = Math.max(0, Math.round(Number(position_seconds) || 0));
      const duration = Math.max(0, Math.round(Number(duration_seconds) || 0));
      const userId = await getDefaultUserId();

      await db.query(
        `INSERT INTO listening_events
        (user_id, track_id, event_type, position_seconds, duration_seconds, completion_ratio, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, track_id, event_type, position, duration, ratio, source]
      );

      if (event_type === "play_start" || event_type === "play_complete" || event_type === "skip") {
        await updateAffinities({ userId, trackId: track_id, eventType: event_type });
      }

      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Playback event error:", err);
      res.status(500).json({ error: "Failed to save playback event" });
    }
  });

  app.get("/api/me/history", authenticate, async (req, res) => {
    try {
      const userId = await getDefaultUserId();
      const limit = Math.min(Math.max(parseInt(req.query.limit || "30", 10), 1), 100);
      const result = await db.query(
        `SELECT DISTINCT ON (le.track_id)
          t.id, t.title, t.artist, t.album, t.duration, t.art_url,
          le.event_type, le.completion_ratio, le.source, le.created_at as last_interaction_at
        FROM listening_events le
        JOIN tracks t ON t.id = le.track_id
        WHERE le.user_id = $1
        ORDER BY le.track_id, le.created_at DESC
        LIMIT $2`,
        [userId, limit]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch listening history" });
    }
  });

  app.get("/api/me/top-tracks", authenticate, async (req, res) => {
    try {
      const userId = await getDefaultUserId();
      const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 100);
      const result = await db.query(
        `SELECT
          t.id, t.title, t.artist, t.album, t.duration, t.art_url,
          COUNT(*) FILTER (WHERE le.event_type IN ('play_start', 'play_complete')) AS play_events,
          COUNT(*) FILTER (WHERE le.event_type = 'play_complete') AS completed_plays,
          COUNT(*) FILTER (WHERE le.event_type = 'skip') AS skip_events,
          ROUND(
            SUM(
              (CASE
                WHEN le.event_type = 'play_complete' THEN 2.0
                WHEN le.event_type = 'play_start' THEN 0.5
                WHEN le.event_type = 'play_progress' THEN 0.25
                WHEN le.event_type = 'skip' THEN -1.0
                ELSE 0
              END) * EXP(-EXTRACT(EPOCH FROM (NOW() - le.created_at)) / 604800.0)
            )::numeric, 4
          ) AS score
        FROM listening_events le
        JOIN tracks t ON t.id = le.track_id
        WHERE le.user_id = $1
        GROUP BY t.id
        HAVING SUM(
          CASE
            WHEN le.event_type = 'play_complete' THEN 2.0
            WHEN le.event_type = 'play_start' THEN 0.5
            WHEN le.event_type = 'play_progress' THEN 0.25
            WHEN le.event_type = 'skip' THEN -1.0
            ELSE 0
          END
        ) > 0
        ORDER BY score DESC NULLS LAST
        LIMIT $2`,
        [userId, limit]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch top tracks" });
    }
  });

  app.get("/api/me/top-artists", authenticate, async (req, res) => {
    try {
      const userId = await getDefaultUserId();
      const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
      const result = await db.query(
        `SELECT
          t.artist,
          COUNT(*) FILTER (WHERE le.event_type IN ('play_start', 'play_complete')) AS play_events,
          COUNT(*) FILTER (WHERE le.event_type = 'play_complete') AS completed_plays,
          COUNT(*) FILTER (WHERE le.event_type = 'skip') AS skip_events,
          ROUND(
            SUM(
              (CASE
                WHEN le.event_type = 'play_complete' THEN 2.0
                WHEN le.event_type = 'play_start' THEN 0.5
                WHEN le.event_type = 'play_progress' THEN 0.25
                WHEN le.event_type = 'skip' THEN -1.0
                ELSE 0
              END) * EXP(-EXTRACT(EPOCH FROM (NOW() - le.created_at)) / 604800.0)
            )::numeric, 4
          ) AS score
        FROM listening_events le
        JOIN tracks t ON t.id = le.track_id
        WHERE le.user_id = $1
        GROUP BY t.artist
        ORDER BY score DESC NULLS LAST
        LIMIT $2`,
        [userId, limit]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch top artists" });
    }
  });
}
