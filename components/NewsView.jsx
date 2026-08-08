"use client";

import { useEffect, useState } from "react";
import { BC_CITIES } from "../lib/bc-cities";

const TAB_ORDER = ["local", "canada", "usa", "world", "conflict", "wildfire"];
const TAB_ACCENT = {
  local: "var(--amber)",
  canada: "var(--red)",
  usa: "var(--blue)",
  world: "var(--green)",
  conflict: "var(--red)",
  wildfire: "var(--orange)",
};
const DEFAULT_CITY = "Kamloops";

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

export default function NewsView({ defaultCityName }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("local");
  const [city, setCity] = useState(defaultCityName || DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digest, setDigest] = useState(null);
  const [error, setError] = useState(null);
  const [syncedDefault, setSyncedDefault] = useState(false);

  // Pick up the app's default city once it loads from storage, without
  // clobbering a choice the person already made in this session.
  useEffect(() => {
    if (!syncedDefault && defaultCityName) {
      setCity(defaultCityName);
      setSyncedDefault(true);
    }
  }, [defaultCityName, syncedDefault]);

  async function load(forCity) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?city=${encodeURIComponent(forCity)}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadDigest() {
    setDigestLoading(true);
    try {
      const res = await fetch(`/api/news?digest=1&city=${encodeURIComponent(city)}`);
      const json = await res.json();
      setDigest(json.digest);
      if (json.categories) setData(json);
    } catch (e) {
      setDigest(null);
    } finally {
      setDigestLoading(false);
    }
  }

  useEffect(() => {
    load(city);
    setDigest(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const active = data?.categories?.[tab];

  return (
    <div>
      <div style={styles.digestBox}>
        {!digest && !digestLoading && (
          <button style={styles.digestBtn} onClick={loadDigest}>
            ✨ Generate AI briefing
          </button>
        )}
        {digestLoading && <p style={styles.dim}>Writing your briefing…</p>}
        {digest && <p style={styles.digestText}>{digest}</p>}
      </div>

      <div style={styles.tabs}>
        {TAB_ORDER.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              ...styles.tab,
              borderColor: tab === k ? TAB_ACCENT[k] : "var(--panel-border)",
              color: tab === k ? TAB_ACCENT[k] : "var(--text-dim)",
            }}
          >
            {data?.categories?.[k]?.label || k}
          </button>
        ))}
      </div>

      {tab === "local" && (
        <div style={styles.citySelectRow}>
          <label style={styles.cityLabel}>City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={styles.citySelect}
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
        </div>
      )}

      {loading && <p style={styles.dim}>Loading headlines…</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && active && (
        <div style={styles.list}>
          {tab === "local" && active.status === "fallback_story" && (
            <p style={styles.fallbackNote}>
              No recent day-to-day news for {city} — showing a related story instead.
            </p>
          )}

          {tab === "local" && active.status === "empty" && (
            <div>
              <p style={styles.fallbackNote}>No stories found for {city} right now.</p>
              {active.nearby?.items?.length > 0 && (
                <>
                  <p style={styles.nearbyHeader}>
                    Nearby: {active.nearby.towns.join(", ")}
                  </p>
                  <div style={{ ...styles.list, marginTop: 8 }}>
                    {active.nearby.items.slice(0, 10).map((item, i) => (
                      <a
                        key={i}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.card}
                      >
                        <div style={{ ...styles.accentBar, background: "var(--text-dim)" }} />
                        <div style={{ flex: 1 }}>
                          <p style={styles.cardTitle}>{item.title}</p>
                          <p style={styles.cardMeta}>
                            {item.town} · {item.source} · {timeAgo(item.pubDate)}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {active.items.length === 0 && active.status !== "empty" && (
            <p style={styles.dim}>No headlines found right now.</p>
          )}
          {active.items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.card}
            >
              <div style={{ ...styles.accentBar, background: TAB_ACCENT[tab] }} />
              <div style={{ flex: 1 }}>
                <p style={styles.cardTitle}>{item.title}</p>
                <p style={styles.cardMeta}>
                  {item.source} · {timeAgo(item.pubDate)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  digestBox: {
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  digestBtn: {
    background: "linear-gradient(135deg, var(--amber), var(--orange))",
    color: "#111",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 600,
    fontSize: 14,
  },
  digestText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "var(--text)",
  },
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
  citySelectRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cityLabel: {
    fontSize: 12,
    color: "var(--text-dim)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  citySelect: {
    flex: 1,
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: 14,
  },
  fallbackNote: {
    fontSize: 13,
    color: "var(--text-dim)",
    fontStyle: "italic",
    marginBottom: 10,
  },
  nearbyHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    display: "flex",
    gap: 12,
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 12,
    padding: "12px 14px",
    textDecoration: "none",
    color: "inherit",
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 14.5,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: "var(--text-dim)",
  },
  dim: {
    color: "var(--text-dim)",
    fontSize: 14,
  },
};
