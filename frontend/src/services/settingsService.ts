import api from "./api";

export interface CollectorSettings {
  abuseipdb_enabled: boolean;
  otx_enabled: boolean;
  threatfox_enabled: boolean;
  urlhaus_enabled: boolean;
  cisa_enabled: boolean;
  abuseipdb_key?: string;
  otx_key?: string;
  poll_interval_minutes: number;
  simulation_mode: boolean;
}

export async function getCollectorSettings(): Promise<CollectorSettings> {
  const response = await api.get<CollectorSettings>("/settings");
  return response.data;
}

export async function updateCollectorSettings(settings: CollectorSettings): Promise<CollectorSettings> {
  const response = await api.put<CollectorSettings>("/settings", settings);
  return response.data;
}
