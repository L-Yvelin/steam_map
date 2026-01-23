import fs from "node:fs";

const LEGAL_SUFFIXES = [
  "inc",
  "inc.",
  "llc",
  "ltd",
  "corp",
  "corp.",
  "co",
  "company",
  "gmbh",
  "s.a.",
  "sa",
  "plc",
  "pte",
  "pty",
  "interactive",
];

const GENERIC_TRAILING = new Set([
  "game",
  "games",
  "gaming",
  "studio",
  "studios",
  "entertainment",
  "software",
]);

function normalize(name: string): string {
  let n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-–—.,()/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const s of LEGAL_SUFFIXES) {
    n = n.replace(new RegExp(`\\b${s}\\b`, "g"), "");
  }

  const parts = n.split(" ");
  while (GENERIC_TRAILING.has(parts.at(-1)!)) {
    parts.pop();
  }

  return parts.join(" ").trim();
}

type DevRow = {
  raw: string;
  iso2: string;
  norm: string;
  tokens: Set<string>;
};

const GAME_LOCATION_CSV = fs
  .readFileSync(
    "server/assets/businesses_with_iso2_simplified_stripped.csv",
    "utf-8",
  )
  .split("\n")
  .map((line) => line.split(","));

const DEV_INDEX: DevRow[] = (GAME_LOCATION_CSV ?? []).map((line) => {
  const norm = normalize(line[0]);
  return {
    raw: line[0],
    iso2: line[1],
    norm,
    tokens: new Set(norm.split(" ")),
  };
});

function tokenScoreSet(a: Set<string>, b: Set<string>): number {
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  return hit / Math.max(a.size, b.size);
}

export function getCountryCode(developerName: string): string | null {
  const norm = normalize(developerName);
  const tokens = new Set(norm.split(" "));

  let best: DevRow | undefined;
  let bestScore = 0;

  for (const dev of DEV_INDEX) {
    const score = tokenScoreSet(tokens, dev.tokens);
    if (score > bestScore) {
      bestScore = score;
      best = dev;
    }
  }

  if (!best || bestScore < 0.5) {
    return null;
  }

  return best.iso2;
}
