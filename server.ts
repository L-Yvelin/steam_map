import express, { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const LOCATION_CACHE_DIR = path.resolve(".cache/location");
const STEAM_CACHE_DIR = path.resolve(".cache/steam");
const STEAM_API_KEY =
  process.env.STEAM_API_KEY || process.env.VITE_STEAM_API_KEY;

if (!fs.existsSync(STEAM_CACHE_DIR))
  fs.mkdirSync(STEAM_CACHE_DIR, { recursive: true });

async function fetchJsonWithCache(url: string, dir: string, fileName: string) {
  const name = fileName;
  const cachePath = path.resolve(dir, name);

  if (fs.existsSync(cachePath)) {
    try {
      return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    } catch (e) {
      console.error("Cache read error:", e);
      // fall through to refetch
    }
  }

  const r = await fetch(url, {
    // identify the app for polite third-party API usage
    headers: { "User-Agent": "steam_map/1.0 (+https://example.invalid)" },
  });
  const data = (await r.json()) as any;
  try {
    fs.writeFileSync(cachePath, JSON.stringify(data));
  } catch (e) {
    console.error("Cache write error:", e);
  }
  return data;
}

app.use(express.static(path.join(__dirname, "dist")));

app.get("/store/api/appdetails", async (req: Request, res: Response) => {
  const id = req.query.appids as string;
  if (!id || id.includes(","))
    return res.status(400).json({ error: "Single appid required" });

  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${id}`;
    const data = await fetchJsonWithCache(url, STEAM_CACHE_DIR, `${id}.json`);
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/nominatim/search", async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: "q (query) is required" });

  const params = new URLSearchParams({
    q,
    format: (req.query.format as string) || "json",
  });
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const data = await fetchJsonWithCache(url, LOCATION_CACHE_DIR, `${q}.json`);
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Proxy User API
app.get(/^\/steam\/(.*)/, async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as any);
  if (STEAM_API_KEY) query.set("key", STEAM_API_KEY);

  try {
    const r = await fetch(
      `https://api.steampowered.com/${req.params[0]}?${query}`,
    );
    res.json(await r.json());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// SPA fallback
app.get(/.*/, (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  fs.existsSync(indexPath)
    ? res.sendFile(indexPath)
    : res.status(404).send("Run 'npm run build' first.");
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
