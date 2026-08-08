// Environment Canada's official Air Quality Health Index (AQHI) feed — the
// same data source behind Canada's WeatherCAN app and BC's own AQHI table.
// No API key required.

const BASE = "https://api.weather.gc.ca/collections";

// Roughly British Columbia's bounding box (minX, minY, maxX, maxY / EPSG:4326).
const BC_BBOX = "-139.3,48.2,-114.0,60.1";

export function categorize(aqhi) {
  if (aqhi == null) return { label: "Unknown", color: "var(--text-dim)" };
  if (aqhi <= 3) return { label: "Low Risk", color: "var(--green)" };
  if (aqhi <= 6) return { label: "Moderate Risk", color: "var(--amber)" };
  if (aqhi <= 10) return { label: "High Risk", color: "var(--orange)" };
  return { label: "Very High Risk", color: "var(--red)" };
}

export async function fetchBCAirQuality() {
  const obsUrl =
    `${BASE}/aqhi-observations-realtime/items` +
    `?bbox=${BC_BBOX}&f=json&filter=properties.latest=true&limit=200`;

  const fcUrl =
    `${BASE}/aqhi-forecasts-realtime/items` +
    `?bbox=${BC_BBOX}&f=json&limit=500`;

  const [obsRes, fcRes] = await Promise.all([
    fetch(obsUrl, { next: { revalidate: 900 } }),
    fetch(fcUrl, { next: { revalidate: 900 } }).catch(() => null),
  ]);

  if (!obsRes.ok) throw new Error(`AQHI observations fetch failed: ${obsRes.status}`);
  const obsData = await obsRes.json();

  let forecastsByLocation = {};
  if (fcRes && fcRes.ok) {
    const fcData = await fcRes.json();
    for (const f of fcData.features || []) {
      const p = f.properties;
      if (!forecastsByLocation[p.location_id]) forecastsByLocation[p.location_id] = [];
      forecastsByLocation[p.location_id].push({
        aqhi: p.aqhi,
        datetime: p.forecast_datetime,
        text: p.forecast_datetime_text_en,
      });
    }
  }

  const stations = (obsData.features || []).map((f) => {
    const p = f.properties;
    const forecasts = (forecastsByLocation[p.location_id] || [])
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .slice(0, 2);

    return {
      locationId: p.location_id,
      name: p.location_name_en,
      aqhi: p.aqhi,
      observedAt: p.observation_datetime,
      lat: f.geometry?.coordinates?.[1],
      lon: f.geometry?.coordinates?.[0],
      forecasts,
      ...categorize(p.aqhi),
    };
  });

  stations.sort((a, b) => (b.aqhi || 0) - (a.aqhi || 0));

  return {
    stations,
    updatedAt: new Date().toISOString(),
  };
}
