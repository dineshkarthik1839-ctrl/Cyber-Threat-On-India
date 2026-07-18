export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface Threat {
  id: string;
  eventUuid?: string;
  source: string;
  sourceType?: "SIMULATOR" | "INTELLIGENCE" | "SENSOR" | string;
  eventClassification?: "SIMULATED" | "LIVE_INTELLIGENCE" | "INDIA_RELEVANT_INTELLIGENCE" | "LIVE_SENSOR" | "CONFIRMED_INDIA_TARGET" | string;
  sourceIp: string;
  sourceCountry: string;
  countryCode: string;
  targetCountry?: string;
  targetState: string;
  targetCity?: string;
  destinationPort?: number;
  protocol?: string;
  attackType: string;
  severity: "Low" | "Medium" | "High" | "Critical" | string;
  confidence: number;
  mitre: string;
  description?: string;
  timestamp: string;
  isConfirmedIndiaTarget?: boolean;
  sensor?: { id: string; name: string };
}