import { describe, expect, it } from "vitest";
import { JobStatus } from "@prisma/client";
import { resolveTransition } from "./jobStateMachine.js";

describe("resolveTransition", () => {
  it("allows open -> accepted", () => {
    expect(resolveTransition("accept", JobStatus.open)).toEqual({
      ok: true,
      nextStatus: JobStatus.accepted,
    });
  });

  it("rejects invalid complete transition", () => {
    expect(resolveTransition("complete", JobStatus.accepted)).toEqual({
      ok: false,
      message: "Önce yola çıkıldı durumuna geçilmelidir",
    });
  });

  it("prevents cancellation after accepted", () => {
    expect(resolveTransition("cancel", JobStatus.accepted)).toEqual({
      ok: false,
      message: "Kabul sonrası iptal edilemez",
    });
  });
});
