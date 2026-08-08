"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function ClosuresPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [area, setArea] = useState("All");
  const [onlyClosures, setOnlyClosures] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/road-events");
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

  const areas = data
    ? ["All", ...Array.from(new Set(data.events.map((e) => e.area))).sort()]
    : ["All"];

  const filtered = (data?.events || [])
    .filter((e) => (onlyClosures ? e.isClosure : true))
    .filter((e) => (area === "All" ? true : e.area === area))
    .sort((a, b) => (a.isClosure === b.isClosure ? 0 : a.isClosure ? -1 : 1));

  return (
    <div>
      {loading && <p style={styles.dim}>Loading DriveBC road conditions…</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && data && (
        <>
          <div style={styles.toggleRow}>
            <button
              onClick={() => setOnlyClosures(true)}
              style={{
                ...styles.toggleBtn,
                borderColor: onlyClosures ? "var(--red)" : "var(--panel-border)",
                color: onlyClosures ? "var(--red)" : "var(--text-dim)",
              }}
            >
              🚧 Closures only
            </button>
            <button
              onClick={() => setOnlyClosures(false)}
              style={{
                ...styles.toggleBtn,
                borderColor: !onlyClosures ? "var(--amber)" : "var(--panel-border)",
                color: !onlyClosures ? "var(--amber)" : "var(--text-dim)",
              }}
            >
              All major/moderate events
            </button>
          </div>

          <select value={area} onChange={(e) => setArea(e.target.value)} style={styles.select}>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <p style={styles.countLine}>
            {filtered.length} result{filtered.length === 1 ? "" : "s"} · updated{" "}
            {new Date(data.updatedAt).toLocaleTimeString()}
          </p>

          <div style={styles.list}>
            {filtered.length === 0 && (
              <p style={styles.dim}>No matching road events right now.</p>
            )}
            {filtered.map((ev) => (
              <div
                key={ev.id}
                style={{
                  ...styles.card,
                  borderColor: ev.isClosure ? "var(--red)" : "var(--panel-border)",
                }}
              >
                <div style={styles.cardHeader}>
                  <p style={styles.headline}>
                    {ev.roads?.[0]?.name || ev.headline}
                    {ev.isClosure && <span style={styles.closedBadge}>CLOSED</span>}
                  </p>
                </div>
                <p style={styles.area}>{ev.area}</p>
                <p style={styles.description}>{ev.description}</p>
                <p style={styles.meta}>Updated {timeAgo(ev.updated)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CamerasPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const overlayRef = useRef(null);

  function closeOverlay() {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setSelected(null);
  }

  function openCamera(cam) {
    setSelected(cam);
    // Best-effort: request true device fullscreen (hides browser chrome) where supported.
    requestAnimationFrame(() => {
      const el = overlayRef.current;
      if (el?.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
    });
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/road-cameras");
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

  useEffect(() => {
    function handleFsChange() {
      if (typeof document !== "undefined" && !document.fullscreenElement) {
        setSelected(null);
      }
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const [regionFilter, setRegionFilter] = useState("All");

  const regions = useMemo(() => {
    if (!data) return ["All"];
    return ["All", ...Array.from(new Set(data.cams.map((c) => c.region))).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    let list = data.cams;
    if (regionFilter !== "All") {
      list = list.filter((c) => c.region === regionFilter);
    }
    if (q) {
      list = list.filter((c) =>
        [c.name, c.location, c.highway, c.caption]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(q))
      );
    }
    return list;
  }, [data, search, regionFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const cam of filtered) {
      if (!map.has(cam.region)) map.set(cam.region, []);
      map.get(cam.region).push(cam);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div>
      {loading && <p style={styles.dim}>Loading DriveBC cameras…</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && data && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by highway, name, or location…"
            style={styles.searchInput}
          />

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={styles.select}
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <p style={styles.countLine}>
            {filtered.length} camera{filtered.length === 1 ? "" : "s"}
            {regionFilter === "All" ? ` across ${grouped.length} regions` : ""}
          </p>

          {selected && (
            <div
              ref={overlayRef}
              style={styles.fullscreenOverlay}
              onClick={closeOverlay}
            >
              <button
                style={styles.fsCloseBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  closeOverlay();
                }}
              >
                ✕
              </button>
              <img
                src={`${selected.imageUrl}${
                  selected.imageUrl.includes("?") ? "&" : "?"
                }t=${Date.now()}`}
                alt={selected.name}
                style={styles.fsImg}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={styles.fsInfo} onClick={(e) => e.stopPropagation()}>
                <p style={styles.viewerName}>{selected.name}</p>
                <p style={styles.viewerCaption}>{selected.caption}</p>
                <a
                  href={selected.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.fsLink}
                >
                  Open on DriveBC ↗
                </a>
              </div>
            </div>
          )}

          {grouped.map(([region, cams]) => (
            <div key={region} style={{ marginBottom: 20 }}>
              <p style={styles.regionHeader}>
                {region} <span style={styles.regionCount}>({cams.length})</span>
              </p>
              <div style={styles.camGrid}>
                {cams.map((cam) => (
                  <button key={cam.id} onClick={() => openCamera(cam)} style={styles.camCard}>
                    <img
                      src={cam.thumbUrl || cam.imageUrl}
                      alt={cam.name}
                      style={styles.camThumb}
                      loading="lazy"
                    />
                    <p style={styles.camName}>{cam.name}</p>
                    <p style={styles.camHwy}>Hwy {cam.highway || "—"}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <p style={styles.dim}>No cameras match this search.</p>
          )}
        </>
      )}
    </div>
  );
}

export default function DriveBCView() {
  const [tab, setTab] = useState("closures");

  return (
    <div>
      <div style={styles.mainTabs}>
        <button
          onClick={() => setTab("closures")}
          style={{
            ...styles.mainTab,
            borderColor: tab === "closures" ? "var(--red)" : "var(--panel-border)",
            color: tab === "closures" ? "var(--red)" : "var(--text-dim)",
          }}
        >
          🚧 Closures & Delays
        </button>
        <button
          onClick={() => setTab("cameras")}
          style={{
            ...styles.mainTab,
            borderColor: tab === "cameras" ? "var(--blue)" : "var(--panel-border)",
            color: tab === "cameras" ? "var(--blue)" : "var(--text-dim)",
          }}
        >
          📷 Cameras
        </button>
      </div>

      {tab === "closures" ? <ClosuresPanel /> : <CamerasPanel />}
    </div>
  );
}

const styles = {
  mainTabs: { display: "flex", gap: 8, marginBottom: 16 },
  mainTab: {
    flex: 1,
    background: "var(--panel)",
    border: "1px solid",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13.5,
    fontWeight: 700,
  },
  toggleRow: { display: "flex", gap: 8, marginBottom: 10 },
  toggleBtn: {
    background: "var(--panel)",
    border: "1px solid",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12.5,
    fontWeight: 600,
    flex: 1,
  },
  select: {
    width: "100%",
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: 14,
    marginBottom: 8,
  },
  countLine: { fontSize: 12, color: "var(--text-dim)", marginBottom: 10 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: "var(--panel)",
    border: "1px solid",
    borderRadius: 12,
    padding: "12px 14px",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: 2 },
  headline: { fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 },
  closedBadge: {
    fontSize: 10.5,
    fontWeight: 800,
    color: "var(--red)",
    border: "1px solid var(--red)",
    borderRadius: 999,
    padding: "1px 7px",
  },
  area: { fontSize: 12, color: "var(--text-dim)", marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 1.4, marginBottom: 6 },
  meta: { fontSize: 11.5, color: "var(--text-dim)" },
  searchInput: {
    width: "100%",
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: 14,
    marginBottom: 8,
  },
  camGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 10,
  },
  regionHeader: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--blue)",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  regionCount: {
    color: "var(--text-dim)",
    fontWeight: 500,
    textTransform: "none",
    letterSpacing: 0,
  },
  camCard: {
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 12,
    padding: 8,
    textAlign: "left",
    color: "inherit",
  },
  camThumb: {
    width: "100%",
    aspectRatio: "4 / 3",
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 6,
    background: "#0a0e13",
  },
  camName: { fontSize: 12, fontWeight: 600, lineHeight: 1.3 },
  camHwy: { fontSize: 11, color: "var(--text-dim)", marginTop: 2 },
  viewerName: { fontSize: 14.5, fontWeight: 700, color: "#fff" },
  viewerCaption: { fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5, 7, 10, 0.96)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  fsCloseBtn: {
    position: "absolute",
    top: "max(16px, env(safe-area-inset-top))",
    right: 16,
    background: "rgba(255,255,255,0.12)",
    border: "none",
    borderRadius: "50%",
    width: 40,
    height: 40,
    color: "#fff",
    fontSize: 18,
    lineHeight: 1,
  },
  fsImg: {
    maxWidth: "100%",
    maxHeight: "75vh",
    borderRadius: 10,
    objectFit: "contain",
  },
  fsInfo: {
    marginTop: 14,
    textAlign: "center",
    maxWidth: 480,
  },
  fsLink: {
    display: "inline-block",
    marginTop: 10,
    color: "var(--blue)",
    fontSize: 13.5,
    fontWeight: 600,
  },
  dim: { color: "var(--text-dim)", fontSize: 14 },
};
