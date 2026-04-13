import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_SECRET_KEY;
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

if (!API_KEY) {
  console.error("Missing API_SECRET_KEY in environment.");
  process.exit(1);
}

async function jsonFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-api-key": API_KEY },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function run() {
  const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
  console.log("health:", health.status);

  const forYou = await jsonFetch("/api/recommendations/for-you?limit=5");
  console.log("for-you:", forYou.res.status, "count:", forYou.body.tracks?.length || 0);

  const discover = await jsonFetch("/api/recommendations/discover?limit=5");
  console.log("discover:", discover.res.status, "count:", discover.body.tracks?.length || 0);

  const tracks = await jsonFetch("/api/tracks?limit=1");
  const trackId = tracks.body.tracks?.[0]?.id;
  if (!trackId) {
    console.log("similar: skipped (no tracks available)");
    return;
  }

  const similar = await jsonFetch(`/api/recommendations/similar/${trackId}?limit=5`);
  console.log("similar:", similar.res.status, "count:", similar.body.tracks?.length || 0);
}

run().catch((err) => {
  console.error("Smoke test failed:", err.message);
  process.exit(1);
});
