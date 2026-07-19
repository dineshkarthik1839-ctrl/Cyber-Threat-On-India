import api from "./api";
import type { DomainScanResult } from "../types/scanner";

export async function analyzeDomain(domain: string, force: boolean = false): Promise<DomainScanResult> {
  const response = await api.get<DomainScanResult>("/analyze/domain", {
    params: { url: domain, force }
  });
  return response.data;
}
