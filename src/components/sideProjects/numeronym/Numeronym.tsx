import React, { useState, useEffect } from "react";
import M from "materialize-css"; // Import the necessary library

interface NumeronymProps {}
/**
 * Takes in a single string and returns a numeronym
 */
const getNumeronym = (input: string) => {
  if (input.length <= 2) {
    return input;
  }
  return `${input[0]}${input.length - 2}${input[input.length - 1]}`;
};

const Numeronym: React.FC<NumeronymProps> = () => {
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<"single" | "multi">("single");

  const handleModeChange = (nextMode: "single" | "multi") => {
    setMode(nextMode);
    if (nextMode === "single") {
      setInputValue((prev) => prev?.split(" ")?.[0] || "");
    }
  };

  const getOutput = () => {
    if (!inputValue) {
      return "";
    }

    if (mode === "single") {
      return getNumeronym(inputValue);
    }

    return inputValue
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(getNumeronym)
      .join(" ");
  };

  useEffect(() => {
    M.updateTextFields();
  }, []);

  return (
    <div className="container flow-text">
      <p>
        A numeronym is a way of displaying a shortened word. This is done by
        taking the first character, last character, as well as the length of the
        word to build out the word. For example, some common words are{" "}
        <i>internationalization</i> ({getNumeronym("internationalization")}) and{" "}
        <i>personalization</i> ({getNumeronym("personalization")})
      </p>
      <p>
        Below you can enter either a single word or multiple words and see the
        numeronym(s) below.
      </p>

      <div
        className="row"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          textAlign: "left",
        }}
      >
        <p>
          <label>
            <input
              name="numeronym-mode"
              type="radio"
              checked={mode === "single"}
              onChange={() => handleModeChange("single")}
            />
            <span>Single word</span>
          </label>
        </p>
        <p>
          <label>
            <input
              name="numeronym-mode"
              type="radio"
              checked={mode === "multi"}
              onChange={() => handleModeChange("multi")}
            />
            <span>Multiple words / paragraph</span>
          </label>
        </p>
      </div>

      {mode === "single" ? (
        <div
          className="input-field numeronym-input"
          style={{ maxWidth: "500px", width: "100%", margin: "0 auto" }}
        >
          <input
            id="input_word_single"
            className="validate"
            value={inputValue}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setInputValue(event.target.value.replace(/\s+/g, ""))
            }
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === " ") {
                event.preventDefault();
                M.toast({
                  html: "Space is not allowed in single word mode",
                  displayLength: 3000,
                });
              }
            }}
            type="text"
            maxLength={50}
          />
          <label htmlFor="input_word_single">Word</label>
        </div>
      ) : (
        <div
          className="input-field numeronym-input"
          style={{ width: "80%", margin: "0 auto" }}
        >
          <textarea
            id="input_word_multi"
            className="materialize-textarea"
            value={inputValue}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInputValue(event.target.value)
            }
            maxLength={500}
          />
          <label htmlFor="input_word_multi">Words / sentence / paragraph</label>
        </div>
      )}
      <h1
        className="center"
        style={{ whiteSpace: "normal", wordWrap: "break-word" }}
      >
        {getOutput()}
      </h1>
    </div>
  );
};

export default Numeronym;
