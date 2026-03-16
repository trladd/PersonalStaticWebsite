import React, {
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import M from "materialize-css";
import { ThemeContext } from "../../../utility/ThemeContext";
import UserDeviceInfo from "./UserDeviceInfo";
import LocalStorageInspector from "./LocalStorageInspector";
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

type BrowserNetworkConnection = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

type DebugTab = {
  name: string;
  content: ReactNode;
};

const SiteDebugTools: React.FC<SiteDebugToolsProps> = ({ navWrapperRef }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    online: navigator.onLine,
  });
  const debugTabsRef = useRef<HTMLUListElement>(null);

  const setTabsOffset = useCallback(() => {
    if (navWrapperRef.current && debugTabsRef.current) {
      const navHeight = navWrapperRef.current.offsetHeight;
      debugTabsRef.current.style.top = `${navHeight}px`;
    }
  }, [navWrapperRef]);

  useLayoutEffect(() => {
    setTabsOffset();
  }, [setTabsOffset]);

  useEffect(() => {
    const elems = document.querySelectorAll(".tabs");
    M.Tabs.init(elems, {});
    setTabsOffset();
  }, [setTabsOffset]);

  useEffect(() => {
    const nav = window.navigator as Navigator & {
      connection?: BrowserNetworkConnection;
      mozConnection?: BrowserNetworkConnection;
      webkitConnection?: BrowserNetworkConnection;
    };
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

  const tabs: DebugTab[] = [
    {
      name: "Local Storage",
      content: <LocalStorageInspector />,
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
            Online Status: <b>{networkInfo.online ? "Online" : "Offline"}</b>
          </p>
          {networkInfo.effectiveType ? (
            <>
              <p>Connection Type: {networkInfo.effectiveType}</p>
              <p>Estimated Downlink: {networkInfo.downlink} Mbps</p>
              <p>Estimated RTT: {networkInfo.rtt} ms</p>
              <p>Data Saver Enabled: {networkInfo.saveData ? "Yes" : "No"}</p>
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
    <div
      className={`container flow-text ${styles.debugToolsRoot} ${
        isDarkMode ? styles.darkMode : styles.lightMode
      }`}
    >
      <p>
        This section showcases client-side diagnostics I use to understand how
        the site behaves in a real browser. It highlights the kinds of data
        available directly from the device and network without any backend
        integration, covering local storage, device capabilities, and
        connectivity characteristics.
      </p>
      <ul
        id="debugToolsTabs"
        className={`tabs ${styles.debugTabs}`}
        ref={debugTabsRef}
      >
        {tabs.map((tab, index) => (
          <li className="tab col s3" key={tab.name}>
            <a href={`#tab-${index}`}>{tab.name}</a>
          </li>
        ))}
      </ul>
      <div className={styles.tabContent}>
        {tabs.map((tab, index) => (
          <div id={`tab-${index}`} key={tab.name} className={styles.debugTabPane}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteDebugTools;
