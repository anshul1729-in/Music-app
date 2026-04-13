function createRateLimiter({ windowMs, max }) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = `${req.ip}:${req.headers["x-api-key"] || "anon"}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, start: now };
    if (now - bucket.start >= windowMs) {
      bucket.count = 0;
      bucket.start = now;
    }
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > max) {
      return res.status(429).json({ error: "Too many recommendation requests" });
    }
    next();
  };
}

const recommendationRateLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
const recommendationTelemetry = (req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const elapsed = Date.now() - started;
    console.log(`[recs] ${req.method} ${req.path} ${res.statusCode} ${elapsed}ms`);
  });
  next();
};

export function registerRecommendationRoutes(app, deps) {
  const { authenticate, getDefaultUserId, recommendationService } = deps;

  app.get("/api/recommendations/for-you", authenticate, recommendationTelemetry, recommendationRateLimiter, async (req, res) => {
    try {
      const userId = await getDefaultUserId();
      const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
      const tracks = await recommendationService.getForYou({ userId, limit });
      res.json({ tracks });
    } catch (err) {
      console.error("For-you recommendations error:", err);
      res.status(500).json({ error: "Failed to fetch for-you recommendations" });
    }
  });

  app.get("/api/recommendations/similar/:trackId", authenticate, recommendationTelemetry, recommendationRateLimiter, async (req, res) => {
    try {
      const userId = await getDefaultUserId();
      const limit = Math.min(Math.max(parseInt(req.query.limit || "8", 10), 1), 50);
      const tracks = await recommendationService.getSimilar({ userId, trackId: req.params.trackId, limit });
      res.json({ tracks });
    } catch (err) {
      console.error("Similar recommendations error:", err);
      res.status(500).json({ error: "Failed to fetch similar recommendations" });
    }
  });

  app.get("/api/recommendations/discover", authenticate, recommendationTelemetry, recommendationRateLimiter, async (req, res) => {
    try {
      const userId = await getDefaultUserId();
      const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
      const tracks = await recommendationService.getDiscover({ userId, limit });
      res.json({ tracks });
    } catch (err) {
      console.error("Discover recommendations error:", err);
      res.status(500).json({ error: "Failed to fetch discover recommendations" });
    }
  });
}
