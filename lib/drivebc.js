import { nearestRegion } from "./bc-regions";

// DriveBC Open511 API — official BC government road event feed (closures,
// incidents, construction). No API key required.
const EVENTS_URL = "https://api.open511.gov.bc.ca/events";

// BC Data Catalogue — official highway webcam list, updated periodically.
// No API key required.
const WEBCAMS_CSV_URL =
  "https://catalogue.data.gov.bc.ca/dataset/6b39a910-6c77-476f-ac96-7b4f18849b1c/resource/a9d52d85-8402-4ce7-b2ac-a2779837c48a/download/webcams.csv";

export async function fetchRoadEvents({ severity = "MAJOR,MODERATE", limit = 300 } = {}) {
  const params = new URLSearchParams({
    format: "json",
    status: "ACTIVE",
    severity,
    limit: String(limit),
  });

  const res = await fetch(`${EVENTS_URL}?${params}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsPulse/1.0)" },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`DriveBC events fetch failed: ${res.status}`);

  const data = await res.json();
  const events = (data.events || []).map((ev) => {
    const roads = ev.roads || [];
    const isClosure = roads.some((r) => (r.state || "").toUpperCase() === "CLOSED");
    const area = ev.areas?.[0];
    return {
      id: ev.id,
      headline: ev.headline,
      description: ev.description,
      eventType: ev.event_type,
      subtypes: ev.event_subtypes || [],
      severity: ev.severity,
      isClosure,
      roads: roads.map((r) => ({
        name: r.name,
        from: r.from,
        to: r.to,
        direction: r.direction,
        state: r.state,
      })),
      area: area?.name || "Unknown area",
      updated: ev.updated,
      created: ev.created,
      lat: ev.geography?.coordinates
        ? Array.isArray(ev.geography.coordinates[0])
          ? ev.geography.coordinates[0][1]
          : ev.geography.coordinates[1]
        : null,
      lon: ev.geography?.coordinates
        ? Array.isArray(ev.geography.coordinates[0])
          ? ev.geography.coordinates[0][0]
          : ev.geography.coordinates[0]
        : null,
    };
  });

  return {
    events,
    updatedAt: new Date().toISOString(),
  };
}

// Minimal CSV parser handling quoted fields with embedded commas.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

export async function fetchWebcams() {
  const res = await fetch(WEBCAMS_CSV_URL, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`DriveBC webcams fetch failed: ${res.status}`);

  const text = await res.text();
  const rows = parseCSV(text);
  const header = rows[0].map((h) => h.trim());
  const idx = (name) => header.indexOf(name);

  const iId = idx("id");
  const iHwy = idx("highway_number");
  const iLoc = idx("highway_locationDescription");
  const iName = idx("camName");
  const iCaption = idx("caption");
  const iOrientation = idx("orientation");
  const iLat = idx("latitude");
  const iLon = idx("longitude");

  const cams = rows.slice(1).map((r) => {
    const id = r[iId];
    const lat = parseFloat(r[iLat]);
    const lon = parseFloat(r[iLon]);
    return {
      id,
      highway: r[iHwy],
      location: r[iLoc],
      name: r[iName],
      caption: r[iCaption],
      orientation: r[iOrientation],
      lat,
      lon,
      region: nearestRegion(lat, lon),
      // DriveBC migrated off the old images.drivebc.ca/bchighwaycam paths
      // (those now serve a "no longer available" placeholder). The new
      // pattern is https://www.drivebc.ca/images/{id}.jpg per their own
      // migration notice on the BC Data Catalogue.
      imageUrl: `https://www.drivebc.ca/images/${id}.jpg`,
      thumbUrl: `https://www.drivebc.ca/images/${id}.jpg`,
      pageUrl: `https://www.drivebc.ca/cameras/${id}`,
    };
  });

  return {
    cams: cams.filter((c) => c.id),
    updatedAt: new Date().toISOString(),
  };
}
