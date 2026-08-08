"use client";

import { useEffect, useMemo, useState } from "react";
import { haversineKm } from "../lib/geo";

const STATUS_COLOR = {
  "Out of Control": "var(--red)",
  "Being Held": "var(--amber)",
  "Under Control": "var(--green)",
  "Out": "var(--text-dim)",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSize(ha) {
  if (ha == null) return "—";
  if (ha < 1) return `${(ha * 10000).toFixed(0)} m²`;
  return `${ha.toLocaleString(undefined, { maximumFractionDigits: 1 })} ha`;
}

export default function FiresView({ userLocation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [centreFilter, setCentreFilter] = useState("All");
  const [sortByDistance, setSortByDistance] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fires");
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
    load();
  }, []);

  const firesWithDistance = useMemo(() => {
    if (!data) return [];
    if (!userLocation) return data.fires;
    return data.fires.map((f) => ({
      ...f,
      distanceKm: haversineKm(userLocation.lat, userLocation.lon, f.lat, f.lon),
    }));
  }, [data, userLocation]);

  const closest = useMemo(() => {
    if (!userLocation || firesWithDistance.length === 0) return null;
    return [...firesWithDistance].sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    )[0];
  }, [firesWithDistance, userLocation]);

  const centres = data
    ? ["All", ...Array.from(new Set(data.fires.map((f) => f.fireCentre))).sort()]
    : ["All"];

  let filtered =
    centreFilter !== "All"
      ? firesWithDistance.filter((f) => f.fireCentre === centreFilter)
      : firesWithDistance;

  if (sortByDistance && userLocation) {
    filtered = [...filtered].sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    );
  }

  return (
    <div>
      {loading && <p style={styles.dim}>Loading BC Wildfire Service data…</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && data && (
        <>
          <div style={styles.summaryCard}>
            <p style={styles.summaryTitle}>
              {data.outOfControlCount > 0
                ? `${data.outOfControlCount} fire${data.outOfControlCount === 1 ? "" : "s"} Out of Control`
                : data.fallbackUsed
                ? "No fires officially designated \"of note\" right now"
                : `${data.fires.length} wildfire${data.fires.length === 1 ? "" : "s"} of note`}
            </p>
            <p style={styles.summarySub}>
              {data.fireOfNoteCount > 0 &&
                `${data.fireOfNoteCount} designated fire${data.fireOfNoteCount === 1 ? "" : "s"} of note. `}
              {data.fallbackUsed
                ? `Showing the ${data.fires.length} largest currently active fires instead. `
                : ""}
              {data.totalActive} active fire{data.totalActive === 1 ? "" : "s"} tracked
              province-wide · updated {new Date(data.updatedAt).toLocaleTimeString()}
            </p>
          </div>

          {closest && (
            <div style={styles.closestCard}>
              <p style={styles.closestTitle}>
                📍 Closest to {userLocation.name}: {closest.name}
              </p>
              <p style={styles.closestSub}>
                {closest.distanceKm != null ? `${Math.round(closest.distanceKm)} km away` : ""} ·{" "}
                {closest.status} · {formatSize(closest.sizeHectares)}
              </p>
            </div>
          )}

          <div style={styles.tabs}>
            {centres.map((c) => (
              <button
                key={c}
                onClick={() => setCentreFilter(c)}
                style={{
                  ...styles.tab,
                  borderColor: centreFilter === c ? "var(--orange)" : "var(--panel-border)",
                  color: centreFilter === c ? "var(--orange)" : "var(--text-dim)",
                }}
              >
                {c === "All" ? "All Centres" : c.replace(" Fire Centre", "")}
              </button>
            ))}
            {userLocation && (
              <button
                onClick={() => setSortByDistance((s) => !s)}
                style={{
                  ...styles.tab,
                  borderColor: sortByDistance ? "var(--blue)" : "var(--panel-border)",
                  color: sortByDistance ? "var(--blue)" : "var(--text-dim)",
                }}
              >
                📍 Closest first
              </button>
            )}
          </div>

          <div style={styles.list}>
            {filtered.length === 0 && (
              <p style={styles.dim}>No fires match this filter right now.</p>
            )}
            {filtered.map((f, i) => (
              <a
                key={i}
                href={f.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.card}
              >
                <div style={styles.cardHeader}>
                  <p style={styles.fireName}>{f.name}</p>
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: STATUS_COLOR[f.status] || "var(--text-dim)",
                      borderColor: STATUS_COLOR[f.status] || "var(--panel-border)",
                    }}
                  >
                    {f.status || "Unknown"}
                  </span>
                </div>
                <p style={styles.fireLocation}>
                  {f.location || "Location not specified"} · {f.fireCentre}
                  {f.distanceKm != null ? ` · ${Math.round(f.distanceKm)} km away` : ""}
                </p>
                <div style={styles.statsRow}>
                  <span>🔥 {formatSize(f.sizeHectares)}</span>
                  <span>📅 Started {formatDate(f.startDate)}</span>
                  {f.outDate && <span>✅ Out {formatDate(f.outDate)}</span>}
                  {f.cause && <span>Cause: {f.cause}</span>}
                </div>
              </a>
            ))}
          </div>

          <p style={styles.footnote}>
            Live data from the BC Wildfire Service public dashboard. Tap a fire for the
            official incident page.
          </p>
        </>
      )}
    </div>
  );
}

const styles = {
  summaryCard: {
    background: "linear-gradient(160deg, #241a12, #1a1310)",
    border: "1px solid var(--panel-border)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  summarySub: { fontSize: 12.5, color: "var(--text-dim)" },
  closestCard: {
    background: "var(--panel)",
    border: "1px solid var(--blue)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 14,
  },
  closestTitle: { fontSize: 13.5, fontWeight: 700, color: "var(--blue)" },
  closestSub: { fontSize: 12, color: "var(--text-dim)", marginTop: 3 },
  tabs: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    marginBottom: 14,
    paddingBottom: 4,
  },
  tab: {
    background: "var(--panel)",
    border: "1px solid",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    display: "block",
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 12,
    padding: "14px 16px",
    textDecoration: "none",
    color: "inherit",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  fireName: { fontSize: 15, fontWeight: 700 },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    border: "1px solid",
    borderRadius: 999,
    padding: "2px 8px",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
  },
  fireLocation: { fontSize: 13, color: "var(--text-dim)", marginBottom: 8 },
  statsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    fontSize: 12.5,
    color: "var(--text-dim)",
  },
  footnote: {
    fontSize: 11.5,
    color: "var(--text-dim)",
    marginTop: 14,
    textAlign: "center",
  },
  dim: { color: "var(--text-dim)", fontSize: 14 },
};
