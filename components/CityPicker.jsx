"use client";

import { useState } from "react";
import { BC_CITIES } from "../lib/bc-cities";

export default function CityPicker({ initialCity, onSelect, onClose, dismissable }) {
  const [selection, setSelection] = useState(initialCity || "Kamloops");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weather?city=${encodeURIComponent(`${selection}, British Columbia, Canada`)}`
      );
      const json = await res.json();
      if (json.error || !json.location) throw new Error(json.error || "Could not locate city");
      onSelect({
        name: selection,
        lat: json.location.lat,
        lon: json.location.lon,
      });
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {dismissable && (
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}
        <p style={styles.title}>Choose your city</p>
        <p style={styles.subtitle}>
          Sets your default for News, Weather, and the closest wildfire and air quality
          readings. You can change this anytime.
        </p>

        <select
          value={selection}
          onChange={(e) => setSelection(e.target.value)}
          style={styles.select}
        >
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

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.confirmBtn} onClick={confirm} disabled={loading}>
          {loading ? "Setting up…" : "Set as my city"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5,7,10,0.9)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    position: "relative",
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 18,
    padding: 24,
    maxWidth: 420,
    width: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontSize: 18,
  },
  title: { fontSize: 19, fontWeight: 800, marginBottom: 8 },
  subtitle: { fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 18 },
  select: {
    width: "100%",
    background: "var(--bg)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "12px 12px",
    color: "var(--text)",
    fontSize: 15,
    marginBottom: 16,
  },
  error: { color: "var(--red)", fontSize: 13, marginBottom: 12 },
  confirmBtn: {
    width: "100%",
    background: "linear-gradient(135deg, var(--amber), var(--orange))",
    color: "#111",
    border: "none",
    borderRadius: 10,
    padding: "13px 16px",
    fontWeight: 700,
    fontSize: 15,
  },
};
