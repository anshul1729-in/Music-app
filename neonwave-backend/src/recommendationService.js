export function createRecommendationService({ db, cacheTtlMs = 60_000 }) {
  const cache = new Map();

  function withCache(key, fetcher) {
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) return hit.value;
    const value = fetcher();
    cache.set(key, { value, expiresAt: now + cacheTtlMs });
    return value;
  }

  async function getForYou({ userId, limit = 10 }) {
    return withCache(`for-you:${userId}:${limit}`, async () => {
      const result = await db.query(
        `WITH recent_signals AS (
          SELECT
            le.track_id,
            SUM(
              (CASE
                WHEN le.event_type = 'play_complete' THEN 2.2
                WHEN le.event_type = 'play_start' THEN 0.7
                WHEN le.event_type = 'play_progress' THEN 0.3
                WHEN le.event_type = 'skip' THEN -1.0
                ELSE 0
              END) * EXP(-EXTRACT(EPOCH FROM (NOW() - le.created_at)) / 604800.0)
            ) AS recency_score
          FROM listening_events le
          WHERE le.user_id = $1
          GROUP BY le.track_id
        )
        SELECT
          t.id, t.title, t.artist, t.album, t.duration, t.art_url,
          ROUND((COALESCE(uta.affinity_score, 0) + COALESCE(rs.recency_score, 0) + (t.play_count * 0.02))::numeric, 4) AS score
        FROM tracks t
        LEFT JOIN user_track_affinity uta ON uta.track_id = t.id AND uta.user_id = $1
        LEFT JOIN recent_signals rs ON rs.track_id = t.id
        WHERE COALESCE(uta.affinity_score, 0) + COALESCE(rs.recency_score, 0) > 0
        ORDER BY score DESC, t.created_at DESC
        LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    });
  }

  async function getDiscover({ userId, limit = 10 }) {
    return withCache(`discover:${userId}:${limit}`, async () => {
      const result = await db.query(
        `WITH recently_played AS (
          SELECT DISTINCT track_id
          FROM listening_events
          WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
        )
        SELECT
          t.id, t.title, t.artist, t.album, t.duration, t.art_url,
          ROUND((t.play_count * 0.08 + (CASE WHEN t.favorited THEN 2 ELSE 0 END) + (RANDOM() * 1.5))::numeric, 4) AS score
        FROM tracks t
        LEFT JOIN recently_played rp ON rp.track_id = t.id
        WHERE rp.track_id IS NULL
        ORDER BY score DESC, t.created_at DESC
        LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    });
  }

  async function getSimilar({ userId, trackId, limit = 8 }) {
    return withCache(`similar:${userId}:${trackId}:${limit}`, async () => {
      const result = await db.query(
        `WITH playlist_pairs AS (
          SELECT pt2.track_id AS candidate_id, COUNT(*)::numeric * 1.5 AS pair_score
          FROM playlist_tracks pt1
          JOIN playlist_tracks pt2
            ON pt1.playlist_id = pt2.playlist_id
           AND pt1.track_id <> pt2.track_id
          WHERE pt1.track_id = $2
          GROUP BY pt2.track_id
        ),
        session_pairs AS (
          SELECT next_track AS candidate_id, COUNT(*)::numeric * 1.0 AS pair_score
          FROM (
            SELECT
              track_id,
              LEAD(track_id) OVER (PARTITION BY user_id ORDER BY created_at) AS next_track
            FROM listening_events
            WHERE user_id = $1 AND event_type IN ('play_start', 'play_complete')
          ) seq
          WHERE track_id = $2 AND next_track IS NOT NULL AND next_track <> $2
          GROUP BY next_track
        ),
        artist_pairs AS (
          SELECT t2.id AS candidate_id, 0.6::numeric AS pair_score
          FROM tracks t1
          JOIN tracks t2 ON t1.artist = t2.artist AND t1.id <> t2.id
          WHERE t1.id = $2
        ),
        merged AS (
          SELECT candidate_id, SUM(pair_score) AS score
          FROM (
            SELECT * FROM playlist_pairs
            UNION ALL
            SELECT * FROM session_pairs
            UNION ALL
            SELECT * FROM artist_pairs
          ) x
          GROUP BY candidate_id
        )
        SELECT
          t.id, t.title, t.artist, t.album, t.duration, t.art_url,
          ROUND((m.score + COALESCE(uta.affinity_score * 0.2, 0))::numeric, 4) AS score
        FROM merged m
        JOIN tracks t ON t.id = m.candidate_id
        LEFT JOIN user_track_affinity uta ON uta.user_id = $1 AND uta.track_id = t.id
        ORDER BY score DESC, t.created_at DESC
        LIMIT $3`,
        [userId, trackId, limit]
      );
      return result.rows;
    });
  }

  return { getForYou, getDiscover, getSimilar };
}
