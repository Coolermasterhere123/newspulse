// Approximate region classification for DriveBC cameras, based on straight-line
// proximity to major BC population centers. This mirrors the same region
// taxonomy used for the weather dropdown (lib/bc-cities.js) so groupings feel
// consistent across the app. It is a practical approximation, not an exact
// administrative boundary lookup.

const ANCHORS = [
  { name: "Vancouver", lat: 49.2827, lon: -123.1207, region: "Metro Vancouver" },
  { name: "Abbotsford", lat: 49.0504, lon: -122.3045, region: "Fraser Valley" },
  { name: "Chilliwack", lat: 49.1579, lon: -121.9514, region: "Fraser Valley" },
  { name: "Hope", lat: 49.383, lon: -121.4419, region: "Fraser Valley" },
  {
    name: "Victoria",
    lat: 48.4284,
    lon: -123.3656,
    region: "Capital Region (Greater Victoria & Gulf Islands)",
  },
  { name: "Duncan", lat: 48.7787, lon: -123.7079, region: "Cowichan Valley" },
  { name: "Nanaimo", lat: 49.1659, lon: -123.9401, region: "Nanaimo Region" },
  { name: "Port Alberni", lat: 49.2339, lon: -124.8055, region: "Alberni-Clayoquot" },
  { name: "Courtenay", lat: 49.6841, lon: -124.9905, region: "Comox Valley" },
  { name: "Campbell River", lat: 50.0244, lon: -125.2475, region: "Strathcona" },
  { name: "Port Hardy", lat: 50.7166, lon: -127.4956, region: "North Vancouver Island" },
  { name: "Powell River", lat: 49.8351, lon: -124.5247, region: "Sunshine Coast" },
  { name: "Sechelt", lat: 49.4742, lon: -123.7553, region: "Sunshine Coast" },
  { name: "Squamish", lat: 49.7016, lon: -123.1558, region: "Squamish-Lillooet" },
  { name: "Whistler", lat: 50.1163, lon: -122.9574, region: "Squamish-Lillooet" },
  { name: "Lillooet", lat: 50.6858, lon: -121.9364, region: "Squamish-Lillooet" },
  { name: "Kamloops", lat: 50.6745, lon: -120.3273, region: "Thompson-Nicola" },
  { name: "Merritt", lat: 50.1104, lon: -120.7862, region: "Thompson-Nicola" },
  { name: "Quesnel", lat: 52.9784, lon: -122.4928, region: "Cariboo" },
  { name: "Williams Lake", lat: 52.1417, lon: -122.1417, region: "Cariboo" },
  { name: "100 Mile House", lat: 51.6421, lon: -121.2967, region: "Cariboo" },
  { name: "Bella Coola", lat: 52.3735, lon: -126.7558, region: "Central Coast" },
  { name: "Vernon", lat: 50.267, lon: -119.272, region: "North Okanagan" },
  { name: "Kelowna", lat: 49.888, lon: -119.496, region: "Central Okanagan" },
  { name: "Penticton", lat: 49.4991, lon: -119.5937, region: "Okanagan-Similkameen" },
  { name: "Princeton", lat: 49.4586, lon: -120.5111, region: "Okanagan-Similkameen" },
  { name: "Cranbrook", lat: 49.5097, lon: -115.769, region: "East Kootenay" },
  { name: "Golden", lat: 51.2963, lon: -116.9631, region: "East Kootenay" },
  { name: "Invermere", lat: 50.5064, lon: -116.0281, region: "East Kootenay" },
  { name: "Nelson", lat: 49.4928, lon: -117.2948, region: "Central Kootenay" },
  { name: "Creston", lat: 49.0955, lon: -116.5135, region: "Central Kootenay" },
  { name: "Trail", lat: 49.0966, lon: -117.7093, region: "Kootenay Boundary" },
  { name: "Grand Forks", lat: 49.0327, lon: -118.4405, region: "Kootenay Boundary" },
  { name: "Revelstoke", lat: 50.9981, lon: -118.1957, region: "Columbia Shuswap" },
  { name: "Salmon Arm", lat: 50.6989, lon: -119.282, region: "Columbia Shuswap" },
  { name: "Smithers", lat: 54.7803, lon: -127.1743, region: "Bulkley-Nechako" },
  { name: "Burns Lake", lat: 54.2317, lon: -125.7583, region: "Bulkley-Nechako" },
  { name: "Vanderhoof", lat: 54.0159, lon: -124.0111, region: "Bulkley-Nechako" },
  { name: "Prince George", lat: 53.9171, lon: -122.7497, region: "Fraser-Fort George" },
  { name: "Mackenzie", lat: 55.3389, lon: -123.0928, region: "Fraser-Fort George" },
  { name: "Valemount", lat: 52.8267, lon: -119.2653, region: "Fraser-Fort George" },
  { name: "Fort St. John", lat: 56.2499, lon: -120.8529, region: "Peace River" },
  { name: "Dawson Creek", lat: 55.7596, lon: -120.2377, region: "Peace River" },
  { name: "Chetwynd", lat: 55.6975, lon: -121.6362, region: "Peace River" },
  { name: "Fort Nelson", lat: 58.805, lon: -122.6972, region: "Northern Rockies" },
  {
    name: "Terrace",
    lat: 54.5182,
    lon: -128.6032,
    region: "Skeena-Queen Charlotte / Haida Gwaii",
  },
  {
    name: "Kitimat",
    lat: 54.0524,
    lon: -128.6534,
    region: "Skeena-Queen Charlotte / Haida Gwaii",
  },
  {
    name: "Masset",
    lat: 54.0158,
    lon: -132.1444,
    region: "Skeena-Queen Charlotte / Haida Gwaii",
  },
  { name: "Prince Rupert", lat: 54.315, lon: -130.3208, region: "North Coast" },
];

function distSq(lat1, lon1, lat2, lon2) {
  // Equirectangular approximation with a latitude-scaled longitude term —
  // fine for nearest-neighbour comparisons over BC's latitude range.
  const scale = Math.cos((lat1 * Math.PI) / 180);
  const dx = (lon1 - lon2) * scale;
  const dy = lat1 - lat2;
  return dx * dx + dy * dy;
}

export function nearestRegion(lat, lon) {
  if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
    return "Unclassified";
  }
  let best = null;
  let bestDist = Infinity;
  for (const anchor of ANCHORS) {
    const d = distSq(lat, lon, anchor.lat, anchor.lon);
    if (d < bestDist) {
      bestDist = d;
      best = anchor;
    }
  }
  return best ? best.region : "Unclassified";
}
