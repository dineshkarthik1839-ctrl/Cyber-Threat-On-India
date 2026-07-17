import { useEffect, useState, useCallback } from "react";
import { getLiveThreatFeed, type LiveFeedResponse } from "../services/threatApi";
import type { Threat } from "../types/threat";

const REFRESH_INTERVAL_MS = 30_000; // Fallback poll interval if WebSocket fails

interface LiveThreatFeedState {
  threats: Threat[];
  isRefreshing: boolean;
  isUnavailable: boolean;
  isDemo: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  meta: LiveFeedResponse["meta"];
}

// Computes the WebSocket URL dynamically based on current host/environment
function getWebSocketUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
  
  if (apiBase.startsWith("http")) {
    return apiBase.replace("http", "ws").replace("/api/v1", "/ws/threats");
  }
  
  // Relative fallback for Docker deployments
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/ws/threats`;
}

export function useLiveThreatFeed(): LiveThreatFeedState {
  const [items, setItems] = useState<Threat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [meta, setMeta] = useState<LiveFeedResponse["meta"]>({ mode: "live" });

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const feed = await getLiveThreatFeed();
      setItems(feed.items);
      setMeta(feed.meta);
      setIsDemo(feed.meta.mode === "demo");
      setIsUnavailable(false);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("REST Threat Feed error: ", err);
      // Don't clear items if we already have some to prevent flashing empty screens
      if (items.length === 0) {
        setIsUnavailable(true);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [items.length]);

  useEffect(() => {
    // 1. Initial historical load
    void refresh();

    // 2. Establish WebSocket stream connection
    let socket: WebSocket | null = null;
    let reconnectTimeoutId: number;

    function connectWebSocket() {
      const wsUrl = getWebSocketUrl();
      console.log(`Connecting to Threat WebSocket: ${wsUrl}`);
      
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Threat WebSocket connected successfully.");
        setIsUnavailable(false);
        // Send a ping to satisfy server receive text loops
        socket?.send("ping");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "heartbeat") {
            return;
          }

          // Prepend new threat event received from WebSocket
          const newThreat: Threat = {
            id: data.id ?? crypto.randomUUID(),
            sourceIp: data.sourceIp ?? "Unknown",
            sourceCountry: data.sourceCountry ?? "Unknown",
            countryCode: data.countryCode ?? "--",
            targetState: data.targetState ?? "India",
            attackType: data.attackType ?? "Suspicious activity",
            severity: data.severity ?? "Medium",
            confidence: data.confidence ?? 50,
            timestamp: data.timestamp ?? new Date().toISOString(),
            mitre: data.mitre ?? "T0000",
          };

          setItems((prev) => {
            // Keep list capped to prevent memory leaks in long-running dashboards
            const filtered = prev.filter((p) => p.id !== newThreat.id);
            return [newThreat, ...filtered].slice(0, 100);
          });
          setLastUpdated(new Date());
          
          if (data.source === "simulator") {
            setIsDemo(false); // Simulator counts as live local telemetry
          }
        } catch (err) {
          console.error("Error parsing WebSocket message: ", err);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket threat socket encountered an error: ", err);
      };

      socket.onclose = () => {
        console.log("Threat WebSocket disconnected. Reconnecting in 5s...");
        reconnectTimeoutId = window.setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    }

    connectWebSocket();

    // Fallback polling interval if WebSocket loses connection
    const interval = window.setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        void refresh();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(reconnectTimeoutId);
      if (socket) {
        socket.onclose = null; // Prevent reconnect on explicit component unmount
        socket.close();
      }
    };
  }, [refresh]);

  return { threats: items, isRefreshing, isUnavailable, isDemo, lastUpdated, refresh, meta };
}
