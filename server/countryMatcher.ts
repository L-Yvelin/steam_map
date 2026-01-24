import * as fs from "node:fs";

const LEGAL_SUFFIXES = new Set([
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
]);

const GENERIC_TRAILING = new Set([
  "game",
  "games",
  "gaming",
  "studio",
  "studios",
  "entertainment",
  "software",
]);

export function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/,/g, " ")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,\w+\.com/g, "")
    .replace(/\(.*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removeLegalSuffixes(name: string): string {
  return name
    .split(" ")
    .filter((part) => !LEGAL_SUFFIXES.has(part))
    .join(" ")
    .trim();
}

function removeGenericTrailing(name: string): string {
  const parts = name.split(" ");
  while (GENERIC_TRAILING.has(parts[parts.length - 1])) {
    parts.pop();
  }

  return parts.join(" ").trim();
}

function sanitizeName(name: string): string {
  return normalize(removeLegalSuffixes(removeGenericTrailing(name)));
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

function createIndex(transform: (name: string) => string): DevRow[] {
  return GAME_LOCATION_CSV.map((line) => {
    const norm = transform(line[0]);
    return {
      raw: line[0],
      iso2: line[1],
      norm,
      tokens: new Set(norm.split(" ")),
    };
  });
}

const DEV_NORMALIZED_INDEX: DevRow[] = createIndex(normalize);
const DEV_SANITIZED_INDEX: DevRow[] = createIndex(sanitizeName);
const DEV_NO_SUFFIXES_INDEX: DevRow[] = createIndex((n) =>
  normalize(removeLegalSuffixes(n)),
);
const DEV_NO_SUFFIXES_NO_TRAILING_INDEX: DevRow[] = createIndex((n) =>
  normalize(removeLegalSuffixes(removeGenericTrailing(n))),
);

export function tokenScoreSet(a: Set<string>, b: Set<string>): number {
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  return hit / Math.max(a.size, b.size);
}

export function findBestMatch(developerName: string): [DevRow | null, number] {
  const simpleFullMatch = DEV_NORMALIZED_INDEX.find(
    (dev) => dev.norm === normalize(developerName),
  );
  if (simpleFullMatch) {
    return [simpleFullMatch, 1];
  }

  const noSuffixesFullMatch = DEV_NO_SUFFIXES_INDEX.find(
    (dev) => dev.norm === normalize(removeLegalSuffixes(developerName)),
  );
  if (noSuffixesFullMatch) {
    return [noSuffixesFullMatch, 1];
  }

  const noSuffixesNoTrailingFullMatch = DEV_NO_SUFFIXES_NO_TRAILING_INDEX.find(
    (dev) =>
      dev.norm ===
      normalize(removeLegalSuffixes(removeGenericTrailing(developerName))),
  );
  if (noSuffixesNoTrailingFullMatch) {
    return [noSuffixesNoTrailingFullMatch, 1];
  }

  const norm = sanitizeName(developerName);
  const tokens = new Set(norm.split(" "));
  let best: DevRow | null = null;
  let bestScore = 0;
  for (const dev of DEV_SANITIZED_INDEX) {
    const score = tokenScoreSet(tokens, dev.tokens);
    if (score > bestScore) {
      bestScore = score;
      best = dev;
    }
  }

  return [best, bestScore];
}

export function getCountryCode(developerName: string): string | null {
  const [best, score] = findBestMatch(developerName);

  if (!best || score < 0.5) {
    return null;
  } else {
    return best.iso2;
  }
}
