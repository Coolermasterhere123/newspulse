// Live BC Wildfire Service data — the same public ArcGIS Feature Service that
// powers the official BC Wildfire Dashboard (wildfiresituation.nrs.gov.bc.ca).
// No API key required.

const SERVICE_URL =
  "https://services6.arcgis.com/ubm4tcTYICKBpist/arcgis/rest/services/BCWS_ActiveFires_PublicView/FeatureServer/0/query";

const FIRE_CENTRES = {
  2: "Coastal Fire Centre",
  3: "Northwest Fire Centre",
  4: "Prince George Fire Centre",
  5: "Kamloops Fire Centre",
  6: "Southeast Fire Centre",
  7: "Cariboo Fire Centre",
};

function centreName(code) {
  return FIRE_CENTRES[code] || `Fire Centre ${code ?? "?"}`;
}

function toIso(epochMs) {
  if (!epochMs && epochMs !== 0) return null;
  return new Date(epochMs).toISOString();
}

function mapFeature(f) {
  const a = f.attributes;
  return {
    name: a.INCIDENT_NAME || a.FIRE_NUMBER,
    fireNumber: a.FIRE_NUMBER,
    status: a.FIRE_STATUS,
    sizeHectares: a.CURRENT_SIZE,
    location: a.GEOGRAPHIC_DESCRIPTION,
    fireCentre: centreName(a.FIRE_CENTRE),
    cause: a.FIRE_CAUSE,
    startDate: toIso(a.IGNITION_DATE),
    outDate: toIso(a.FIRE_OUT_DATE),
    detailUrl: a.FIRE_URL,
    isFireOfNote: a.FIRE_OF_NOTE_IND === "Y",
    wasFireOfNote: a.WAS_FIRE_OF_NOTE_IND === "Y",
    lat: a.LATITUDE,
    lon: a.LONGITUDE,
  };
}

export async function fetchBCFires() {
  const params = new URLSearchParams({
    f: "json",
    where: "1=1",
    outFields: "*",
    returnGeometry: "false",
  });

  const res = await fetch(`${SERVICE_URL}?${params}`, {
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`BCWS fetch failed: ${res.status}`);

  const data = await res.json();
  const features = (data.features || []).map(mapFeature);

  const firesOfNote = features.filter((f) => f.isFireOfNote);
  const outOfControl = features.filter((f) => f.status === "Out of Control");

  // Always show every Out of Control fire, plus any fire of note, deduped.
  const byNumber = new Map();
  [...outOfControl, ...firesOfNote].forEach((f) => {
    byNumber.set(f.fireNumber, f);
  });

  let list = Array.from(byNumber.values()).sort((a, b) => {
    const rank = (f) => (f.status === "Out of Control" ? 0 : 1);
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return (b.sizeHectares || 0) - (a.sizeHectares || 0);
  });

  let fallbackUsed = false;
  if (list.length === 0) {
    fallbackUsed = true;
    list = features
      .filter((f) => f.status && f.status !== "Out")
      .sort((a, b) => (b.sizeHectares || 0) - (a.sizeHectares || 0))
      .slice(0, 15);
  }

  return {
    fires: list,
    outOfControlCount: outOfControl.length,
    fireOfNoteCount: firesOfNote.length,
    fallbackUsed,
    totalActive: features.filter((f) => f.status && f.status !== "Out").length,
    updatedAt: new Date().toISOString(),
  };
}
