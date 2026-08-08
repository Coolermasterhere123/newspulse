"use client";

import { useState } from "react";
import NewsView from "../components/NewsView";
import WeatherView from "../components/WeatherView";
import SportsView from "../components/SportsView";
import FiresView from "../components/FiresView";
import DriveBCView from "../components/DriveBCView";
import AirQualityView from "../components/AirQualityView";
import CityPicker from "../components/CityPicker";
import { useDefaultCity } from "../lib/useDefaultCity";

const TABS = [
  { key: "news", label: "News", icon: "📰" },
  { key: "weather", label: "Weather", icon: "🌤️" },
  { key: "fires", label: "Fires", icon: "🔥" },
  { key: "aqhi", label: "Air Quality", icon: "🌫️" },
  { key: "drivebc", label: "Drive BC", icon: "🚗" },
  { key: "sports", label: "Sports", icon: "🏆" },
];

export default function Home() {
  const [tab, setTab] = useState("news");
  const { city, setCity, loaded } = useDefaultCity();
  const [pickerOpen, setPickerOpen] = useState(false);

  const needsOnboarding = loaded && !city;

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>NewsPulse</h1>
            <p style={styles.subtitle}>Canadian News · BC Weather · Sports</p>
          </div>
          {city && (
            <button style={styles.cityBtn} onClick={() => setPickerOpen(true)}>
              📍 {city.name}
            </button>
          )}
        </div>
      </header>

      <div style={styles.content}>
        {tab === "news" && <NewsView defaultCityName={city?.name} />}
        {tab === "weather" && <WeatherView defaultCityName={city?.name} />}
        {tab === "fires" && <FiresView userLocation={city} />}
        {tab === "aqhi" && <AirQualityView userLocation={city} />}
        {tab === "drivebc" && <DriveBCView />}
        {tab === "sports" && <SportsView />}
      </div>

      <nav style={styles.nav}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...styles.navBtn,
              color: tab === t.key ? "var(--amber)" : "var(--text-dim)",
            }}
          >
            <span style={styles.navIcon}>{t.icon}</span>
            <span style={styles.navLabel}>{t.label}</span>
          </button>
        ))}
      </nav>

      {(needsOnboarding || pickerOpen) && (
        <CityPicker
          initialCity={city?.name}
          dismissable={!!city}
          onClose={() => setPickerOpen(false)}
          onSelect={(c) => {
            setCity(c);
            setPickerOpen(false);
          }}
        />
      )}
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    maxWidth: 560,
    margin: "0 auto",
  },
  header: {
    padding: "20px 16px 8px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "var(--text-dim)",
    marginTop: 2,
  },
  cityBtn: {
    background: "var(--panel)",
    border: "1px solid var(--panel-border)",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--text)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: "12px 16px 24px",
    overflowY: "auto",
  },
  nav: {
    display: "flex",
    borderTop: "1px solid var(--panel-border)",
    background: "var(--bg)",
    position: "sticky",
    bottom: 0,
    paddingBottom: "env(safe-area-inset-bottom)",
    overflowX: "auto",
  },
  navBtn: {
    flex: "1 0 auto",
    minWidth: 64,
    background: "none",
    border: "none",
    padding: "10px 6px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 11, fontWeight: 600 },
};
