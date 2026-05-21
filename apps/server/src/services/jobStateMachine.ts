import { JobStatus } from "@prisma/client";

export type JobAction = "cancel" | "accept" | "reject" | "en_route" | "complete";

type TransitionResult =
  | { ok: true; nextStatus: JobStatus }
  | { ok: false; message: string };

export function resolveTransition(action: JobAction, current: JobStatus): TransitionResult {
  if (action === "cancel") {
    if (current === JobStatus.accepted || current === JobStatus.en_route) {
      return { ok: false, message: "Kabul sonrası iptal edilemez" };
    }
    if (current === JobStatus.completed || current === JobStatus.cancelled || current === JobStatus.rejected) {
      return { ok: false, message: "Bu durumda iptal edilemez" };
    }
    return { ok: true, nextStatus: JobStatus.cancelled };
  }

  if (action === "accept") {
    return current === JobStatus.open
      ? { ok: true, nextStatus: JobStatus.accepted }
      : { ok: false, message: "Yalnızca açık talepler kabul edilebilir" };
  }

  if (action === "reject") {
    return current === JobStatus.open
      ? { ok: true, nextStatus: JobStatus.rejected }
      : { ok: false, message: "Yalnızca açık talepler reddedilebilir" };
  }

  if (action === "en_route") {
    return current === JobStatus.accepted
      ? { ok: true, nextStatus: JobStatus.en_route }
      : { ok: false, message: "Önce talep kabul edilmelidir" };
  }

  if (action === "complete") {
    return current === JobStatus.en_route
      ? { ok: true, nextStatus: JobStatus.completed }
      : { ok: false, message: "Önce yola çıkıldı durumuna geçilmelidir" };
  }

  return { ok: false, message: "Bilinmeyen işlem" };
}
