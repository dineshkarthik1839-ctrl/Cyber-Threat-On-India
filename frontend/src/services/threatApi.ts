import type { Threat } from "../types/threat";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type ApiThreat = Partial<Threat> & {
  source_ip?: string;
  source_country?: string;
  country_code?: string;
  target_state?: string;
  attack_type?: string;
};

export interface LiveFeedResponse {
  items: Threat[];
  meta: { mode?: "live" | "demo"; sources?: string[]; refreshed_at?: string };
}

function normalizeThreat(item: ApiThreat): Threat {
  return {
    id: item.id ?? crypto.randomUUID(),
    sourceIp: item.sourceIp ?? item.source_ip ?? "Unknown",
    sourceCountry: item.sourceCountry ?? item.source_country ?? "Unknown",
    countryCode: item.countryCode ?? item.country_code ?? "--",
    targetState: item.targetState ?? item.target_state ?? "India",
    attackType: item.attackType ?? item.attack_type ?? "Suspicious activity",
    severity: item.severity ?? "Medium",
    confidence: item.confidence ?? 0,
    timestamp: item.timestamp ?? "Just now",
    mitre: item.mitre ?? "T0000",
  };
}

export async function getLiveThreatFeed(signal?: AbortSignal): Promise<LiveFeedResponse> {
  const response = await fetch(`${API_BASE_URL}/threats/live?limit=40`, { signal });
  if (!response.ok) throw new Error(`Threat feed request failed (${response.status})`);
  const payload: unknown = await response.json();
  const data = Array.isArray(payload) ? { items: payload, meta: {} } : payload as { items?: ApiThreat[]; meta?: LiveFeedResponse["meta"] };
  return { items: (data.items ?? []).map(normalizeThreat), meta: data.meta ?? {} };
}
