import React, { useState, useEffect } from "react";
import M from "materialize-css"; // Import the necessary library

interface SiteDebugProps {}
/**
 * Takes in a single string and returns a numeronym
 */
const getNumeronym = (input: string) => {
  if (input.length <= 2) {
    return input;
  }
  return `${input[0]}${input.length - 2}${input[input.length - 1]}`;
};

const SiteDebugProps: React.FC<SiteDebugProps> = () => {
  const [inputValue, setInputValue] = useState("");
  const [localStorageItems, setLocalStorageItems] = useState<
    { key: string; value: string | null }[]
  >([]);

  useEffect(() => {
    const items: { key: string; value: string | null }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items.push({ key, value: localStorage.getItem(key) });
      }
    }
    setLocalStorageItems(items);
  }, [localStorageItems]);

  const clearLocalStorage = () => {
    localStorage.clear();
    setLocalStorageItems([]);
  };

  return (
    <div className="container flow-text">
      <p>
        This page to contain debug tools and really just a fun playground too
        for me to show things in the UI that happen behind the scenes
      </p>
      <div>
        <h4> Local Storage</h4>
        <table className="container">
          <thead>
            <tr>
              <th>Item Key</th>
              <th>Item Value</th>
            </tr>
          </thead>

          <tbody>
            {localStorageItems.map((item) => (
              <tr key={item.key}>
                <td>{item.key}</td> <td>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn red" onClick={clearLocalStorage}>
          Clear Local Storage
        </button>
      </div>
    </div>
  );
};

export default SiteDebugProps;
