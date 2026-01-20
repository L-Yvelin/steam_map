import express, { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import FetchCached from "./FetchCached";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
// const LOCATION_CACHE_DIR = path.resolve(".cache/location");
const STEAM_CACHE_DIR = path.resolve(".cache/steam");
const STEAM_API_KEY =
  process.env.STEAM_API_KEY || process.env.VITE_STEAM_API_KEY;

const steamFetchWithCache = new FetchCached({
  cacheSavingPath: STEAM_CACHE_DIR,
  baseUrl: "https://store.steampowered.com/api/",
});

app.use(express.static(path.join(__dirname, "dist")));
app.use(express.json());

export type SteamStoreAppDetailsData = {
  name: string;
  steam_appid: number;
  capsule_image: string;
  developers: string[];
};

export type SteamStoreAppDetailsEntry = {
  success: true;
  data: SteamStoreAppDetailsData;
};

export type GetAppDetailsResponse = Record<string, SteamStoreAppDetailsEntry>;

app.post("/store/api/appdetails", async (req: Request, res: Response) => {
  const appIds = Array.isArray(req.body) ? req.body.map(String) : [];
  if (appIds.length === 0) {
    return res.status(400).json({ error: "appIds required" });
  }

  const games: unknown[] = [];

  for (const id of appIds) {
    const url = `appdetails?appids=${encodeURIComponent(id)}`;

    try {
      const data: GetAppDetailsResponse = await steamFetchWithCache
        .fetch({
          input: url,
          fileName: `${id}.json`,
        })
        .then((r) => r.json());

      const entry = data[id];

      games.push({
        [id]: {
          success: true,
          data: {
            name: entry.data.name,
            steam_appid: entry.data.steam_appid,
            capsule_image: entry.data.capsule_image,
            developers: entry.data.developers,
          },
        },
      });
    } catch (e) {
      console.error(`Error fetching data for appid ${id}:`, e);
      games.push({ [id]: { success: false } });
    }
  }

  return res.json(games);
});

// app.get("/nominatim/search", async (req: Request, res: Response) => {
//   const q = req.query.q as string;
//   if (!q) return res.status(400).json({ error: "q (query) is required" });

//   const params = new URLSearchParams({
//     q,
//     format: (req.query.format as string) || "json",
//   });
//   const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

//   try {
//     const data = await fetchJsonWithCache(url, LOCATION_CACHE_DIR, `${q}.json`);
//     return res.json(data);
//   } catch (e: unknown) {
//     const message = e instanceof Error ? e.message : String(e);
//     return res.status(500).json({ error: message });
//   }
// });

// Proxy User API
app.get(/^\/steam\/(.*)/, async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>);
  if (STEAM_API_KEY) query.set("key", STEAM_API_KEY);

  try {
    const pathPart = (req.params as Record<string, string>)[0] || "";
    const r = await fetch(`https://api.steampowered.com/${pathPart}?${query}`);
    res.json(await r.json());
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: message });
  }
});

// SPA fallback
app.get(/.*/, (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Run 'npm run build' first.");
  }
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
