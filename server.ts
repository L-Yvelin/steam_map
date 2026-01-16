import express, { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const CACHE_DIR = path.resolve(".cache/steam");
const STEAM_API_KEY =
  process.env.STEAM_API_KEY || process.env.VITE_STEAM_API_KEY;

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

app.use(express.static(path.join(__dirname, "dist")));

// Proxy Store API - Single ID only with Cache
app.get("/store/api/appdetails", async (req: Request, res: Response) => {
  const id = req.query.appids as string;
  if (!id || id.includes(","))
    return res.status(400).json({ error: "Single appid required" });

  const cachePath = path.resolve(CACHE_DIR, `${id}.json`);
  if (fs.existsSync(cachePath)) {
    try {
      return res.json(JSON.parse(fs.readFileSync(cachePath, "utf-8")));
    } catch (e) {
      console.error("Cache read error:", e);
    }
  }

  try {
    const r = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${id}`
    );
    const data = (await r.json()) as any;
    if (data?.[id]?.success) fs.writeFileSync(cachePath, JSON.stringify(data));
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy User API
app.get(/^\/steam\/(.*)/, async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as any);
  if (STEAM_API_KEY) query.set("key", STEAM_API_KEY);

  try {
    const r = await fetch(
      `https://api.steampowered.com/${req.params[0]}?${query}`
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
