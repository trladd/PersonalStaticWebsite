import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
} from "react";
import UserDeviceInfo from "./UserDeviceInfo";
import M from "materialize-css"; // Import the necessary library
import styles from "./SiteDebugTools.module.css"; // Import the CSS Module

interface SiteDebugToolsProps {
  navWrapperRef: React.RefObject<HTMLDivElement>;
}
const SiteDebugProps: React.FC<SiteDebugToolsProps> = ({ navWrapperRef }) => {
  const [localStorageItems, setLocalStorageItems] = useState<
    { key: string; value: string | null }[]
  >([]);

  const debugTabsRef = useRef<HTMLUListElement>(null);

  const updateLocalStorage = () => {
    const items: { key: string; value: string | null }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items.push({ key, value: localStorage.getItem(key) });
      }
    }
    setLocalStorageItems(items);
  };

  const setTabsOffset = () => {
    if (navWrapperRef.current && debugTabsRef.current) {
      const navHeight = navWrapperRef.current.offsetHeight;
      debugTabsRef.current.style.top = `${navHeight}px`;
    }
  };

  useLayoutEffect(() => {
    setTabsOffset();
  });

  useEffect(() => {
    var elems = document.querySelectorAll(".tabs");
    M.Tabs.init(elems, {});
    setTabsOffset();
  }, []);

  useEffect(() => {
    updateLocalStorage();
  }, [localStorageItems]);

  const clearLocalStorage = () => {
    localStorage.clear();
    setLocalStorageItems([]);
  };
  type Tabs = {
    name: string;
    content: ReactNode;
  };
  const tabs: Tabs[] = [
    {
      name: "Local Storage",
      content: (
        <div className="container">
          <h1>Local Storage</h1>
          <div className="row">
            <div className="col s12 m8 l6">
              <table className="mt-2 mb-2">
                <thead>
                  <tr>
                    <th>Item Key</th>
                    <th>Item Value</th>
                  </tr>
                </thead>
                <tbody>
                  {localStorageItems.map((item) => (
                    <tr key={item.key}>
                      <td>{item.key}</td>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn red mt-2 mb-2" onClick={clearLocalStorage}>
                Clear Local Storage
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Device Info",
      content: <UserDeviceInfo />,
    },
  ];

  return (
    <div className="">
      <p>
        This section of my site features debugging tools and interactive
        explorations of the data provided by browsers and devices. I find it
        fascinating to work with the available information and uncover insights
        into what a browser can reveal about user interactions.
      </p>
      <ul
        id="debugToolsTabs"
        className={"tabs " + styles.debugTabs}
        ref={debugTabsRef}
      >
        {tabs.map((tab, index) => (
          <li className="tab col s3" key={index}>
            <a href={`#tab-${index}`}>{tab.name}</a>
          </li>
        ))}
      </ul>
      <div className={styles.tabContent}>
        {tabs.map((tab, index) => (
          <div id={`tab-${index}`} key={index} className={styles.debugTabPane}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteDebugProps;
