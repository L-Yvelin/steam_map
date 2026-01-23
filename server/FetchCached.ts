import fs from "node:fs";
import path from "node:path";
import z from "zod";

type FetchCachedProps = {
  cacheSavingPath: string;
  baseUrl?: string;
  timeoutMs?: number;
};

type cachedFetchFunction = {
  input: string | URL | globalThis.Request;
  fileName: string;
  schema: z.ZodType;
  init?: RequestInit | undefined;
};

class FetchCached {
  baseUrl: string | undefined = undefined;
  cacheSavingPath = "";

  in429 = false;
  timeoutMs = 0;

  constructor({
    baseUrl,
    cacheSavingPath,
    timeoutMs = 60000,
  }: FetchCachedProps) {
    this.baseUrl = baseUrl;
    this.cacheSavingPath = cacheSavingPath;
    this.timeoutMs = timeoutMs;
  }

  private handle429 = async (result: Response) => {
    this.in429 = true;
    console.warn("We're in 429 rate limit boys!");

    const retryAfter = result.headers.get("Retry-After");
    if (retryAfter) {
      console.log("Retry-After", retryAfter);
      this.timeoutMs = Number.parseInt(retryAfter) * 1000;
    } else {
      console.log("No Retry-After, using default timeout:", this.timeoutMs);
    }

    setTimeout(() => {
      this.in429 = false;
      console.warn("K, we're good for now...");
    }, this.timeoutMs);
  };

  public fetch = async ({
    input,
    fileName,
    init,
    schema,
  }: cachedFetchFunction): Promise<Response> => {
    const cachedPath = path.resolve(this.cacheSavingPath, fileName);

    if (fs.existsSync(cachedPath)) {
      try {
        return new Response(fs.readFileSync(cachedPath, "utf-8"));
      } catch {
        // fall through to fetch if not cached
      }
    }

    if (this.in429 === false) {
      if (typeof input === "string") {
        if (this.baseUrl) {
          input = this.baseUrl + input;
        }
      }

      const result = await fetch(input, init);

      if (result.ok === false) {
        if (result.status === 429) {
          this.handle429(result);
        }
      } else {
        const data = await result.clone().json();

        if (data && schema.safeParse(data).success) {
          fs.writeFile(cachedPath, JSON.stringify(data), (e) => {
            if (e) console.error(e);
          });
          console.warn("Valid data, caching file:", fileName);
        } else {
          console.warn("Invalid data, not caching file:", fileName);
          this.handle429(result);
        }
      }

      return result;
    } else {
      return new Response(JSON.stringify({ status: 429, success: false }));
    }
  };
}

export default FetchCached;
