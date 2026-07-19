export interface DNSInfo {
  A?: string[];
  AAAA?: string[];
  MX?: string[];
  TXT?: string[];
}

export interface SSLInfo {
  valid: boolean;
  issuer: string;
  expires: string;
  error?: string;
}

export interface DomainScanResult {
  scan_uuid: string;
  domain: string;
  risk_score: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  ip_addresses: string[];
  dns_records: DNSInfo;
  ssl_info: SSLInfo;
  security_headers: Record<string, string>;
  otx_pulses: number;
  has_malicious_reputation: boolean;
}
