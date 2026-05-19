export type JobStatus =
  | "payment_pending"
  | "open"
  | "accepted"
  | "en_route"
  | "completed"
  | "rejected"
  | "cancelled";

export const STATUS_LABELS: Record<string, string> = {
  payment_pending: "Ödeme bekleniyor",
  open: "Çekiciye açık",
  accepted: "Kabul edildi",
  en_route: "Yolda",
  completed: "Tamamlandı",
  rejected: "Reddedildi",
  cancelled: "İptal edildi",
};

export const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  payment_pending: { bg: "#fef9c3", color: "#854d0e" },
  open:            { bg: "#dcfce7", color: "#166534" },
  accepted:        { bg: "#dbeafe", color: "#1e40af" },
  en_route:        { bg: "#fff7ed", color: "#9a3412" },
  completed:       { bg: "#f0fdf4", color: "#15803d" },
  rejected:        { bg: "#fef2f2", color: "#991b1b" },
  cancelled:       { bg: "#f1f5f9", color: "#475569" },
};

const DEFAULT_COLOR = { bg: "#f1f5f9", color: "#475569" };

export function statusBadge(status: string): { bg: string; color: string; label: string } {
  return {
    ...(STATUS_COLORS[status] ?? DEFAULT_COLOR),
    label: STATUS_LABELS[status] ?? status,
  };
}

export const ACTIVE_STATUSES = new Set<string>([
  "payment_pending",
  "open",
  "accepted",
  "en_route",
]);

export const FINAL_STATUSES = new Set<string>([
  "completed",
  "rejected",
  "cancelled",
]);
