"use client";

import { useEffect, useState } from "react";
import { BC_CITIES } from "../lib/bc-cities";

const DEFAULT_CITY = "Vancouver";

function dayLabel(dateStr, i) {
  if (i === 0) return "Today";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function hourLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}

export default function WeatherView({ defaultCityName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [bcSelection, setBcSelection] = useState(defaultCityName || DEFAULT_CITY);
  const [syncedDefault, setSyncedDefault] = useState(false);

  async function loadByCoords(lat, lon) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadByCity(city) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadByCity(`${bcSelection}, British Columbia, Canada`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick up the app's default city once it loads from storage (it isn't
  // available on the very first render), without overriding a choice
  // already made in this session.
  useEffect(() => {
    if (!syncedDefault && defaultCityName && defaultCityName !== bcSelection) {
      setBcSelection(defaultCityName);
      loadByCity(`${defaultCityName}, British Columbia, Canada`);
      setSyncedDefault(true);
    } else if (!syncedDefault && defaultCityName) {
      setSyncedDefault(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCityName]);

  function handleSearch(e) {
    e.preventDefault();
    if (cityInput.trim()) loadByCity(cityInput.trim());
  }

  function handleBcSelect(e) {
    const city = e.target.value;
    setBcSelection(city);
    loadByCity(`${city}, British Columbia, Canada`);
  }

  function handleUseLocation() {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => loadByCoords(pos.coords.latitude, pos.coords.longitude),
        () => setError("Couldn't get your location — check permissions."),
        { timeout: 8000 }
      );
    }
  }

  return (
    <div>
      <label style={styles.label}>British Columbia city</label>
      <select value={bcSelection} onChange={handleBcSelect} style={styles.select}>
        {BC_CITIES.map((group) => (
          <optgroup key={group.region} label={group.region}>
            {group.places.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div style={styles.altRow}>
        <form onSubmit={handleSearch} style={styles.searchRow}>
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Or search any city…"
            style={styles.input}
          />
          <button type="submit" style={styles.searchBtn}>
            Go
          </button>
        </form>
        <button type="button" onClick={handleUseLocation} style={styles.locBtn}>
          📍 Use my location
        </button>
      </div>

      {loading && <p style={styles.dim}>Loading weather…</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && data && (
        <>
          <div style={styles.currentCard}>
            <p style={styles.location}>{data.location?.name || "Current location"}</p>
            <div style={styles.currentMain}>
              <span style={styles.bigIcon}>{data.current.icon}</span>
              <span style={styles.bigTemp}>{data.current.temp}°C</span>
            </div>
            <p style={styles.condLabel}>{data.current.label}</p>
            <div style={styles.statsRow}>
              <span>Feels {data.current.feelsLike}°</span>
              <span>💧 {data.current.humidity}%</span>
              <span>💨 {data.current.windSpeed} km/h</span>
            </div>
          </div>

          <p style={styles.sectionTitle}>Next hours</p>
          <div style={styles.hourlyRow}>
            {data.hourly.map((h, i) => (
              <div key={i} style={styles.hourCard}>
                <p style={styles.hourTime}>{hourLabel(h.time)}</p>
                <p style={styles.hourIcon}>{h.icon}</p>
                <p style={styles.hourTemp}>{h.temp}°</p>
              </div>
            ))}
          </div>

          <p style={styles.sectionTitle}>6-day forecast</p>
          <div style={styles.dailyList}>
            {data.daily.map((d, i) => (
              <div key={i} style={styles.dailyRow}>
                <span style={styles.dailyDay}>{dayLabel(d.date, i)}</span>
                <span style={styles.dailyIcon}>{d.icon}</span>
                <span style={styles.dailyRain}>💧{d.precipChance ?? 0}%</span>
                <span style={styles.dailyTemps}>
                  {d.max}° / {d.min}°
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  label: {
    display: "block",
    fontSize: 12,
    color: "var(--text-dim)",
    marginBottom: 6,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  select: {
    width: "100%",
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "12px 12px",
    color: "var(--text)",
    fontSize: 15,
    marginBottom: 10,
  },
  altRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16,
  },
  searchRow: { display: "flex", gap: 8 },
  input: {
    flex: 1,
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: 14,
  },
  searchBtn: {
    background: "var(--blue)",
    color: "#0b0f14",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 14,
  },
  locBtn: {
    background: "none",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "8px 12px",
    color: "var(--text-dim)",
    fontSize: 13,
    alignSelf: "flex-start",
  },
  currentCard: {
    background: "linear-gradient(160deg, #16202b, #0f1620)",
    border: "1px solid var(--panel-border)",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  location: { color: "var(--text-dim)", fontSize: 13, marginBottom: 8 },
  currentMain: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  bigIcon: { fontSize: 48 },
  bigTemp: { fontSize: 44, fontWeight: 700 },
  condLabel: { color: "var(--text-dim)", fontSize: 14, marginTop: 4 },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
    fontSize: 13,
    color: "var(--text-dim)",
  },
  sectionTitle: { fontSize: 13, color: "var(--text-dim)", marginBottom: 8, marginTop: 4 },
  hourlyRow: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 },
  hourCard: {
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 12,
    padding: "10px 12px",
    textAlign: "center",
    minWidth: 62,
    flexShrink: 0,
  },
  hourTime: { fontSize: 11, color: "var(--text-dim)" },
  hourIcon: { fontSize: 20, margin: "4px 0" },
  hourTemp: { fontSize: 13, fontWeight: 600 },
  dailyList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 },
  dailyRow: {
    display: "flex",
    alignItems: "center",
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13.5,
  },
  dailyDay: { width: 56, fontWeight: 600 },
  dailyIcon: { width: 32, fontSize: 18 },
  dailyRain: { width: 60, color: "var(--blue)", fontSize: 12 },
  dailyTemps: { marginLeft: "auto", color: "var(--text-dim)" },
  dim: { color: "var(--text-dim)", fontSize: 14 },
};
