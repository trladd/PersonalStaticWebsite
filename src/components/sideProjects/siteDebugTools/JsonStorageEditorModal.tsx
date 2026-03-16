import React, { useCallback, useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import prettier from "prettier/standalone";
import babelPlugin from "prettier/plugins/babel";
import estreePlugin from "prettier/plugins/estree";
import M from "materialize-css";
import styles from "./SiteDebugTools.module.css";

type JsonStorageEditorModalProps = {
  storageKey: string | null;
  rawValue: string | null;
  onClose: () => void;
  onSave: (nextValue: string) => void;
};

const formatJsonForEditor = async (rawValue: string) =>
  prettier.format(rawValue, {
    parser: "json-stringify",
    plugins: [babelPlugin, estreePlugin],
  });

const getLineAndColumnFromIndex = (source: string, index: number) => {
  const safeIndex = Math.max(0, Math.min(index, source.length));
  const precedingText = source.slice(0, safeIndex);
  const lines = precedingText.split("\n");

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
};

const getJsonValidationMessage = (value: string) => {
  try {
    JSON.parse(value);
    return "";
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Enter valid JSON before saving.";
    const positionMatch = rawMessage.match(/position\s+(\d+)/i);

    if (!positionMatch) {
      return rawMessage;
    }

    const position = Number(positionMatch[1]);
    if (!Number.isFinite(position)) {
      return rawMessage;
    }

    const { line, column } = getLineAndColumnFromIndex(value, position);
    return `${rawMessage} Line ${line}, column ${column}.`;
  }
};

const JsonStorageEditorModal: React.FC<JsonStorageEditorModalProps> = ({
  storageKey,
  rawValue,
  onClose,
  onSave,
}) => {
  const [editorValue, setEditorValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState("");

  const resetEditorValue = useCallback(async () => {
    if (rawValue === null) {
      setEditorValue("");
      return;
    }

    try {
      setEditorValue(await formatJsonForEditor(rawValue));
    } catch (error) {
      setEditorValue(rawValue);
    }
  }, [rawValue]);

  useEffect(() => {
    if (!storageKey || rawValue === null) {
      return;
    }

    resetEditorValue();
    setValidationError("");
  }, [rawValue, resetEditorValue, storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [storageKey]);

  const canSave = useMemo(
    () =>
      isEditing &&
      editorValue.trim().length > 0 &&
      validationError.trim().length === 0,
    [editorValue, isEditing, validationError],
  );

  useEffect(() => {
    if (!isEditing) {
      setValidationError("");
      return;
    }

    if (editorValue.trim().length === 0) {
      setValidationError("Enter valid JSON before saving.");
      return;
    }

    setValidationError(getJsonValidationMessage(editorValue));
  }, [editorValue, isEditing]);

  if (!storageKey || rawValue === null) {
    return null;
  }

  const handleSave = () => {
    const nextValidationError = getJsonValidationMessage(editorValue);
    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    const parsed = JSON.parse(editorValue);
    onSave(JSON.stringify(parsed));
    setIsEditing(false);
    setValidationError("");
    M.toast({ html: `Saved ${storageKey}`, displayLength: 2200 });
  };

  const handleClose = () => {
    setIsEditing(false);
    setValidationError("");
    onClose();
  };

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="json-storage-modal-title"
      onClick={handleClose}
    >
      <div
        className={styles.jsonModal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.jsonModalHeader}>
          <div>
            <h2 id="json-storage-modal-title" className={styles.modalTitle}>
              JSON editor
            </h2>
            <div className={styles.modalSubtitle}>{storageKey}</div>
          </div>
          <button
            type="button"
            className="btn-flat"
            onClick={handleClose}
            aria-label="Close JSON editor"
          >
            <i className="material-icons">close</i>
          </button>
        </div>

        <p className={styles.modalHelperText}>
          This opens the stored value as formatted JSON. Save writes it back to
          local storage in a compact JSON string.
        </p>

        {validationError ? (
          <div className={styles.validationBanner}>{validationError}</div>
        ) : null}

        <div className={styles.codeMirrorShell}>
          <CodeMirror
            value={editorValue}
            height="420px"
            extensions={[json()]}
            editable={isEditing}
            onChange={(value) => setEditorValue(value)}
            basicSetup={{
              foldGutter: false,
              highlightActiveLineGutter: false,
            }}
          />
        </div>

        <div className={styles.modalActions}>
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn-flat"
                onClick={async () => {
                  await resetEditorValue();
                  setIsEditing(false);
                  setValidationError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                disabled={!canSave}
                onClick={handleSave}
              >
                Save JSON
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => setIsEditing(true)}
            >
              Edit JSON
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonStorageEditorModal;
