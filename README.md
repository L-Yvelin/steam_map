# Steam Game Map

Visualize the countries of origin of the games in a Steam library.

The application resolves a Steam user (via vanity username or numeric profile ID), retrieves owned games, determines their developers, maps developers to countries, and renders the result on a world map.

## Demo

Live demo available at: [steam.yvelin.net](https://steam.yvelin.net)

## Tech Stack

![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-TSX-3178c6)
![react-zoom-pan-pinch](https://img.shields.io/badge/react--zoom--pan--pinch-interactions-orange)
![Geo Data](https://img.shields.io/badge/Geo%20Data-Natural%20Earth%20110m-green)

## Geographic Data

World boundaries are based on:

- `datasets/geo-boundaries-world-110m`  
  Source: Natural Earth, 1:110m resolution

Used exclusively for country-level visualization.

## Data Sources

### Steam Web API

Used to:
- Resolve a numeric SteamID64 when a vanity username is provided
- Retrieve the list of owned games for a user

### Steam Store API

Used to:
- Fetch detailed game metadata
- Extract developer names for each game

### Developer → Country Mapping

Developer country attribution is derived from:
- A CSV dataset sourced from  
  https://gigasheet.com/sample-data/free-list-of-computer-games-businessescsv
- The dataset was refined to better match game developers
- An `ISO2` country code column was added using a Python script
- Mapping currently uses a simple `includes()` search; may be refined in future

## Caching Strategy

To avoid rate limiting from Steam Store API endpoints:

- Each Steam Store API response is saved as JSON in: `.cache/steam/`
- Cached responses are committed to the repository so everyone can use them
- The actual API serves as a fallback for missing entries
- The cache is local, file-based, and located at the repository root

## Data Flow

1. User provides a Steam username or numeric profile ID
2. Steam Web API resolves the profile and owned games
3. Steam Store API provides game metadata and developer names
4. Developer names are mapped to countries via the refined CSV dataset
5. Country data is aggregated and rendered on the world map

## Setup and Run

```bash
cp .env.example .env
npm install
npm run build
npm run start
```

## Environment Variables
| Variable      | Required | Description                                                   |
| ------------- | -------- | ------------------------------------------------------------- |
| STEAM_API_KEY | yes      | Steam Web API key used to query user profiles and owned games |

## Limitations

* The map can be buggy occasionally; rendering may not always be accurate
* Developer → country mapping is heuristic and may misattribute games
* Accuracy depends on the completeness of the developer dataset and Steam metadata

## License
MIT
