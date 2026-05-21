import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { storedUser, searchPlaces, getJobs } from './api';

function makeToken(payload: Record<string, unknown>) {
  return `x.${btoa(JSON.stringify(payload))}.y`;
}

describe('storedUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns decoded user when token is valid', () => {
    localStorage.setItem(
      'towit_access',
      makeToken({
        sub: 'user_1',
        role: 'customer',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );

    expect(storedUser()).toEqual({
      id: 'user_1',
      role: 'customer',
      email: 'user@example.com',
    });
  });

  it('returns null when token is expired', () => {
    localStorage.setItem(
      'towit_access',
      makeToken({
        sub: 'user_1',
        role: 'operator',
        email: 'old@example.com',
        exp: Math.floor(Date.now() / 1000) - 60,
      })
    );

    expect(storedUser()).toBeNull();
  });
});

describe('searchPlaces', () => {
  it('returns empty array for empty query without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await searchPlaces('   ');

    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('request auth refresh flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries original request after a successful token refresh', async () => {
    localStorage.setItem('towit_access', 'old-access');
    localStorage.setItem('towit_refresh', 'refresh-token');

    const fetchMock = vi.fn()
      // first protected request -> 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'expired' } }),
      })
      // refresh request -> new tokens
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      })
      // retried original request -> success
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jobs: [] }),
      });

    vi.stubGlobal('fetch', fetchMock);
    const result = await getJobs();

    expect(result).toEqual({ jobs: [] });
    expect(localStorage.getItem('towit_access')).toBe('new-access');
    expect(localStorage.getItem('towit_refresh')).toBe('new-refresh');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('clears tokens when refresh fails', async () => {
    localStorage.setItem('towit_access', 'old-access');
    localStorage.setItem('towit_refresh', 'refresh-token');

    const fetchMock = vi.fn()
      // first protected request -> 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'expired' } }),
      })
      // refresh request -> fail
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'invalid refresh' } }),
      });

    vi.stubGlobal('fetch', fetchMock);
    await expect(getJobs()).rejects.toThrow('expired');

    expect(localStorage.getItem('towit_access')).toBeNull();
    expect(localStorage.getItem('towit_refresh')).toBeNull();
  });
});
