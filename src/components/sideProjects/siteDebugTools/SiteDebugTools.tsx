import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
} from "react";
import UserDeviceInfo from "./UserDeviceInfo";
import M from "materialize-css";
import styles from "./SiteDebugTools.module.css";

interface SiteDebugToolsProps {
  navWrapperRef: React.RefObject<HTMLDivElement>;
}

interface NetworkInfo {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}
const SiteDebugProps: React.FC<SiteDebugToolsProps> = ({ navWrapperRef }) => {
  const [localStorageItems, setLocalStorageItems] = useState<
    { key: string; value: string | null }[]
  >([]);

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    online: navigator.onLine,
  });

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
    const elems = document.querySelectorAll(".tabs");
    M.Tabs.init(elems, {});
    setTabsOffset();
  }, []);

  useEffect(() => {
    updateLocalStorage();
  }, []);

  useEffect(() => {
    const nav: any = window.navigator;
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      });
    };

    updateNetworkInfo();

    window.addEventListener("online", updateNetworkInfo);
    window.addEventListener("offline", updateNetworkInfo);
    connection?.addEventListener?.("change", updateNetworkInfo);

    return () => {
      window.removeEventListener("online", updateNetworkInfo);
      window.removeEventListener("offline", updateNetworkInfo);
      connection?.removeEventListener?.("change", updateNetworkInfo);
    };
  }, []);

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
    {
      name: "Network & Connectivity",
      content: (
        <div className="container">
          <h1>Network & Connectivity</h1>
          <p>
            Online Status:{" "}
            <b>{networkInfo.online ? "Online" : "Offline"}</b>
          </p>
          {networkInfo.effectiveType ? (
            <>
              <p>Connection Type: {networkInfo.effectiveType}</p>
              <p>Estimated Downlink: {networkInfo.downlink} Mbps</p>
              <p>Estimated RTT: {networkInfo.rtt} ms</p>
              <p>
                Data Saver Enabled: {networkInfo.saveData ? "Yes" : "No"}
              </p>
            </>
          ) : (
            <p>
              Detailed connection information is not available in this browser,
              but online/offline status is always shown.
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container flow-text">
      <p>
        This section showcases client-side diagnostics I use to understand how
        the site behaves in a real browser. It highlights the kinds of data
        available directly from the device and network—without any backend
        integration—covering local storage, device capabilities, and
        connectivity characteristics.
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
