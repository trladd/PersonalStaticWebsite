import React, { useEffect, useState } from "react";
import M from "materialize-css";
import {
  buildRoadTripShowcaseSnapshot,
  DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META,
  fetchRoadTripMainPageSnapshot,
  ROAD_TRIP_MAIN_PAGE_SNAPSHOT_PATH,
  ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH,
  primeRouteCacheFromTrips,
} from "../roadTrips/snapshot";
import { loadSavedTrips, saveTrips } from "../roadTrips/storage";
import styles from "./SiteDebugTools.module.css";

const RoadTripSnapshotWorkbench: React.FC = () => {
  const [jsonValue, setJsonValue] = useState("");
  const [snapshotTitle, setSnapshotTitle] = useState(
    DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META.title,
  );
  const [snapshotIntro, setSnapshotIntro] = useState(
    DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META.intro,
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isUpdatingAtlas, setIsUpdatingAtlas] = useState(false);

  const loadSnapshotPreview = async ({
    cache,
    showToastOnError,
  }: {
    cache: RequestCache;
    showToastOnError: boolean;
  }) => {
    setIsLoadingPreview(true);

    try {
      const snapshot = await fetchRoadTripMainPageSnapshot({ cache });
      const serialized = JSON.stringify(snapshot, null, 2);

      setSnapshotTitle(snapshot.title);
      setSnapshotIntro(snapshot.intro);
      setJsonValue(serialized);
      return snapshot;
    } catch (error) {
      if (showToastOnError) {
        M.toast({
          html:
            error instanceof Error
              ? error.message
              : "Unable to load the main-page snapshot right now.",
          displayLength: 3200,
        });
      }
      return null;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    void loadSnapshotPreview({
      cache: "default",
      showToastOnError: false,
    });
  }, []);

  const handleUpdateAtlasFromMainPage = async () => {
    try {
      setIsUpdatingAtlas(true);
      const snapshot = await loadSnapshotPreview({
        cache: "no-cache",
        showToastOnError: false,
      });

      if (!snapshot) {
        throw new Error(
          `Unable to load ${ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}.`,
        );
      }

      primeRouteCacheFromTrips(snapshot.trips);
      saveTrips(snapshot.trips);

      M.toast({
        html: `Updated local atlas from ${ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}.`,
        displayLength: 3200,
      });
    } catch (error) {
      M.toast({
        html:
          error instanceof Error
            ? error.message
            : "Unable to update the atlas from the main-page snapshot right now.",
        displayLength: 3200,
      });
    } finally {
      setIsUpdatingAtlas(false);
    }
  };

  const handleCopyCurrentAtlas = async () => {
    const snapshot = buildRoadTripShowcaseSnapshot({
      title: snapshotTitle,
      intro: snapshotIntro,
      trips: loadSavedTrips(),
    });
    const serialized = JSON.stringify(snapshot, null, 2);

    setJsonValue(serialized);

    try {
      await navigator.clipboard.writeText(serialized);
      M.toast({
        html: `Copied current atlas snapshot. Paste it into ${ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}.`,
        displayLength: 3600,
      });
    } catch (error) {
      M.toast({
        html: `Loaded the current atlas snapshot into the preview, but couldn't copy it automatically. File: ${ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}.`,
        displayLength: 3600,
      });
    }
  };

  return (
    <div className="container">
      <h1>Road Trip Snapshot</h1>
      <p className={styles.sectionHelper}>
        Use this to sync your local atlas with the main-page snapshot, then copy
        your updated atlas state back into the repo file when you are happy with
        it.
      </p>
      <p className={styles.sectionHelper}>
        Repo file: <code>{ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}</code>
      </p>
      <p className={styles.sectionHelper}>
        Runtime fetch path: <code>{ROAD_TRIP_MAIN_PAGE_SNAPSHOT_PATH}</code>
      </p>
      <p className={styles.sectionHelper}>
        Use <strong>Update atlas from main page</strong> to pull the repo
        snapshot into local atlas storage. After editing trips in the atlas UI,
        use <strong>Copy current atlas state</strong> and paste it back into{" "}
        <code>{ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}</code>.
      </p>

      <div className={styles.storageToolbar}>
        <button
          type="button"
          className="btn-flat"
          onClick={() => {
            void handleUpdateAtlasFromMainPage();
          }}
          disabled={isUpdatingAtlas}
        >
          {isUpdatingAtlas
            ? "Updating atlas..."
            : "Update atlas from main page"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void handleCopyCurrentAtlas();
          }}
        >
          Copy current atlas state
        </button>
      </div>

      <label className={styles.snapshotField}>
        <span className={styles.snapshotLabel}>
          {isLoadingPreview
            ? "Loading snapshot preview..."
            : "Snapshot preview"}
        </span>
        <textarea
          className={`materialize-textarea ${styles.snapshotTextarea}`}
          value={jsonValue}
          readOnly
          placeholder="Use the buttons above to sync from the main-page snapshot or copy your current atlas state"
          spellCheck={false}
        />
      </label>
    </div>
  );
};

export default RoadTripSnapshotWorkbench;
