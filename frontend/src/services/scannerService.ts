import api from "./api";
import type { DomainScanResult } from "../types/scanner";

export async function analyzeDomain(domain: string, force: boolean = false): Promise<DomainScanResult> {
  const response = await api.post<DomainScanResult>("/analyze/domain", {
    url: domain, force
  });
  return response.data;
}
