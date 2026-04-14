import precomputedRoadTripRoutes from "./data/precomputed-road-trip-routes.json";
import { RoadTrip, RoadTripShowcaseConfig } from "./types";

interface PrecomputedRoadTripRoute {
  miles: number;
  pathCoordinates: [number, number][];
}

function attachPrecomputedRoutes(trips: RoadTrip[]): RoadTrip[] {
  return trips.map((trip) => {
    const precomputedRoute = (
      precomputedRoadTripRoutes as unknown as Record<
        string,
        PrecomputedRoadTripRoute
      >
    )[trip.id];

    if (!precomputedRoute || precomputedRoute.pathCoordinates.length < 2) {
      return trip;
    }

    return {
      ...trip,
      pathCoordinates: precomputedRoute.pathCoordinates,
      routeSource: "osrm",
    };
  });
}

export const roadTripShowcaseData: RoadTripShowcaseConfig = {
  title: "Road Trip Snapshot",
  intro:
    "A live snapshot from my own road-trip atlas, mixing completed drives with a few future routes I still want to make happen.",
  trips: attachPrecomputedRoutes([
    {
      id: "western-expedition-2018-1776124046493",
      name: "Western Expedition 2018",
      category: "taken",
      miles: 3905,
      lineColor: "#2f6fe4",
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Aledo, Parker County, Texas, 76008, United States",
          latitude: 32.69799,
          longitude: -97.60399,
          state: "Texas",
        },
        {
          name: "Lubbock, Lubbock County, Texas, United States",
          latitude: 33.58557,
          longitude: -101.84702,
          state: "Texas",
        },
        {
          name: "Albuquerque, Bernalillo County, New Mexico, 87102, United States",
          latitude: 35.0841,
          longitude: -106.65099,
          state: "New Mexico",
        },
        {
          name: "Second Mesa, Shipaulovi, Navajo County, Arizona, 86043, United States",
          latitude: 35.83424,
          longitude: -110.50143,
          state: "Arizona",
        },
        {
          name: "Flagstaff, Coconino County, Arizona, United States",
          latitude: 35.19875,
          longitude: -111.65182,
          state: "Arizona",
        },
        {
          name: "Grand Canyon, Coconino County, Arizona, United States",
          latitude: 36.09804,
          longitude: -112.09628,
          state: "Arizona",
        },
        {
          name: "Glen Canyon Dam, Coconino County, Arizona, United States",
          latitude: 36.93711,
          longitude: -111.48415,
          state: "Arizona",
        },
        {
          name: "Zion National Park, Washington County, Utah, United States",
          latitude: 37.32217,
          longitude: -113.00479,
          state: "Utah",
        },
        {
          name: "Moab, Grand County, Utah, 84532, United States",
          latitude: 38.57381,
          longitude: -109.54621,
          state: "Utah",
        },
        {
          name: "Salt Lake City, Salt Lake County, Utah, United States",
          latitude: 40.75962,
          longitude: -111.8868,
          state: "Utah",
        },
        {
          name: "Idaho Falls Idaho Temple, 1000, Memorial Drive, Downtown, Idaho Falls, Bonneville County, Idaho, 83402, United States",
          latitude: 43.4999,
          longitude: -112.04143,
          state: "Idaho",
        },
        {
          name: "Jackson, Teton County, Wyoming, United States",
          latitude: 43.47996,
          longitude: -110.76181,
          state: "Wyoming",
        },
        {
          name: "Old Faithful, Upper Geyser Basin Trail, Upper Geyser Basin, Teton County, Wyoming, 82180, United States",
          latitude: 44.46046,
          longitude: -110.82815,
          state: "Wyoming",
        },
        {
          name: "Gardiner, Park County, Montana, United States",
          latitude: 45.03509,
          longitude: -110.71265,
          state: "Montana",
        },
        {
          name: "Beartooth Pass, Park County, Wyoming, United States",
          latitude: 44.96904,
          longitude: -109.47131,
          state: "Wyoming",
        },
        {
          name: "Chief Joseph Highway, Park County, Wyoming, United States",
          latitude: 44.71798,
          longitude: -109.35354,
          state: "Wyoming",
        },
        {
          name: "Mount Rushmore National Memorial, Pennington County, South Dakota, United States",
          latitude: 43.88086,
          longitude: -103.45382,
          state: "South Dakota",
        },
        {
          name: "Greencastle, Putnam County, Indiana, 46135, United States",
          latitude: 39.64449,
          longitude: -86.86473,
          state: "Indiana",
        },
      ],
      statesCovered: [
        "Indiana",
        "Texas",
        "Texas",
        "New Mexico",
        "Arizona",
        "Arizona",
        "Arizona",
        "Arizona",
        "Utah",
        "Utah",
        "Utah",
        "Idaho",
        "Wyoming",
        "Wyoming",
        "Montana",
        "Wyoming",
        "Wyoming",
        "South Dakota",
        "Indiana",
      ],
      dateLabel: "2018",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "orange-beach-1776124248936",
      name: "Orange beach",
      category: "taken",
      miles: 1327,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Orange Beach, Baldwin County, Alabama, United States",
          latitude: 30.29437,
          longitude: -87.57359,
          state: "Alabama",
        },
        {
          name: "U.S. Space & Rocket Center, 1, Tranquility Base, Huntsville, Madison County, Alabama, 35805, United States",
          latitude: 34.71136,
          longitude: -86.65461,
          state: "Alabama",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Alabama", "Alabama", "Indiana"],
      dateLabel: "Spring break",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "nevraska-1776124320221",
      name: "Nevraska",
      category: "taken",
      miles: 1304,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Hebron, Thayer County, Nebraska, 68370, United States",
          latitude: 40.16648,
          longitude: -97.58609,
          state: "Nebraska",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Nebraska", "Indiana"],
      dateLabel: "",
      description: "",
    },
    {
      id: "tampa-1776124350760",
      name: "Tampa",
      category: "taken",
      miles: 1705,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Tampa, Hillsborough County, Florida, United States",
          latitude: 27.94499,
          longitude: -82.45831,
          state: "Florida",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Florida", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "iowa-1776124375079",
      name: "Iowa",
      category: "taken",
      miles: 590,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Iowa City, Johnson County, Iowa, United States",
          latitude: 41.66126,
          longitude: -91.52991,
          state: "Iowa",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Iowa", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "pictured-rocks-1-1776124463576",
      name: "Pictured rocks 1",
      category: "taken",
      miles: 1066,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Jelly Belly Factory, 10100, Green Bay Road, Pleasant Prairie, Kenosha County, Wisconsin, 53142, United States",
          latitude: 42.52642,
          longitude: -87.89584,
          state: "Wisconsin",
        },
        {
          name: "Grand Marais, Burt Township, Alger County, Michigan, 49839, United States",
          latitude: 46.67097,
          longitude: -85.984,
          state: "Michigan",
        },
        {
          name: "Munising, Alger County, Michigan, 49862, United States",
          latitude: 46.41,
          longitude: -86.64947,
          state: "Michigan",
        },
        {
          name: "St. Joseph, Champaign County, Illinois, United States",
          latitude: 40.1117,
          longitude: -88.0417,
          state: "Illinois",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: [
        "Indiana",
        "Wisconsin",
        "Michigan",
        "Michigan",
        "Illinois",
        "Indiana",
      ],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "roswell-1776132408847",
      name: "Roswell",
      category: "taken",
      miles: 3228,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Roswell, Chaves County, New Mexico, United States",
          latitude: 33.39433,
          longitude: -104.52295,
          state: "New Mexico",
        },
        {
          name: "San Antonio, Bexar County, Texas, United States",
          latitude: 29.4246,
          longitude: -98.49514,
          state: "Texas",
        },
        {
          name: "Corpus Christi, Nueces County, Texas, United States",
          latitude: 27.76353,
          longitude: -97.40332,
          state: "Texas",
        },
        {
          name: "Aledo, Parker County, Texas, 76008, United States",
          latitude: 32.69799,
          longitude: -97.60399,
          state: "Texas",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: [
        "Indiana",
        "New Mexico",
        "Texas",
        "Texas",
        "Texas",
        "Indiana",
      ],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "boston-1776132476448",
      name: "Boston",
      category: "wishlist",
      miles: 1688,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Waypoint 2",
          latitude: 42.3782,
          longitude: -71.0376,
          state: "",
        },
        {
          name: "Waypoint 3",
          latitude: 40.7258,
          longitude: -74.05884,
          state: "",
        },
        {
          name: "Waypoint 4",
          latitude: 39.95541,
          longitude: -75.20142,
          state: "",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "canada-1776132530115",
      name: "Canada",
      category: "taken",
      miles: 1418,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Waypoint 2",
          latitude: 42.88804,
          longitude: -78.8324,
          state: "",
        },
        {
          name: "Waypoint 3",
          latitude: 43.20055,
          longitude: -79.13452,
          state: "",
        },
        {
          name: "Waypoint 4",
          latitude: 44.75332,
          longitude: -85.75928,
          state: "",
        },
        {
          name: "Waypoint 5",
          latitude: 44.11002,
          longitude: -86.30859,
          state: "",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "sc-wedding-1776132600691",
      name: "SC Wedding",
      category: "taken",
      miles: 1564,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Biltmore, Asheville, Buncombe County, North Carolina, 28803, United States",
          latitude: 35.55817,
          longitude: -82.53346,
          state: "North Carolina",
        },
        {
          name: "Folly Beach, Charleston County, South Carolina, 29439, United States",
          latitude: 32.65548,
          longitude: -79.94078,
          state: "South Carolina",
        },
        {
          name: "New River Gorge Bridge, Fayetteville, Fayette County, West Virginia, 25840, United States",
          latitude: 38.06874,
          longitude: -81.08294,
          state: "West Virginia",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: [
        "Indiana",
        "North Carolina",
        "South Carolina",
        "West Virginia",
        "Indiana",
      ],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "ca-hwy1-1776132896207",
      name: "CA hwy1",
      category: "taken",
      miles: 293,
      waypoints: [
        {
          name: "San Francisco International Airport, 780, South Airport Boulevard, San Francisco, San Mateo County, California, 94128, United States",
          latitude: 37.62245,
          longitude: -122.38399,
          state: "California",
        },
        {
          name: "Half Moon Bay, San Mateo County, California, 94019, United States",
          latitude: 37.46355,
          longitude: -122.42859,
          state: "California",
        },
        {
          name: "Ice Cream Grade, Westdale, Santa Cruz County, California, 94050, United States",
          latitude: 37.06238,
          longitude: -122.13354,
          state: "California",
        },
        {
          name: "Waypoint 8",
          latitude: 36.61972,
          longitude: -121.90533,
          state: "",
        },
        {
          name: "17 Mile Drive, Pacific Grove Acres, Pacific Grove, Monterey County, California, 93950, United States",
          latitude: 36.60919,
          longitude: -121.95683,
          state: "California",
        },
        {
          name: "Pfeiffer Big Sur State Park Day Use Area, Monterey County, California, United States",
          latitude: 36.25075,
          longitude: -121.78197,
          state: "California",
        },
        {
          name: "Google, 2460, North 1st Street, North San Jose, San Jose, Santa Clara County, California, 95131, United States",
          latitude: 37.38261,
          longitude: -121.92406,
          state: "California",
        },
        {
          name: "San Francisco International Airport, 780, South Airport Boulevard, San Francisco, San Mateo County, California, 94128, United States",
          latitude: 37.62245,
          longitude: -122.38399,
          state: "California",
        },
      ],
      statesCovered: [
        "California",
        "California",
        "California",
        "California",
        "California",
        "California",
        "California",
      ],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "aledo-1776133070256",
      name: "Aledo",
      category: "taken",
      miles: 1907,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Aledo, Parker County, Texas, 76008, United States",
          latitude: 32.69799,
          longitude: -97.60399,
          state: "Texas",
        },
        {
          name: "Oklahoma City, Oklahoma County, Oklahoma, United States",
          latitude: 35.47299,
          longitude: -97.51705,
          state: "Oklahoma",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Texas", "Oklahoma", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "hebron-1776133096517",
      name: "Hebron",
      category: "taken",
      miles: 1181,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Hebron, Thayer County, Nebraska, 68370, United States",
          latitude: 40.16648,
          longitude: -97.58609,
          state: "Nebraska",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Nebraska", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "iowa-1776133128122",
      name: "iowa",
      category: "taken",
      miles: 590,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Iowa City, Johnson County, Iowa, United States",
          latitude: 41.66126,
          longitude: -91.52991,
          state: "Iowa",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Iowa", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "ohio-1776133187775",
      name: "ohio",
      category: "taken",
      miles: 655,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Sandusky County, Ohio, United States",
          latitude: 41.29516,
          longitude: -83.15554,
          state: "Ohio",
        },
        {
          name: "Castalia, Margaretta Township, Erie County, Ohio, United States",
          latitude: 41.40005,
          longitude: -82.80852,
          state: "Ohio",
        },
        {
          name: "Cleveland, Cuyahoga County, Ohio, United States",
          latitude: 41.49966,
          longitude: -81.69368,
          state: "Ohio",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Ohio", "Ohio", "Ohio", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "usaf-1776133216463",
      name: "USAF",
      category: "taken",
      miles: 238,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Dayton, Montgomery County, Ohio, United States",
          latitude: 39.75895,
          longitude: -84.19161,
          state: "Ohio",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Ohio", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "denver-1776133352552",
      name: "Denver",
      category: "wishlist",
      miles: 2331,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Denver, Colorado, United States",
          latitude: 39.73924,
          longitude: -104.98486,
          state: "Colorado",
        },
        {
          name: "Rocky Mountain National Park, Larimer County, Colorado, United States",
          latitude: 40.35539,
          longitude: -105.7177,
          state: "Colorado",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Colorado", "Colorado", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "highway-1-north-1776133522340",
      name: "Highway 1 north",
      category: "wishlist",
      miles: 1181,
      waypoints: [
        {
          name: "San Francisco International Airport, 780, South Airport Boulevard, San Francisco, San Mateo County, California, 94128, United States",
          latitude: 37.62245,
          longitude: -122.38399,
          state: "California",
        },
        {
          name: "Waypoint 5",
          latitude: 38.93173,
          longitude: -123.70897,
          state: "",
        },
        {
          name: "Waypoint 4",
          latitude: 40.69073,
          longitude: -124.21143,
          state: "",
        },
        {
          name: "Waypoint 6",
          latitude: 44.29752,
          longitude: -124.10912,
          state: "",
        },
        {
          name: "Waypoint 7",
          latitude: 47.96943,
          longitude: -124.403,
          state: "",
        },
        {
          name: "Waypoint 8",
          latitude: 47.04659,
          longitude: -123.14575,
          state: "",
        },
        {
          name: "Seattle-Tacoma International Airport, South 170th Street, SeaTac, King County, Washington, 98158, United States",
          latitude: 47.44757,
          longitude: -122.30802,
          state: "Washington",
        },
      ],
      statesCovered: ["California", "Washington"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
    {
      id: "alaska-1776133863535",
      name: "Alaska",
      category: "wishlist",
      miles: 8802,
      waypoints: [
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
        {
          name: "Waypoint 5",
          latitude: 61.20774,
          longitude: -149.8645,
          state: "",
        },
        {
          name: "Denali National Park, United States",
          latitude: 63.23166,
          longitude: -151.04056,
          state: "",
        },
        {
          name: "Prudhoe Bay, Alaska, 99734, United States",
          latitude: 70.32668,
          longitude: -148.94325,
          state: "Alaska",
        },
        {
          name: "Waypoint 4",
          latitude: 64.88044,
          longitude: -148.18359,
          state: "",
        },
        {
          name: "Home",
          latitude: 39.84005,
          longitude: -86.43149,
          state: "Indiana",
          notes:
            "1716, Hawk Lane, Summer Ridge, Brownsburg, Hendricks County, Indiana, 46112, United States",
        },
      ],
      statesCovered: ["Indiana", "Alaska", "Indiana"],
      dateLabel: "",
      description: "",
      routeSource: "straight-line",
    },
  ]),
};
