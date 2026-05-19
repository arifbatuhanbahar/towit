import { useEffect, useState } from "react";
import { api } from "../lib/api";

export type JobSummary = {
  id: string;
  status: string;
  priceSnapshot: string;
  distanceKm: number;
  createdAt: string;
  operator: { businessName: string };
};

/**
 * Müşteri talep listesini 6 sn'de bir çekerek canlı tutar. Hata durumunda
 * listeyi sıfırlar, böylece kullanıcı yanıltıcı eski veri görmez.
 */
export function useJobs(intervalMs = 6000): JobSummary[] {
  const [jobs, setJobs] = useState<JobSummary[]>([]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await api<{ jobs: JobSummary[] }>("/jobs");
        if (alive) setJobs(res.jobs);
      } catch {
        if (alive) setJobs([]);
      }
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return jobs;
}
