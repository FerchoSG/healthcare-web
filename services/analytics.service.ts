import { api } from "@/lib/api-client";
import type { KPIs, RevenueDataPoint } from "@/types/api";

export function fetchKpis(): Promise<KPIs> {
  return api.get<KPIs>("/analytics/kpis");
}

export function fetchRevenue(): Promise<RevenueDataPoint[]> {
  return api.get<RevenueDataPoint[]>("/analytics/revenue");
}
