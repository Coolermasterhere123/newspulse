import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm w/ hail", icon: "⛈️" },
  99: { label: "Severe thunderstorm", icon: "⛈️" },
};

function describeCode(code) {
  return WEATHER_CODES[code] || { label: "Unknown", icon: "🌡️" };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let lat = searchParams.get("lat");
  let lon = searchParams.get("lon");
  const city = searchParams.get("city");
  let resolvedName = searchParams.get("name") || null;

  try {
    if ((!lat || !lon) && city) {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      const match = geoData?.results?.[0];
      if (!match) {
        return NextResponse.json({ error: "Location not found" }, { status: 404 });
      }
      lat = match.latitude;
      lon = match.longitude;
      resolvedName = [match.name, match.admin1, match.country].filter(Boolean).join(", ");
    }

    if (!lat || !lon) {
      return NextResponse.json({ error: "lat/lon or city required" }, { status: 400 });
    }

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&timezone=auto&forecast_days=6`;

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const data = await res.json();

    const now = new Date();
    const currentHourIso = now.toISOString().slice(0, 13);
    const hourlyTimes = data.hourly?.time || [];
    const startIdx = Math.max(
      0,
      hourlyTimes.findIndex((t) => t.startsWith(currentHourIso))
    );

    const hourly = hourlyTimes.slice(startIdx, startIdx + 12).map((t, i) => {
      const idx = startIdx + i;
      return {
        time: t,
        temp: Math.round(data.hourly.temperature_2m[idx]),
        precipChance: data.hourly.precipitation_probability[idx],
        ...describeCode(data.hourly.weather_code[idx]),
      };
    });

    const daily = (data.daily?.time || []).map((t, i) => ({
      date: t,
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      precipChance: data.daily.precipitation_probability_max[i],
      ...describeCode(data.daily.weather_code[i]),
    }));

    return NextResponse.json({
      location: { lat: Number(lat), lon: Number(lon), name: resolvedName },
      current: {
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        precipitation: data.current.precipitation,
        ...describeCode(data.current.weather_code),
      },
      hourly,
      daily,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
