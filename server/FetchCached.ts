import fs from "node:fs";
import path from "node:path";

type FetchCachedProps = {
  cacheSavingPath: string;
  baseUrl?: string;
  timeoutMs?: number;
};

type cachedFetchFunction = {
  input: string | URL | globalThis.Request;
  fileName: string;
  init?: RequestInit | undefined;
};

class FetchCached {
  baseUrl: string | undefined = undefined;
  cacheSavingPath = "";

  in429 = false;
  timeoutMs = 0;
  response429: BodyInit | null = null;

  constructor({
    baseUrl,
    cacheSavingPath,
    timeoutMs = 60000,
  }: FetchCachedProps) {
    this.baseUrl = baseUrl;
    this.cacheSavingPath = cacheSavingPath;
    this.timeoutMs = timeoutMs;
  }

  public fetch = async ({
    input,
    fileName,
    init,
  }: cachedFetchFunction): Promise<Response> => {
    const cachedPath = path.resolve(this.cacheSavingPath, fileName);

    if (fs.existsSync(cachedPath)) {
      try {
        return new Response(fs.readFileSync(cachedPath, "utf-8"));
      } catch {
        // fall through to fetch if not cached
      }
    }

    if (!this.in429) {
      if (typeof input === "string") {
        if (this.baseUrl) {
          input = this.baseUrl + input;
        }
      }

      const result = await fetch(input, init);

      if (!result.ok) {
        if (result.status === 429) {
          console.warn("We're in 429 rate limit boys!");
          this.response429 = result.body;
          this.in429 = true;

          setTimeout(() => {
            this.in429 = false;
            console.warn("K, we're good for now...");
          }, this.timeoutMs);
        }
      } else {
        const data = await result.clone().json();
        fs.writeFile(cachedPath, JSON.stringify(data), (e) => {
          if (e) console.error(e);
        });
      }

      return result;
    } else {
      return new Response(this.response429!);
    }
  };
}

export default FetchCached;
