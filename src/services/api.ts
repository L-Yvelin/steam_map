import type {
  GameLocation,
  GetAppDetailsResponse,
  GetAppListResponse,
  GetOwnedGamesResponse,
  GetPlayerSummariesResponse,
  OwnedGame,
  ResolveVanityURLResponse,
  SteamPlayerSummary,
  SteamStoreAppDetailsData,
  SteamStoreAppDetailsEntry,
} from "../types/SteamApi";

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

const fetchJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(input, init);
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
  appIds: number[],
): Promise<Result<string, SteamStoreAppDetailsData[]>> => {
  try {
    const data = await fetchJson<GetAppDetailsResponse[]>(
      `/store/api/appdetails`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appIds),
      },
    );

    function hasData(
      entry: SteamStoreAppDetailsEntry,
    ): entry is Extract<SteamStoreAppDetailsEntry, { success: true }> {
      return entry.success === true;
    }

    const games = data
      .map((app) => Object.values(app)[0])
      .filter(hasData)
      .map((entry) => entry.data);

    return success(games);
  } catch {
    return error("Error while trying to fetch app details");
  }
};

export const getGameCountryRegion = async (
  game: SteamStoreAppDetailsData,
): Promise<GameLocation> => {
  const data = await fetchJson<{ iso2: string }>(
    `/devIso2?developerName=${encodeURIComponent(game.developers?.[0] ?? "")}`,
  );

  console.log(data);

  return {
    country: data.iso2 ?? "",
    region: "",
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
    `/nominatim/search?q=${encodeURIComponent(country)}+${encodeURIComponent(
      region,
    )}`,
  );

  return data.lat && data.lon
    ? { coordinates: [parseFloat(data.lat), parseFloat(data.lon)] }
    : null;
};
