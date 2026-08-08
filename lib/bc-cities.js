// A broad list of British Columbia communities — incorporated municipalities
// (cities, district municipalities, towns, villages) plus well-known
// unincorporated communities — grouped by region for a browsable dropdown.
// Names are resolved to coordinates at request time via Open-Meteo's free
// geocoding API, using ", British Columbia, Canada" appended for precision.

export const BC_CITIES = [
  {
    region: "Metro Vancouver",
    places: [
      "Vancouver", "Burnaby", "Surrey", "Richmond", "Coquitlam", "Port Coquitlam",
      "Port Moody", "New Westminster", "North Vancouver", "West Vancouver",
      "Delta", "Langley", "White Rock", "Maple Ridge", "Pitt Meadows",
      "Anmore", "Belcarra", "Lions Bay", "Bowen Island",
    ],
  },
  {
    region: "Fraser Valley",
    places: [
      "Abbotsford", "Chilliwack", "Mission", "Agassiz", "Harrison Hot Springs",
      "Hope", "Yale", "Boston Bar", "Kent",
    ],
  },
  {
    region: "Capital Region (Greater Victoria & Gulf Islands)",
    places: [
      "Victoria", "Saanich", "Oak Bay", "Esquimalt", "View Royal", "Colwood",
      "Langford", "Metchosin", "Highlands", "Central Saanich", "North Saanich",
      "Sidney", "Sooke", "Salt Spring Island", "Galiano Island", "Pender Island",
      "Mayne Island", "Saturna Island",
    ],
  },
  {
    region: "Cowichan Valley",
    places: [
      "Duncan", "North Cowichan", "Ladysmith", "Lake Cowichan", "Chemainus",
      "Cobble Hill", "Cowichan Bay", "Youbou", "Honeymoon Bay", "Mill Bay",
      "Crofton", "Shawnigan Lake",
    ],
  },
  {
    region: "Nanaimo Region",
    places: ["Nanaimo", "Parksville", "Qualicum Beach", "Lantzville", "Cedar"],
  },
  {
    region: "Alberni-Clayoquot",
    places: ["Port Alberni", "Tofino", "Ucluelet", "Bamfield"],
  },
  {
    region: "Comox Valley",
    places: ["Courtenay", "Comox", "Cumberland", "Fanny Bay", "Union Bay"],
  },
  {
    region: "Strathcona",
    places: [
      "Campbell River", "Gold River", "Sayward", "Tahsis", "Zeballos",
      "Cortes Island", "Quadra Island",
    ],
  },
  {
    region: "North Vancouver Island",
    places: [
      "Port Hardy", "Port Alice", "Port McNeill", "Alert Bay", "Coal Harbour",
      "Woss", "Sointula", "Winter Harbour",
    ],
  },
  {
    region: "Sunshine Coast",
    places: ["Sechelt", "Gibsons", "Powell River", "Lund", "Pender Harbour", "Roberts Creek", "Halfmoon Bay"],
  },
  {
    region: "Squamish-Lillooet",
    places: ["Squamish", "Whistler", "Pemberton", "Lillooet", "D'Arcy", "Devine", "Britannia Beach"],
  },
  {
    region: "Thompson-Nicola",
    places: [
      "Kamloops", "Merritt", "Logan Lake", "Ashcroft", "Cache Creek", "Clinton",
      "Lytton", "Barriere", "Chase", "Savona", "Clearwater", "Spences Bridge",
      "Blue River",
    ],
  },
  {
    region: "Cariboo",
    places: [
      "Quesnel", "Williams Lake", "Wells", "Barkerville", "100 Mile House",
      "108 Mile Ranch", "Horsefly", "Likely", "Alexis Creek", "Anahim Lake",
      "Bella Coola", "Nazko", "Wells Gray Park",
    ],
  },
  {
    region: "North Okanagan",
    places: ["Vernon", "Armstrong", "Enderby", "Coldstream", "Lumby", "Cherryville"],
  },
  {
    region: "Central Okanagan",
    places: ["Kelowna", "West Kelowna", "Peachland", "Lake Country", "Winfield", "Oyama"],
  },
  {
    region: "Okanagan-Similkameen",
    places: [
      "Penticton", "Summerland", "Keremeos", "Oliver", "Osoyoos", "Princeton",
      "Naramata", "Kaleden", "Hedley", "Tulameen",
    ],
  },
  {
    region: "East Kootenay",
    places: [
      "Cranbrook", "Kimberley", "Fernie", "Sparwood", "Elkford", "Invermere",
      "Radium Hot Springs", "Canal Flats", "Windermere", "Wasa", "Fairmont Hot Springs",
      "Golden",
    ],
  },
  {
    region: "Central Kootenay",
    places: [
      "Nelson", "Castlegar", "Kaslo", "Nakusp", "New Denver", "Silverton",
      "Slocan", "Salmo", "Creston", "Crawford Bay", "Balfour", "Ymir", "Riondel",
    ],
  },
  {
    region: "Kootenay Boundary",
    places: [
      "Trail", "Rossland", "Warfield", "Montrose", "Fruitvale", "Grand Forks",
      "Greenwood", "Midway", "Christina Lake", "Beaverdell", "Rock Creek",
    ],
  },
  {
    region: "Columbia Shuswap",
    places: [
      "Revelstoke", "Salmon Arm", "Sicamous", "Malakwa", "Sorrento",
      "Blind Bay", "Tappen", "Falkland",
    ],
  },
  {
    region: "Bulkley-Nechako",
    places: [
      "Smithers", "Houston", "Burns Lake", "Vanderhoof", "Fraser Lake",
      "Fort St. James", "Granisle", "Telkwa", "Topley",
    ],
  },
  {
    region: "Fraser-Fort George",
    places: ["Prince George", "Mackenzie", "McBride", "Valemount", "Dome Creek"],
  },
  {
    region: "Peace River",
    places: [
      "Fort St. John", "Dawson Creek", "Chetwynd", "Tumbler Ridge",
      "Hudson's Hope", "Taylor", "Pouce Coupe", "Wonowon",
    ],
  },
  {
    region: "Northern Rockies",
    places: ["Fort Nelson", "Toad River", "Muncho Lake"],
  },
  {
    region: "Skeena-Queen Charlotte / Haida Gwaii",
    places: [
      "Terrace", "Kitimat", "Stewart", "Daajing Giids", "Masset",
      "Port Clements", "Sandspit", "Tlell", "Skidegate", "Hazelton",
      "New Hazelton", "Kitwanga",
    ],
  },
  {
    region: "North Coast",
    places: ["Prince Rupert", "Port Edward", "Kitkatla"],
  },
  {
    region: "Central Coast",
    places: ["Bella Coola", "Bella Bella", "Ocean Falls", "Hagensborg", "Shearwater"],
  },
];

export const BC_CITY_NAMES = Array.from(
  new Set(BC_CITIES.flatMap((g) => g.places))
).sort((a, b) => a.localeCompare(b));

export function getNearbyTowns(city, limit = 4) {
  const group = BC_CITIES.find((g) => g.places.includes(city));
  if (!group) return [];
  return group.places.filter((p) => p !== city).slice(0, limit);
}
