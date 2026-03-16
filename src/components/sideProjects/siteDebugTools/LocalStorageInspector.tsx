import React, { useCallback, useMemo, useState } from "react";
import M from "materialize-css";
import JsonStorageEditorModal from "./JsonStorageEditorModal";
import styles from "./SiteDebugTools.module.css";

type StorageItem = {
  key: string;
  value: string | null;
  isJson: boolean;
};

const parseJsonCandidate = (value: string | null) => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();
  const attempts = [trimmedValue];

  try {
    const firstPass = JSON.parse(trimmedValue);
    if (typeof firstPass === "string") {
      attempts.push(firstPass.trim());
    } else if (firstPass && typeof firstPass === "object") {
      return true;
    }
  } catch (error) {
    return false;
  }

  return attempts.some((candidate) => {
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
      return false;
    }

    try {
      const parsed = JSON.parse(candidate);
      return typeof parsed === "object" && parsed !== null;
    } catch (error) {
      return false;
    }
  });
};

const buildStorageItems = (): StorageItem[] => {
  const items: StorageItem[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) {
      continue;
    }

    const value = localStorage.getItem(key);
    items.push({
      key,
      value,
      isJson: parseJsonCandidate(value),
    });
  }

  return items.sort((left, right) => left.key.localeCompare(right.key));
};

const getValuePreview = (value: string | null) => {
  if (value === null) {
    return "(null)";
  }

  return value.length > 160 ? `${value.slice(0, 157)}...` : value;
};

const LocalStorageInspector: React.FC = () => {
  const [localStorageItems, setLocalStorageItems] =
    useState<StorageItem[]>(buildStorageItems);
  const [selectedJsonKey, setSelectedJsonKey] = useState<string | null>(null);

  const refreshLocalStorage = useCallback(() => {
    setLocalStorageItems(buildStorageItems());
  }, []);

  const selectedJsonItem = useMemo(
    () =>
      localStorageItems.find((item) => item.key === selectedJsonKey) ?? null,
    [localStorageItems, selectedJsonKey],
  );

  const clearAllLocalStorage = () => {
    localStorage.clear();
    refreshLocalStorage();
    M.toast({ html: "Cleared local storage", displayLength: 2200 });
  };

  const clearSingleItem = (key: string) => {
    localStorage.removeItem(key);
    refreshLocalStorage();
    if (selectedJsonKey === key) {
      setSelectedJsonKey(null);
    }
    M.toast({ html: `Removed ${key}`, displayLength: 2200 });
  };

  const handleSaveJson = (nextValue: string) => {
    if (!selectedJsonKey) {
      return;
    }

    localStorage.setItem(selectedJsonKey, nextValue);
    refreshLocalStorage();
    setSelectedJsonKey(null);
  };

  const copyValueToClipboard = async (key: string, value: string | null) => {
    try {
      await navigator.clipboard.writeText(value ?? "");
      M.toast({ html: `Copied ${key}`, displayLength: 1800 });
    } catch (error) {
      M.toast({
        html: `Couldn't copy ${key} to clipboard`,
        displayLength: 2200,
      });
    }
  };

  return (
    <div className="container">
      <h1>Local Storage</h1>
      <p className={styles.sectionHelper}>
        Inspect stored browser state, clear individual keys, and open JSON
        values in a read-only editor before choosing to edit them.
      </p>

      <div className={styles.storageToolbar}>
        <button type="button" className="btn-flat" onClick={refreshLocalStorage}>
          Refresh
        </button>
        <button
          type="button"
          className="btn red lighten-1"
          onClick={clearAllLocalStorage}
          disabled={localStorageItems.length === 0}
        >
          Clear all local storage
        </button>
      </div>

      {localStorageItems.length === 0 ? (
        <p>No local storage entries are currently set.</p>
      ) : (
        <div className={styles.storageTableShell}>
          <table className={styles.storageTable}>
            <thead>
              <tr>
                <th>Item key</th>
                <th>Stored value</th>
                <th className={styles.actionsColumn}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localStorageItems.map((item) => (
                <tr key={item.key}>
                  <td className={styles.storageKeyCell}>{item.key}</td>
                  <td className={styles.storageValueCell}>
                    <code title={item.value ?? "(null)"}>
                      {getValuePreview(item.value)}
                    </code>
                  </td>
                  <td className={styles.storageActions}>
                    <button
                      type="button"
                      className="btn-flat"
                      title="Copy value"
                      aria-label={`Copy value for ${item.key}`}
                      onClick={() => copyValueToClipboard(item.key, item.value)}
                    >
                      <i className="material-icons">content_copy</i>
                    </button>
                    {item.isJson ? (
                      <button
                        type="button"
                        className="btn-flat"
                        title="Open JSON viewer"
                        aria-label={`Open JSON viewer for ${item.key}`}
                        onClick={() => setSelectedJsonKey(item.key)}
                      >
                        <i className="material-icons">data_object</i>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn-flat"
                      onClick={() => clearSingleItem(item.key)}
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <JsonStorageEditorModal
        storageKey={selectedJsonItem?.key ?? null}
        rawValue={selectedJsonItem?.value ?? null}
        onClose={() => setSelectedJsonKey(null)}
        onSave={handleSaveJson}
      />
    </div>
  );
};

export default LocalStorageInspector;
