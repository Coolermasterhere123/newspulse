"use client";

import { useEffect, useMemo, useState } from "react";
import { haversineKm } from "../lib/geo";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function categoryShort(aqhi) {
  if (aqhi == null) return "?";
  if (aqhi <= 3) return "Low";
  if (aqhi <= 6) return "Mod";
  if (aqhi <= 10) return "High";
  return "V.High";
}

export default function AirQualityView({ userLocation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/air-quality");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stationsWithDistance = useMemo(() => {
    if (!data) return [];
    if (!userLocation) return data.stations;
    return data.stations.map((s) => ({
      ...s,
      distanceKm: haversineKm(userLocation.lat, userLocation.lon, s.lat, s.lon),
    }));
  }, [data, userLocation]);

  const closest = useMemo(() => {
    if (!userLocation || stationsWithDistance.length === 0) return null;
    return [...stationsWithDistance].sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    )[0];
  }, [stationsWithDistance, userLocation]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stationsWithDistance;
    return stationsWithDistance.filter((s) => s.name.toLowerCase().includes(q));
  }, [stationsWithDistance, search]);

  const worst = data?.stations?.[0];
  const elevatedCount = data?.stations?.filter((s) => (s.aqhi || 0) > 6).length || 0;

  return (
    <div>
      {loading && <p style={styles.dim}>Loading air quality data…</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && data && (
        <>
          <div style={styles.summaryCard}>
            {worst && (worst.aqhi || 0) > 6 ? (
              <>
                <p style={styles.summaryTitle}>
                  ⚠️ {elevatedCount} location{elevatedCount === 1 ? "" : "s"} at high risk
                </p>
                <p style={styles.summarySub}>
                  Worst right now: {worst.name} — AQHI {worst.aqhi?.toFixed(1)} ({worst.label})
                </p>
              </>
            ) : (
              <>
                <p style={styles.summaryTitle}>✅ Air quality looks good across BC</p>
                <p style={styles.summarySub}>
                  No community currently reporting elevated risk (AQHI &gt; 6)
                </p>
              </>
            )}
            <p style={styles.summaryMeta}>
              {data.stations.length} monitored communities · updated{" "}
              {new Date(data.updatedAt).toLocaleTimeString()}
            </p>
          </div>

          {closest && (
            <div style={styles.closestCard}>
              <p style={styles.closestTitle}>
                📍 Closest to {userLocation.name}: {closest.name}
              </p>
              <p style={styles.closestSub}>
                {closest.distanceKm != null ? `${Math.round(closest.distanceKm)} km away` : ""} ·
                AQHI {closest.aqhi != null ? closest.aqhi.toFixed(1) : "—"} ({closest.label})
              </p>
            </div>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a BC community…"
            style={styles.searchInput}
          />

          <div style={styles.list}>
            {filtered.length === 0 && (
              <p style={styles.dim}>No matching communities.</p>
            )}
            {filtered.map((s) => (
              <div key={s.locationId} style={{ ...styles.card, borderColor: s.color }}>
                <div style={styles.cardHeader}>
                  <p style={styles.cardName}>{s.name}</p>
                  <div style={styles.aqhiBadge}>
                    <span style={{ ...styles.aqhiValue, color: s.color }}>
                      {s.aqhi != null ? s.aqhi.toFixed(1) : "—"}
                    </span>
                    <span style={{ ...styles.aqhiLabel, color: s.color }}>{s.label}</span>
                  </div>
                </div>
                <p style={styles.cardMeta}>
                  Observed {timeAgo(s.observedAt)}
                  {s.distanceKm != null ? ` · ${Math.round(s.distanceKm)} km away` : ""}
                </p>
                {s.forecasts.length > 0 && (
                  <p style={styles.forecastLine}>
                    Forecast:{" "}
                    {s.forecasts
                      .map((f) => `${f.aqhi?.toFixed(0)} (${categoryShort(f.aqhi)})`)
                      .join("  →  ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p style={styles.footnote}>
            AQHI scale: 1-3 Low · 4-6 Moderate · 7-10 High · 10+ Very High. Data from
            Environment and Climate Change Canada.
          </p>
        </>
      )}
    </div>
  );
}

const styles = {
  summaryCard: {
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  summarySub: { fontSize: 13, color: "var(--text-dim)", marginBottom: 8 },
  summaryMeta: { fontSize: 12, color: "var(--text-dim)" },
  closestCard: {
    background: "var(--panel)",
    border: "1px solid var(--blue)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 14,
  },
  closestTitle: { fontSize: 13.5, fontWeight: 700, color: "var(--blue)" },
  closestSub: { fontSize: 12, color: "var(--text-dim)", marginTop: 3 },
  searchInput: {
    width: "100%",
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: 14,
    marginBottom: 14,
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: "var(--panel)",
    border: "1px solid",
    borderRadius: 12,
    padding: "12px 14px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  cardName: { fontSize: 14.5, fontWeight: 700, flex: 1 },
  aqhiBadge: { textAlign: "right" },
  aqhiValue: { fontSize: 20, fontWeight: 800, display: "block", lineHeight: 1 },
  aqhiLabel: { fontSize: 11, fontWeight: 600, textTransform: "uppercase" },
  cardMeta: { fontSize: 12, color: "var(--text-dim)", marginTop: 6 },
  forecastLine: { fontSize: 12.5, color: "var(--text-dim)", marginTop: 4 },
  footnote: {
    fontSize: 11.5,
    color: "var(--text-dim)",
    marginTop: 14,
    textAlign: "center",
  },
  dim: { color: "var(--text-dim)", fontSize: 14 },
};
