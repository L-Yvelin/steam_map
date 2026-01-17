import Papa from "papaparse";
import type {
  GetAppDetailsResponse,
  GetAppListResponse,
  GetOwnedGamesResponse,
  GetPlayerSummariesResponse,
  OwnedGame,
  ResolveVanityURLResponse,
  SteamPlayerSummary,
  SteamStoreAppDetailsData,
} from "../types/SteamApi";

const file = await fetch("./businesses_with_iso2.csv");
const rows = Papa.parse<string>(await file.text(), {}).data;

export type Result<E, A> =
  | { tag: "error"; error: E }
  | { tag: "success"; value: A };

export const error = <E>(e: E): Result<E, never> => ({
  tag: "error",
  error: e,
});

export const success = <A>(a: A): Result<never, A> => ({
  tag: "success",
  value: a,
});

export const fold =
  <E, A, B>(onError: (e: E) => B, onSuccess: (a: A) => B) =>
  (r: Result<E, A>): B =>
    r.tag === "error" ? onError(r.error) : onSuccess(r.value);

const fetchJson = async <T>(input: RequestInfo | URL): Promise<T> => {
  const res = await fetch(input);
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
};

export const getPlayerIdFromName = async (
  name: string,
): Promise<Result<string, string>> => {
  const data = await fetchJson<ResolveVanityURLResponse>(
    `/steam/ISteamUser/ResolveVanityURL/v0001/?vanityurl=${encodeURIComponent(
      name,
    )}`,
  );
  return data.response?.steamid
    ? success(data.response.steamid)
    : error("No player found, try its steam ID instead?");
};

export const getPlayerSummary = async (
  steamId: string,
): Promise<Result<string, SteamPlayerSummary>> => {
  const data = await fetchJson<GetPlayerSummariesResponse>(
    `/steam/ISteamUser/GetPlayerSummaries/v0002/?steamids=${encodeURIComponent(
      steamId,
    )}`,
  );

  return data.response.players[0]
    ? success(data.response.players[0])
    : error("Error while trying to fetch player");
};

export const getOwnedGames = async (
  steamId: string,
): Promise<Result<string, OwnedGame[]>> => {
  const data = await fetchJson<GetOwnedGamesResponse>(
    `/steam/IPlayerService/GetOwnedGames/v0001/?steamid=${encodeURIComponent(
      steamId,
    )}&format=json&include_appinfo=0&include_played_free_games=1`,
  );
  return data.response.games
    ? success(data.response.games)
    : error("No games found, maybe the account is private?");
};

export const getAppList = async (): Promise<
  Result<string, GetAppListResponse>
> => {
  const data = await fetchJson<GetAppListResponse>(
    `/steam/ISteamApps/GetAppList/v0002/`,
  );

  return data.applist.apps
    ? success(data)
    : error("Error while trying to fetch app list");
};

export const getAppDetails = async (
  appId: string | number,
): Promise<Result<{ id: string; error: string }, SteamStoreAppDetailsData>> => {
  const id = String(appId);
  const data = await fetchJson<GetAppDetailsResponse>(
    `/store/api/appdetails?appids=${encodeURIComponent(id)}`,
  );
  const entry = data[id];
  return entry?.success && entry.data
    ? success(entry.data)
    : error({
        id,
        error: `Error while trying to fetch app details for app ${id}`,
      });
};

export interface GameLocation {
  country: string;
  region: string;
}

export const getGameCountryRegion = (
  game: SteamStoreAppDetailsData,
): GameLocation => {
  const developers = game.developers ?? "notagamedevelopper";

  const matches = rows.find((row) =>
    row[6]?.toLowerCase().includes(developers[0]?.toLowerCase()),
  );

  return {
    country: matches?.[10] || "",
    region: matches?.[7] || "",
  };
};

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: [number, number, number, number];
}

export const getCoordinatesFromLocation = async (
  location: GameLocation,
): Promise<{ coordinates: [number, number] } | null> => {
  const { country, region } = location;

  const data: NominatimResponse = await fetchJson(
    `/nominatim/search?q=${encodeURIComponent(country)}+${encodeURIComponent(region)}`,
  );

  return data.lat && data.lon
    ? { coordinates: [parseFloat(data.lat), parseFloat(data.lon)] }
    : null;
};
