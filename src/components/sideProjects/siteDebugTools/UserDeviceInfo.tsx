import React, { useEffect, useState } from "react";

// Extend Navigator interface to include deviceMemory
interface NavigatorExtended extends Navigator {
  deviceMemory?: number;
}

interface Location {
  latitude: number;
  longitude: number;
}

interface BatteryInfo {
  level: string;
  charging: string;
}

const DeviceInfo: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [deviceType, setDeviceType] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [screen, setScreen] = useState<Screen | null>(window.screen);
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const [navigator, setNavigator] = useState<NavigatorExtended>(
    window.navigator
  );

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    }
  }, [navigator]);

  // Device Type
  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (/mobile/i.test(userAgent)) {
      setDeviceType("Mobile");
    } else if (/tablet/i.test(userAgent)) {
      setDeviceType("Tablet");
    } else {
      setDeviceType("Desktop");
    }
  }, [navigator]);

  // Screen Info
  useEffect(() => {
    setScreen(window.screen);
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    setDarkMode(darkModeMediaQuery.matches);

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };
    darkModeMediaQuery.addEventListener("change", handleDarkModeChange);
    return () =>
      darkModeMediaQuery.removeEventListener("change", handleDarkModeChange);
  }, [window]);

  // Battery Information
  useEffect(() => {
    const navigator = window.navigator;
    const getBatteryInfo = async () => {
      if (
        (navigator as Navigator & { getBattery: () => Promise<any> }).getBattery
      ) {
        const battery = await (
          navigator as Navigator & { getBattery: () => Promise<any> }
        ).getBattery();
        setBatteryInfo({
          level: (battery.level * 100).toFixed(0) + "%",
          charging: battery.charging ? "Charging" : "Not charging",
        });
      }
    };
    getBatteryInfo();
  }, []);

  return (
    <div>
      <h1>Device Information</h1>

      {/* Location */}
      {location ? (
        <p>
          Location: Latitude {location.latitude}, Longitude {location.longitude}
        </p>
      ) : (
        <p>Location: Permission Denied or Not Available</p>
      )}
      <p>Device Type: {deviceType}</p>
      <p>User Agent: {navigator.userAgent}</p>
      <p>Dark Mode Preference: {darkMode ? "Dark Mode" : "Light Mode"}</p>
      <p>Language: {navigator.language}</p>
      <p>Languages: {navigator.languages.join(", ")}</p>
      {screen && (
        <p>
          Screen: {screen.width}x{screen.height}, Color Depth:{" "}
          {screen.colorDepth} bits, Orientation:{" "}
          {JSON.stringify(screen.orientation)}
        </p>
      )}
      <p>Platform: {navigator.platform}</p>
      <p>Time Zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
      <p>Cookie Enabled: {navigator.cookieEnabled ? "Yes" : "No"}</p>
      <p>Do Not Track: {navigator.doNotTrack}</p>
      <p>Max Touch Points: {navigator.maxTouchPoints}</p>
      <p>Hardware Concurrency: {navigator.hardwareConcurrency}</p>
      <p>Device Memory: {navigator.deviceMemory}GB</p>
      <p>Game Pad: {JSON.stringify(navigator.getGamepads())}</p>
      <p>Web Driver: {navigator.webdriver}</p>
      {batteryInfo ? (
        <p>
          Battery: {batteryInfo.level}, {batteryInfo.charging}
        </p>
      ) : (
        <p>Battery Information: Not Available</p>
      )}
      {/* Cores and Memory Info */}
      <p>Device Memory: {navigator.deviceMemory}GB</p>
      <p>Device Cores: {navigator.hardwareConcurrency}</p>
    </div>
  );
};

export default DeviceInfo;
