import { useEffect, useState } from "react";
import { threats as fallbackThreats } from "../services/mockData";
import { getLiveThreatFeed, type LiveFeedResponse } from "../services/threatApi";
import type { Threat } from "../types/threat";

const REFRESH_INTERVAL_MS = 15_000;

interface LiveThreatFeedState {
  threats: Threat[];
  isRefreshing: boolean;
  isUsingFallback: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  meta: LiveFeedResponse["meta"];
}

export function useLiveThreatFeed(): LiveThreatFeedState {
  const [items, setItems] = useState<Threat[]>(fallbackThreats);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [meta, setMeta] = useState<LiveFeedResponse["meta"]>({ mode: "demo" });

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const feed = await getLiveThreatFeed();
      if (feed.items.length) {
        setItems(feed.items);
        setMeta(feed.meta);
        setIsUsingFallback(feed.meta.mode !== "live");
        setLastUpdated(new Date());
      }
    } catch {
      setIsUsingFallback(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  return { threats: items, isRefreshing, isUsingFallback, lastUpdated, refresh, meta };
}
