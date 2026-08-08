"use client";

import { useEffect, useMemo, useState } from "react";

function toYYYYMMDD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function useThreeDays() {
  return useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      yesterday: toYYYYMMDD(yesterday),
      today: toYYYYMMDD(today),
      tomorrow: toYYYYMMDD(tomorrow),
    };
  }, []);
}

function GameCard({ ev, clickable, hiddenScore, onToggleHide, onOpenRecap }) {
  const isLive = ev.state === "in";
  const showHideControl = isLive;
  const scoresHidden = showHideControl && hiddenScore;

  return (
    <div
      onClick={() => clickable && onOpenRecap(ev)}
      style={{
        ...styles.card,
        borderColor: isLive ? "var(--green)" : "var(--panel-border)",
        cursor: clickable ? "pointer" : "default",
      }}
    >
      <div style={styles.teamRow}>
        <span style={styles.teamName}>{ev.away?.name || "TBD"}</span>
        <span style={{ ...styles.score, fontWeight: ev.away?.winner ? 800 : 500 }}>
          {scoresHidden ? "?" : ev.away?.score ?? "-"}
        </span>
      </div>
      <div style={styles.teamRow}>
        <span style={styles.teamName}>{ev.home?.name || "TBD"}</span>
        <span style={{ ...styles.score, fontWeight: ev.home?.winner ? 800 : 500 }}>
          {scoresHidden ? "?" : ev.home?.score ?? "-"}
        </span>
      </div>
      <div style={styles.statusRow}>
        <p style={{ ...styles.status, color: isLive ? "var(--green)" : "var(--text-dim)" }}>
          {isLive ? "🔴 LIVE — " : ""}
          {ev.status}
        </p>
        {showHideControl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleHide(ev.id);
            }}
            style={styles.hideBtn}
          >
            {scoresHidden ? "👁️ Reveal" : "🙈 Hide"}
          </button>
        )}
      </div>
      {clickable && <p style={styles.tapHint}>Tap for recap →</p>}
    </div>
  );
}

function RecapModal({ game, league, onClose }) {
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          league,
          event: game.id,
          name: game.name,
        });
        const res = await fetch(`/api/sports-recap?${params}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setRecap(json.recap);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [game.id, league]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <p style={styles.modalTitle}>{game.name}</p>
          <button onClick={onClose} style={styles.modalClose}>
            ✕
          </button>
        </div>
        <p style={styles.modalScoreLine}>
          {game.away?.name} {game.away?.score} — {game.home?.score} {game.home?.name}
        </p>
        <p style={styles.modalStatus}>{game.status}</p>

        {loading && <p style={styles.dim}>Writing recap…</p>}
        {error && <p style={{ color: "var(--red)" }}>{error}</p>}
        {!loading && recap && <p style={styles.recapText}>{recap}</p>}
        {!loading && !recap && !error && (
          <p style={styles.dim}>No recap available for this game.</p>
        )}
      </div>
    </div>
  );
}

function DaySection({ title, date, league, hiddenIds, onToggleHide, onOpenRecap, clickable }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sports?league=${league}&date=${date}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [league, date]);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data.events].sort((a, b) => {
      const rank = (ev) => (ev.state === "in" ? 0 : ev.state === "pre" ? 1 : 2);
      return rank(a) - rank(b);
    });
  }, [data]);

  const liveCount = sorted.filter((ev) => ev.state === "in").length;

  return (
    <div style={{ marginBottom: 22 }}>
      <p style={styles.sectionTitle}>
        {title}
        {liveCount > 0 && <span style={styles.liveTag}> · 🔴 {liveCount} live</span>}
      </p>

      {loading && <p style={styles.dim}>Loading…</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.list}>
          {sorted.length === 0 && <p style={styles.dim}>No games.</p>}
          {sorted.map((ev) => (
            <GameCard
              key={ev.id}
              ev={ev}
              clickable={clickable}
              hiddenScore={hiddenIds.has(ev.id)}
              onToggleHide={onToggleHide}
              onOpenRecap={onOpenRecap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SportsView() {
  const [league, setLeague] = useState("nhl");
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [recapGame, setRecapGame] = useState(null);
  const days = useThreeDays();

  function toggleHide(id) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const leagues = [
    { key: "nhl", label: "NHL" },
    { key: "cfl", label: "CFL" },
    { key: "nba", label: "NBA" },
    { key: "mlb", label: "MLB" },
    { key: "nfl", label: "NFL" },
    { key: "mls", label: "MLS" },
    { key: "epl", label: "Premier League" },
  ];

  return (
    <div>
      <div style={styles.tabs}>
        {leagues.map((l) => (
          <button
            key={l.key}
            onClick={() => setLeague(l.key)}
            style={{
              ...styles.tab,
              borderColor: league === l.key ? "var(--green)" : "var(--panel-border)",
              color: league === l.key ? "var(--green)" : "var(--text-dim)",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <DaySection
        title="Yesterday"
        date={days.yesterday}
        league={league}
        hiddenIds={hiddenIds}
        onToggleHide={toggleHide}
        onOpenRecap={setRecapGame}
        clickable
      />
      <DaySection
        title="Today"
        date={days.today}
        league={league}
        hiddenIds={hiddenIds}
        onToggleHide={toggleHide}
        onOpenRecap={setRecapGame}
        clickable
      />
      <DaySection
        title="Tomorrow"
        date={days.tomorrow}
        league={league}
        hiddenIds={hiddenIds}
        onToggleHide={toggleHide}
        onOpenRecap={setRecapGame}
        clickable={false}
      />

      {recapGame && (
        <RecapModal game={recapGame} league={league} onClose={() => setRecapGame(null)} />
      )}
    </div>
  );
}

const styles = {
  tabs: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  liveTag: { color: "var(--green)", textTransform: "none", letterSpacing: 0 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: "var(--panel)",
    border: "1px solid",
    borderRadius: 12,
    padding: "12px 14px",
  },
  teamRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "3px 0",
    fontSize: 14.5,
  },
  teamName: { flex: 1 },
  score: { fontSize: 16, minWidth: 24, textAlign: "right" },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  status: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.3 },
  hideBtn: {
    background: "none",
    border: "1px solid var(--panel-border)",
    borderRadius: 8,
    padding: "3px 9px",
    fontSize: 11.5,
    color: "var(--text-dim)",
  },
  tapHint: { fontSize: 11, color: "var(--text-dim)", marginTop: 6, textAlign: "right" },
  dim: { color: "var(--text-dim)", fontSize: 14 },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5,7,10,0.85)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 16,
    padding: 20,
    maxWidth: 480,
    width: "100%",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { fontSize: 16, fontWeight: 700, flex: 1 },
  modalClose: {
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontSize: 18,
    lineHeight: 1,
    padding: "0 0 0 12px",
  },
  modalScoreLine: { fontSize: 15, fontWeight: 600, marginTop: 10 },
  modalStatus: { fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12 },
  recapText: { fontSize: 14, lineHeight: 1.55 },
};
