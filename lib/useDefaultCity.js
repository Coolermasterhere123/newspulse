"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "newspulse:defaultCity"; // stores { name, lat, lon }

export function useDefaultCity() {
  const [city, setCityState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setCityState(JSON.parse(raw));
    } catch (e) {
      // ignore malformed/unavailable storage
    }
    setLoaded(true);
  }, []);

  const setCity = useCallback((c) => {
    setCityState(c);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(c));
    } catch (e) {
      // ignore storage failures (private browsing, etc.)
    }
  }, []);

  return { city, setCity, loaded };
}
