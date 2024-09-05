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
      <p>Below you can enter a word and see the numeronym below.</p>
      <div className="input-field col center s6 numeronym-input">
        <input
          id="input_word"
          className="validate"
          value={inputValue}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setInputValue(event.target.value)
          }
          type="text"
        />
        <label htmlFor="input_word">Word</label>
      </div>
      <h1 className="center">{getNumeronym(inputValue)}</h1>
    </div>
  );
};

export default Numeronym;
