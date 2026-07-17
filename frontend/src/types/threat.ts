export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface Threat {
  id: string;
  source?: string; // abuseipdb, otx, threatfox, urlhaus, cisa, simulator
  sourceIp: string;
  sourceCountry: string;
  countryCode: string;
  targetState: string;
  attackType: string;
  severity: Severity;
  confidence: number;
  timestamp: string;
  mitre: string;
}