import React, { useEffect, useState } from "react";

interface Location {
  latitude: number;
  longitude: number;
}

interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
}

interface BatteryInfo {
  level: string;
  charging: string;
}

const DeviceInfo: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [deviceType, setDeviceType] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("");
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);
  const [platform, setPlatform] = useState<string>("");
  const [browser, setBrowser] = useState<string>("");
  const [timeZone, setTimeZone] = useState<string>("");
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);

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
  }, []);

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
  }, []);

  // Dark Mode Preference
  useEffect(() => {
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
  }, []);

  // Language
  useEffect(() => {
    setLanguage(navigator.language || navigator.languages[0]);
  }, []);

  // Screen Information
  useEffect(() => {
    setScreenInfo({
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
    });
  }, []);

  // Platform and Browser
  useEffect(() => {
    setPlatform(navigator.platform);
    setBrowser(navigator.userAgent);
  }, []);

  // Time Zone
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Battery Information
  useEffect(() => {
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

      {/* Device Type */}
      <p>Device Type: {deviceType}</p>

      {/* Dark Mode */}
      <p>Dark Mode Preference: {darkMode ? "Dark Mode" : "Light Mode"}</p>

      {/* Language */}
      <p>Language: {language}</p>

      {/* Screen Info */}
      {screenInfo && (
        <p>
          Screen: {screenInfo.width}x{screenInfo.height}, Color Depth:{" "}
          {screenInfo.colorDepth} bits
        </p>
      )}

      {/* Platform */}
      <p>Platform: {platform}</p>

      {/* Browser */}
      <p>Browser: {browser}</p>

      {/* Time Zone */}
      <p>Time Zone: {timeZone}</p>

      {/* Battery Info */}
      {batteryInfo ? (
        <p>
          Battery: {batteryInfo.level}, {batteryInfo.charging}
        </p>
      ) : (
        <p>Battery Information: Not Available</p>
      )}
    </div>
  );
};

export default DeviceInfo;
