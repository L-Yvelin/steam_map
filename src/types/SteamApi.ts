export type ResolveVanityURLResponse = {
  response: {
    steamid?: string;
    success: number;
    message?: string;
  };
};

export type SteamPlayerSummary = {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  profilestate?: number;
  lastlogoff?: number;
  timecreated?: number;
  loccountrycode?: string;
};

export type GetPlayerSummariesResponse = {
  response: {
    players: SteamPlayerSummary[];
  };
};

export type AppListApp = {
  appid: number;
  name: string;
};

export type GetAppListResponse = {
  applist: {
    apps: AppListApp[];
  };
};

export type OwnedGame = {
  appid: number;
  playtime_forever: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  playtime_deck_forever?: number;
  rtime_last_played?: number;
  playtime_disconnected?: number;
};

export type GetOwnedGamesResponse = {
  response: {
    game_count: number;
    games: OwnedGame[];
  };
};

export type SteamStoreRequirements = {
  minimum?: string;
  recommended?: string;
};

export type SteamStorePriceOverview = {
  currency: string;
  initial: number;
  final: number;
  discount_percent: number;
  initial_formatted: string;
  final_formatted: string;
};

export type SteamStorePackageSub = {
  packageid: number;
  percent_savings_text: string;
  percent_savings: number;
  option_text: string;
  option_description: string;
  can_get_free_license: string;
  is_free_license: boolean;
  price_in_cents_with_discount: number;
};

export type SteamStorePackageGroup = {
  name: string;
  title: string;
  description: string;
  selection_text: string;
  save_text: string;
  display_type: number;
  is_recurring_subscription: string;
  subs: SteamStorePackageSub[];
};

export type SteamStorePlatforms = {
  windows: boolean;
  mac: boolean;
  linux: boolean;
};

export type SteamStoreMetacritic = {
  score: number;
  url: string;
};

export type SteamStoreCategory = {
  id: number;
  description: string;
};

export type SteamStoreGenre = {
  id: string;
  description: string;
};

export type SteamStoreScreenshot = {
  id: number;
  path_thumbnail: string;
  path_full: string;
};

export type SteamStoreRecommendations = {
  total: number;
};

export type SteamStoreReleaseDate = {
  coming_soon: boolean;
  date: string;
};

export type SteamStoreSupportInfo = {
  url: string;
  email: string;
};

export type SteamStoreContentDescriptors = {
  ids: number[];
  notes: string | null;
};

export type SteamStoreRatingRegion = {
  rating: string;
  rating_generated?: string;
  required_age?: string | number;
  banned?: string | number;
  use_age_gate?: string | number | boolean;
  descriptors?: string | null;
};

export type SteamStoreRatings = Record<string, SteamStoreRatingRegion>;

export type SteamStoreMovie = {
  id: number;
  name: string;
  thumbnail: string;
  webm?: { [key: string]: string };
  mp4?: { [key: string]: string };
  highlight?: boolean;
  dash_av1?: string;
  dash_h264?: string;
  hls_h264?: string;
};

export type SteamStoreAchievementHighlight = {
  name: string;
  path: string;
};

export type SteamStoreAchievements = {
  total: number;
  highlighted?: SteamStoreAchievementHighlight[];
};

export type SteamStoreAppDetailsData = {
  type: string;
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  controller_support?: string;
  dlc?: number[];
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  supported_languages: string;
  reviews?: string;
  header_image: string;
  capsule_image: string;
  capsule_imagev5: string;
  website: string | null;
  pc_requirements?: SteamStoreRequirements;
  mac_requirements?: SteamStoreRequirements;
  linux_requirements?: SteamStoreRequirements;
  legal_notice?: string;
  developers: string[];
  publishers: string[];
  price_overview?: SteamStorePriceOverview;
  packages?: number[];
  package_groups?: SteamStorePackageGroup[];
  platforms?: SteamStorePlatforms;
  metacritic?: SteamStoreMetacritic;
  categories?: SteamStoreCategory[];
  genres?: SteamStoreGenre[];
  screenshots?: SteamStoreScreenshot[];
  movies?: SteamStoreMovie[];
  recommendations?: SteamStoreRecommendations;
  achievements?: SteamStoreAchievements;
  release_date?: SteamStoreReleaseDate;
  support_info?: SteamStoreSupportInfo;
  background?: string;
  background_raw?: string;
  content_descriptors?: SteamStoreContentDescriptors;
  ratings?: SteamStoreRatings;
};

export type SteamStoreAppDetailsEntry =
  | {
      success: true;
      data: SteamStoreAppDetailsData;
    }
  | {
      success: false;
    };

export interface GameLocation {
  country: string;
  region: string;
}

export type SimpleSteamGame = {
  name: string;
  steam_appid: number;
  capsule_image: string;
  developers: string[];
  location: GameLocation | null;
};

export type GetAppDetailsResponse = Record<string, SteamStoreAppDetailsEntry>;
