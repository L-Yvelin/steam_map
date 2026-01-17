import classNames from "classnames";
import type {
  SteamPlayerSummary,
  SteamStoreAppDetailsData,
} from "../../types/SteamApi";
import classes from "./MapView.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Panzoom from "@panzoom/panzoom";

interface MapViewProps extends React.HTMLAttributes<HTMLDivElement> {
  games: SteamStoreAppDetailsData[] | null;
  locations: string[] | null;
  playerSummary: SteamPlayerSummary | null;
}

const project = (lambda: number, phi: number) => {
  const x = (lambda + 180) * 2;
  const y = (90 - phi) * (400 / 180);
  return [x, y];
};

const getRingPath = (ring: any[]) =>
  "M" + ring.map((c) => project(c[0], c[1]).join(",")).join("L") + "Z";

const renderPath = (geometry: any) => {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(getRingPath).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((poly: any[][]) => poly.map(getRingPath).join(" "))
      .join(" ");
  }
  return "";
};

const MapView = ({
  games,
  locations,
  playerSummary,
  className,
  ...props
}: MapViewProps) => {
  const [geoJson, setGeoJson] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson",
    )
      .then((res) => res.json())
      .then(setGeoJson);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const panzoom = Panzoom(mapRef.current, {
      maxScale: 20,
      minScale: 0.1,
      contain: "outside",
      startScale: 1,
      step: 0.3,
    });

    const parent = mapRef.current.parentElement;
    if (parent) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        // Normalize zoom for trackpads vs mouse wheels
        const delta = e.deltaY;
        const scaleDelta = -delta * (e.deltaMode === 1 ? 0.05 : 0.001);
        const newScale = panzoom.getScale() * (1 + scaleDelta);
        panzoom.zoomToPoint(newScale, {
          clientX: e.clientX,
          clientY: e.clientY,
        });
      };

      parent.addEventListener("wheel", handleWheel, { passive: false });

      // Initial scale to cover
      const { width: pW, height: pH } = parent.getBoundingClientRect();
      const scale = Math.max(pW / 800, pH / 400);
      panzoom.zoom(scale, { animate: false });
      panzoom.pan((pW - 800 * scale) / 2, (pH - 400 * scale) / 2, {
        animate: false,
      });

      return () => {
        panzoom.destroy();
        parent.removeEventListener("wheel", handleWheel);
      };
    }

    return () => {
      panzoom.destroy();
    };
  }, [geoJson]);

  const mapPaths = useMemo(() => {
    const counts: Record<string, number> = {};
    locations?.forEach((loc) => {
      const normalized = loc.trim().toUpperCase();
      counts[normalized] = (counts[normalized] || 0) + 1;
    });
    const playerLocation = playerSummary?.loccountrycode?.toUpperCase() || "";

    const maxCount = Math.max(...Object.values(counts), 0);

    return geoJson?.features.map((feature: any) => {
      const props = feature.properties;
      const iso2 = (
        props.iso_a2 ||
        props.ISO_A2 ||
        props.iso2 ||
        props.iso_3166_1_alpha_2 ||
        props.ISO_A2_EH ||
        props.iso_a2_eh ||
        ""
      )
        .trim()
        .toUpperCase();

      const count = counts[iso2] || 0;
      const opacity = maxCount > 0 ? count / maxCount : 0;

      return (
        <path
          key={feature.properties.NAME || feature.properties.name || feature.id}
          d={renderPath(feature.geometry)}
          className={classes.land}
          style={
            iso2 === playerLocation
              ? {
                  fill: "rgba(0, 255, 0, 0.8)",
                }
              : count > 0
                ? ({
                    fill: `rgba(255, 0, 0, ${0.3 + opacity * 0.7})`,
                    stroke: "rgba(255, 255, 255, 0.5)",
                    strokeWidth: 0.5,
                  } as React.CSSProperties)
                : {}
          }
        />
      );
    });
  }, [geoJson, locations, playerSummary]);

  return (
    <div className={classNames(classes.mapView, className)} {...props}>
      <div ref={mapRef} className={classes.mapWrapper}>
        <svg
          viewBox="0 0 800 400"
          className={classes.svg}
          preserveAspectRatio="xMidYMid meet"
        >
          {mapPaths}
        </svg>
      </div>
    </div>
  );
};

export default MapView;
