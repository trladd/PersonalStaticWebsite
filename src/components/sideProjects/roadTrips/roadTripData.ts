import { RoadTripShowcaseConfig } from "./types";

export const roadTripShowcaseData: RoadTripShowcaseConfig = {
  title: "Road Trip Snapshot",
  intro:
    "A few of the drives that best capture why I love road trips: one unforgettable western loop and a couple of future routes I still want to make happen.",
  trips: [
    {
      id: "western-expedition-2018",
      name: "Western Expedition 2018",
      category: "taken",
      miles: 0,
      dateLabel: "Summer 2018",
      description:
        "The family road trip of a lifetime: a wedding in Texas, then a hard turn into the desert, canyon country, Yellowstone, and the long ride home through the plains.",
      lineColor: "#29524a",
      routeSource: "osrm",
      statesCovered: ["IN", "IL", "MO", "OK", "TX", "NM", "AZ", "UT", "WY", "MT", "SD", "MN", "WI"],
      waypoints: [
        { name: "Brownsburg, IN", latitude: 39.8434, longitude: -86.3978, state: "IN" },
        { name: "Fort Worth, TX", latitude: 32.7555, longitude: -97.3308, state: "TX" },
        { name: "Flagstaff, AZ", latitude: 35.1983, longitude: -111.6513, state: "AZ" },
        { name: "Grand Canyon, AZ", latitude: 36.0544, longitude: -112.1401, state: "AZ" },
        { name: "Page, AZ", latitude: 36.9147, longitude: -111.4558, state: "AZ" },
        { name: "Springdale, UT", latitude: 37.1889, longitude: -112.9986, state: "UT" },
        { name: "Moab, UT", latitude: 38.5733, longitude: -109.5498, state: "UT" },
        { name: "Salt Lake City, UT", latitude: 40.7608, longitude: -111.891, state: "UT" },
        { name: "Jackson, WY", latitude: 43.4799, longitude: -110.7624, state: "WY" },
        { name: "Yellowstone", latitude: 44.428, longitude: -110.5885, state: "WY" },
        { name: "Red Lodge, MT", latitude: 45.1858, longitude: -109.2468, state: "MT" },
        { name: "Rapid City, SD", latitude: 44.0805, longitude: -103.231, state: "SD" },
        { name: "Brownsburg, IN", latitude: 39.8434, longitude: -86.3978, state: "IN" },
      ],
    },
    {
      id: "northeast-wishlist",
      name: "Northeast Explorer",
      category: "wishlist",
      miles: 0,
      dateLabel: "Wishlist",
      description:
        "The east-coast and New England trip my wife and I keep talking about, with a mix of major cities, coastline, and mountain detours.",
      lineColor: "#c97a45",
      routeSource: "osrm",
      statesCovered: ["IN", "OH", "PA", "NY", "CT", "RI", "MA", "NH", "ME", "VT"],
      waypoints: [
        { name: "Brownsburg, IN", latitude: 39.8434, longitude: -86.3978, state: "IN" },
        { name: "Pittsburgh, PA", latitude: 40.4406, longitude: -79.9959, state: "PA" },
        { name: "New York City, NY", latitude: 40.7128, longitude: -74.006, state: "NY" },
        { name: "Mystic, CT", latitude: 41.3543, longitude: -71.9665, state: "CT" },
        { name: "Boston, MA", latitude: 42.3601, longitude: -71.0589, state: "MA" },
        { name: "Portland, ME", latitude: 43.6591, longitude: -70.2568, state: "ME" },
        { name: "Stowe, VT", latitude: 44.4654, longitude: -72.6874, state: "VT" },
      ],
    },
    {
      id: "pacific-wishlist",
      name: "Pacific Coast Dream",
      category: "wishlist",
      miles: 0,
      dateLabel: "Wishlist",
      description:
        "A longer west-coast route built around ocean views, mountain passes, and the kind of drives where the road itself is the destination.",
      lineColor: "#d08c60",
      routeSource: "osrm",
      statesCovered: ["CA", "OR", "WA"],
      waypoints: [
        { name: "San Diego, CA", latitude: 32.7157, longitude: -117.1611, state: "CA" },
        { name: "Los Angeles, CA", latitude: 34.0522, longitude: -118.2437, state: "CA" },
        { name: "Big Sur, CA", latitude: 36.2704, longitude: -121.8081, state: "CA" },
        { name: "San Francisco, CA", latitude: 37.7749, longitude: -122.4194, state: "CA" },
        { name: "Portland, OR", latitude: 45.5152, longitude: -122.6784, state: "OR" },
        { name: "Olympic National Park, WA", latitude: 47.8021, longitude: -123.6044, state: "WA" },
        { name: "Seattle, WA", latitude: 47.6062, longitude: -122.3321, state: "WA" },
      ],
    },
  ],
};
