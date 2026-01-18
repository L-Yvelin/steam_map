import { useEffect, useState } from "react";
import classes from "./App.module.css";
import {
  fold,
  getAppDetails,
  getGameCountryRegion,
  getOwnedGames,
  getPlayerIdFromName,
  getPlayerSummary,
} from "./services/api";
import type {
  OwnedGame,
  SteamPlayerSummary,
  SteamStoreAppDetailsData,
} from "./types/SteamApi";
import Header from "./components/Header/Header.component";
import GameGrid from "./components/GameGrid/GameGrid";
import Input from "./components/Input/Input";
import Grid from "./assets/svg/grid.svg?react";
import Earth from "./assets/svg/earth.svg?react";
import Tabs from "./components/Tabs/Tabs";
import Tab from "./components/Tabs/Tab/Tab";
import classNames from "classnames";
import MapView from "./components/MapView/MapView";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerSummary, setPlayerSummary] = useState<SteamPlayerSummary | null>(
    null,
  );
  const [ownedGames, setOwnedGames] = useState<OwnedGame[]>([]);
  const [games, setGames] = useState<SteamStoreAppDetailsData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"earth" | "grid">("earth");
  const [locations, setLocations] = useState<string[]>([]);

  const resetState = () => {
    setPlayerId(null);
    setOwnedGames([]);
    setGames([]);
    setLocations([]);
  };

  const searchPlayer = () => {
    resetState();
    setError(null);
    if (/\d{17}/.test(playerName)) {
      setPlayerId(playerName);
    } else {
      getPlayerIdFromName(playerName).then(
        fold(
          (error) => {
            setError(error);
            resetState();
          },
          (playerId) => {
            setPlayerId(playerId);
            getPlayerSummary(playerId).then(
              fold(
                (error) => {
                  setError(error);
                  resetState();
                },
                (player) => setPlayerSummary(player),
              ),
            );
          },
        ),
      );
    }
  };

  useEffect(() => {
    if (playerId) {
      getOwnedGames(playerId).then(
        fold(
          (error) => {
            setError(error);
            resetState();
          },
          (ownedGames) => setOwnedGames(ownedGames),
        ),
      );
    }
  }, [playerId]);

  useEffect(() => {
    if (ownedGames?.length > 0) {
      getAppDetails(ownedGames.map((game) => game.appid)).then(
        fold(
          (error) => {
            setError(error);
            resetState();
          },
          (games) => setGames(games),
        ),
      );
    }
  }, [ownedGames]);

  return (
    <div className={classes.app}>
      <Header />
      <div className={classes.main}>
        <Input
          type="text"
          placeholder="Enter your Steam username or profile ID"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchPlayer();
            }
          }}
          onSearch={searchPlayer}
        />
        <div className={classes.error}>{error}</div>
        <div className={classes.tabsContent}>
          <Tabs>
            <Tab active={view === "earth"} onClick={() => setView("earth")}>
              <Earth height={16} width={16} />
            </Tab>
            <Tab active={view === "grid"} onClick={() => setView("grid")}>
              <Grid height={16} width={16} />
            </Tab>
          </Tabs>
          <div
            className={classNames(classes.tabContent, {
              [classes.earthView]: view === "earth",
            })}
          >
            <GameGrid
              className={classNames(classes.gameGrid, {
                [classes.hidden]: view !== "grid",
              })}
              games={games}
              total={ownedGames.length}
            />
            <MapView
              games={games}
              locations={locations}
              playerSummary={playerSummary}
              className={classNames(classes.earth, {
                [classes.hidden]: view !== "earth",
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
