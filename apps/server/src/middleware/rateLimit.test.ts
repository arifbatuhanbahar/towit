import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { rateLimit } from "./rateLimit.js";

function makeReqRes(ip = "1.2.3.4", path = "/x") {
  const req = { ip, socket: { remoteAddress: ip }, baseUrl: "", path } as unknown as Request;
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
  const next: NextFunction = vi.fn();
  return { req, res, next, headers };
}

describe("rateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("max sınırına kadar next() çağırır", () => {
    const mw = rateLimit({ windowMs: 60_000, max: 3 });
    for (let i = 0; i < 3; i++) {
      const { req, res, next } = makeReqRes();
      mw(req, res, next);
      expect(next).toHaveBeenCalledOnce();
    }
  });

  it("sınır aşıldığında 429 döner ve next()'i çağırmaz", () => {
    const mw = rateLimit({ windowMs: 60_000, max: 2 });
    const first = makeReqRes();
    mw(first.req, first.res, first.next);
    const second = makeReqRes();
    mw(second.req, second.res, second.next);

    const third = makeReqRes();
    mw(third.req, third.res, third.next);

    expect(third.next).not.toHaveBeenCalled();
    expect(third.res.status).toHaveBeenCalledWith(429);
  });

  it("pencere sıfırlandıktan sonra tekrar izin verir", () => {
    const mw = rateLimit({ windowMs: 1000, max: 1 });
    const a = makeReqRes();
    mw(a.req, a.res, a.next);
    const b = makeReqRes();
    mw(b.req, b.res, b.next);
    expect(b.res.status).toHaveBeenCalledWith(429);

    vi.advanceTimersByTime(1500);

    const c = makeReqRes();
    mw(c.req, c.res, c.next);
    expect(c.next).toHaveBeenCalledOnce();
  });

  it("farklı IP'ler ayrı sayaca sahiptir", () => {
    const mw = rateLimit({ windowMs: 60_000, max: 1 });
    const a = makeReqRes("1.1.1.1");
    mw(a.req, a.res, a.next);
    const b = makeReqRes("2.2.2.2");
    mw(b.req, b.res, b.next);
    expect(a.next).toHaveBeenCalledOnce();
    expect(b.next).toHaveBeenCalledOnce();
  });
});
