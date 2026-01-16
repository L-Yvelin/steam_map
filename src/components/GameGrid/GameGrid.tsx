import classNames from "classnames";
import type { SteamStoreAppDetailsData } from "../../types/SteamApi";
import classes from "./GameGrid.module.css";
import { getLocationFromGame } from "../../services/api";
import { useEffect, useState } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import Empty from "../Empty/Empty";

interface GameGridProps extends React.HTMLAttributes<HTMLDivElement> {
  games: SteamStoreAppDetailsData[] | null;
  loading: boolean;
  total: number;
}

const GameLocation = ({ game }: { game: SteamStoreAppDetailsData }) => {
  const [isoCode, setIsoCode] = useState<string | null>(null);

  useEffect(() => {
    getLocationFromGame(game).then((code) => {
      setIsoCode(code ?? null);
    });
  }, [game]);

  if (!isoCode) return null;

  const Flag = (Flags as any)[isoCode.toUpperCase()];

  return (
    <div className={classes.gameGridItemLocation}>
      {Flag ? (
        <Flag title={isoCode} style={{ width: "24px", display: "block" }} />
      ) : (
        <span>{isoCode}</span>
      )}
    </div>
  );
};

const GameGrid = ({
  games,
  loading,
  total,
  className,
  ...props
}: GameGridProps) => {
  if (loading) {
    return <div className={classes.gameGridLoading}>Loading...</div>;
  }

  if (games === null || games.length === 0) {
    return <Empty className={className} />;
  }

  return (
    <div className={classNames(classes.gameGrid, className)} {...props}>
      {games.map((game) => (
        <div className={classes.gameGridItem} key={game.steam_appid}>
          <img
            className={classes.gameGridItemImage}
            src={game.capsule_image}
            alt={game.name}
          />
          <div className={classes.gameGridItemTitle}>
            <h1>{game.name}</h1> <GameLocation game={game} />
          </div>
          <div className={classes.gameGridItemDetails}>
            <div className={classes.gameGridItemDevelopers}>
              {game.developers?.join(", ")}
            </div>
          </div>
        </div>
      ))}
      {total > games.length && (
        <div
          className={classNames(classes.gameGridItem, classes.gameGridItemMore)}
        >
          {total - games.length} more
        </div>
      )}
    </div>
  );
};

export default GameGrid;
