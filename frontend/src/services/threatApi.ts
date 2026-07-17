import api from "./api";
import type { Threat } from "../types/threat";

export interface LiveFeedResponse {
  items: Threat[];
  meta: { mode?: "live" | "demo"; sources?: string[]; refreshed_at?: string };
}

export interface OverviewStats {
  total_events: number;
  critical_events: number;
  active_campaigns: number;
  targeted_regions: number;
}

export interface CountryStats {
  country: string;
  code: string;
  count: number;
}

export interface StateStats {
  state: string;
  count: number;
  share: number;
}

export interface TimelineStats {
  time: string;
  attacks: number;
}

export interface SeverityStats {
  severity: string;
  count: number;
}

export interface IocLookupResponse {
  found: boolean;
  indicator: string;
  type: string;
  risk_score: number;
  severity: string;
  confidence: number;
  mitre_tactic: string;
  attack_type: string;
  sources: string[];
  description: string;
  recommendation: string;
  last_seen: string | null;
}

export interface AiBriefingResponse {
  brief: string;
}

export interface AiQueryResponse {
  answer: string;
}

// Normalize backend payload keys
function normalizeThreat(item: any): Threat {
  return {
    id: item.id?.toString() ?? crypto.randomUUID(),
    source: item.source ?? "Feed",
    sourceIp: item.sourceIp ?? item.source_ip ?? item.indicator ?? "Unknown",
    sourceCountry: item.sourceCountry ?? item.source_country ?? "Unknown",
    countryCode: item.countryCode ?? item.country_code ?? "--",
    targetState: item.targetState ?? item.target_state ?? "India",
    attackType: item.attackType ?? item.attack_type ?? "Suspicious activity",
    severity: item.severity ?? "Medium",
    confidence: item.confidence ?? 50,
    timestamp: item.timestamp ?? new Date().toISOString(),
    mitre: item.mitre ?? item.mitre_tactic ?? "T0000",
  };
}

export async function getLiveThreatFeed(
  severity = "All",
  source = "All",
  query = ""
): Promise<LiveFeedResponse> {
  const response = await api.get<any[]>("/attacks", {
    params: { severity, source, query, limit: 100 }
  });
  
  const items = response.data.map(normalizeThreat);
  return {
    items,
    meta: {
      mode: items.length > 0 ? "live" : "demo",
      sources: Array.from(new Set(items.map((i) => i.source ?? "Intelligence Feed"))),
      refreshed_at: new Date().toISOString(),
    },
  };
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const response = await api.get<OverviewStats>("/attacks/stats/overview");
  return response.data;
}

export async function getCountryStats(): Promise<CountryStats[]> {
  const response = await api.get<CountryStats[]>("/attacks/stats/countries");
  return response.data;
}

export async function getStateStats(limit = 5): Promise<StateStats[]> {
  const response = await api.get<StateStats[]>("/attacks/stats/states", {
    params: { limit }
  });
  return response.data;
}

export async function getSeverityStats(): Promise<SeverityStats[]> {
  const response = await api.get<SeverityStats[]>("/attacks/stats/severity");
  return response.data;
}

export async function getTimelineStats(): Promise<TimelineStats[]> {
  const response = await api.get<TimelineStats[]>("/attacks/stats/timeline");
  return response.data;
}

export async function lookupIoc(indicator: string): Promise<IocLookupResponse> {
  const response = await api.get<IocLookupResponse>("/ioc/lookup", {
    params: { indicator }
  });
  return response.data;
}

export async function getAiBriefing(): Promise<AiBriefingResponse> {
  const response = await api.get<AiBriefingResponse>("/ai/briefing");
  return response.data;
}

export async function queryAiAnalyst(query: string): Promise<AiQueryResponse> {
  const response = await api.post<AiQueryResponse>("/ai/query", { query });
  return response.data;
}

export async function downloadReportCsv(severity = "All", source = "All", query = ""): Promise<Blob> {
  const response = await api.get("/reports/export", {
    params: { format: "csv", severity, source, query },
    responseType: "blob"
  });
  return response.data;
}