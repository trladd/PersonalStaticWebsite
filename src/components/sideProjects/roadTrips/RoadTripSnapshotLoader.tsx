import React, { useEffect, useState } from "react";
import RoadTripShowcase from "./RoadTripShowcase";
import { fetchRoadTripMainPageSnapshot } from "./snapshot";
import { RoadTripShowcaseConfig } from "./types";

interface RoadTripSnapshotLoaderProps {
  className?: string;
  compactSummary?: boolean;
  mapFirst?: boolean;
  showBreakdowns?: boolean;
  showFilter?: boolean;
  showHeader?: boolean;
  showHero?: boolean;
  showHint?: boolean;
}

const RoadTripSnapshotLoader: React.FC<RoadTripSnapshotLoaderProps> = ({
  className,
  compactSummary,
  mapFirst,
  showBreakdowns,
  showFilter,
  showHeader,
  showHero,
  showHint,
}) => {
  const [snapshotConfig, setSnapshotConfig] =
    useState<RoadTripShowcaseConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = async () => {
      try {
        const config = await fetchRoadTripMainPageSnapshot();
        if (cancelled) {
          return;
        }

        setSnapshotConfig(config);
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the main-page road trip snapshot.",
        );
      }
    };

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!snapshotConfig && !errorMessage) {
    return (
      <div className={`roadTrips ${className ?? ""}`.trim()}>
        <section className="roadTrips__mapSection card-panel">
          <div
            className="roadTrips__routeStatus"
            role="status"
            aria-live="polite"
          >
            <span className="roadTrips__routeSpinner" />
            Loading road trip snapshot...
          </div>
        </section>
      </div>
    );
  }

  if (!snapshotConfig) {
    return (
      <div className={`roadTrips ${className ?? ""}`.trim()}>
        <section className="roadTrips__mapSection card-panel">
          <p className="roadTrips__sectionCopy">
            {errorMessage ?? "Unable to load the road trip snapshot right now."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <RoadTripShowcase
      title={snapshotConfig.title}
      intro={snapshotConfig.intro}
      trips={snapshotConfig.trips}
      autoResolveRoutes={false}
      className={className}
      compactSummary={compactSummary}
      mapFirst={mapFirst}
      showBreakdowns={showBreakdowns}
      showFilter={showFilter}
      showHeader={showHeader}
      showHero={showHero}
      showHint={showHint}
    />
  );
};

export default RoadTripSnapshotLoader;
