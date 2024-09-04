import React from "react";

interface NumeronymProps {}

const Numeronym: React.FC<NumeronymProps> = () => {
  const word = "personalization";
  const firstLetter = word[0];
  const lastLetter = word[word.length - 1];
  const middle = word.length - 2;
  return (
    <div>
      <p>
        A numeronym is a way of displaying a shortened word. This is done by
        taking the first character, last character, as well as the length of the
        word to build out the word. For example, the word {word}
      </p>
      {firstLetter}
      {middle}
      {lastLetter}
    </div>
  );
};

export default Numeronym;
